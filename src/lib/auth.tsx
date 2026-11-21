import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseReady } from './supabase';
import type { Profile } from './types';
import { track } from './analytics';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (p: { email: string; password: string; name: string; phone: string; next?: string }) => Promise<{ needsConfirmation: boolean }>;
  signInGoogle: (next?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string | undefined) => {
    if (!uid) return setProfile(null);
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      // evita deadlock do supabase-js: carrega o perfil fora do callback
      setTimeout(() => loadProfile(s?.user.id), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message === 'Email not confirmed' ? 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).' : error.message);
        track('login', { method: 'email' });
      },
      async signUp({ email, password, name, phone, next = '/minha-conta' }) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, phone }, emailRedirectTo: `${location.origin}/confirmado?next=${encodeURIComponent(next)}` },
        });
        if (error) throw new Error(error.message.includes('already') ? 'Este e-mail já está cadastrado. Tente entrar.' : error.message);
        track('sign_up', { method: 'email' });
        return { needsConfirmation: !data.session };
      },
      async signInGoogle(next = '/minha-conta') {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}${next}` } });
        if (error) throw new Error(error.message);
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/entrar?modo=nova-senha` });
        if (error) throw new Error(error.message);
      },
      async signOut() {
        await supabase.auth.signOut();
        setProfile(null);
      },
      refreshProfile: () => loadProfile(session?.user.id),
    }),
    [session, profile, loading, loadProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return v;
}

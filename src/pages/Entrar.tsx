import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useSearch } from 'wouter';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { supabase, supabaseReady } from '@/lib/supabase';
import { useSEO } from '@/hooks/useSEO';
import { Button, Field, Input } from '@/components/ui';
import { GlassCard } from '@/components/GlassCard';
import { cn } from '@/lib/utils';

const googleEnabled = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN !== 'false';

type Mode = 'entrar' | 'cadastrar' | 'recuperar' | 'nova-senha';

export default function Entrar() {
  useSEO({ title: 'Entrar', noindex: true });
  const search = new URLSearchParams(useSearch());
  const redirect = search.get('redirect') || '/minha-conta';
  const [, navigate] = useLocation();
  const { user, loading, signIn, signUp, signInGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>(search.get('modo') === 'nova-senha' ? 'nova-senha' : search.get('modo') === 'cadastrar' ? 'cadastrar' : 'entrar');
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '', password2: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    if (search.get('confirmado') === '1' && !loading && !user) toast.success('E-mail confirmado! Entre com seu e-mail e senha para continuar.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (!loading && user && mode !== 'nova-senha') navigate(redirect, { replace: true });
  }, [user, loading, mode, redirect, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabaseReady) return toast.error('O sistema de contas ainda não foi configurado (veja o README).');
    setBusy(true);
    try {
      if (mode === 'entrar') {
        await signIn(f.email.trim(), f.password);
        navigate(redirect, { replace: true });
      } else if (mode === 'cadastrar') {
        if (f.name.trim().length < 3) throw new Error('Informe seu nome completo.');
        if (f.phone.replace(/\D/g, '').length < 10) throw new Error('Informe um WhatsApp válido com DDD.');
        if (f.password.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
        if (f.password !== f.password2) throw new Error('As senhas não conferem.');
        const { needsConfirmation } = await signUp({ email: f.email.trim(), password: f.password, name: f.name.trim(), phone: f.phone.trim(), next: redirect });
        if (needsConfirmation) {
          toast.success('Conta criada! Enviamos um link de confirmação para o seu e-mail.');
          setMode('entrar');
        } else navigate(redirect, { replace: true });
      } else if (mode === 'recuperar') {
        await resetPassword(f.email.trim());
        toast.success('Se o e-mail existir, você receberá um link para criar uma nova senha.');
        setMode('entrar');
      } else {
        if (f.password.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
        if (f.password !== f.password2) throw new Error('As senhas não conferem.');
        const { error } = await supabase.auth.updateUser({ password: f.password });
        if (error) throw new Error(error.message);
        toast.success('Senha alterada com sucesso!');
        navigate('/minha-conta', { replace: true });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<Mode, string> = { entrar: 'Entrar na minha conta', cadastrar: 'Criar minha conta', recuperar: 'Recuperar senha', 'nova-senha': 'Criar nova senha' };

  return (
    <section className="min-h-screen pt-32 pb-16 px-6 flex items-start justify-center">
      <div className="w-full max-w-md">
        <GlassCard className="animate-fade-in-up">
          <h1 className="text-3xl font-serif text-center mb-2">{titles[mode]}</h1>
          <p className="text-center text-sm text-muted-foreground mb-6">Acompanhe, remarque e cancele seus horários em um só lugar.</p>

          {(mode === 'entrar' || mode === 'cadastrar') && (
            <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-muted mb-6" role="tablist">
              {(['entrar', 'cadastrar'] as const).map((m) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={cn('rounded-full py-2 text-sm font-medium transition', mode === m ? 'bg-white shadow text-foreground' : 'text-muted-foreground')}>
                  {m === 'entrar' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>
          )}

          {googleEnabled && (mode === 'entrar' || mode === 'cadastrar') && (
            <>
              <Button type="button" variant="outline" size="lg" className="w-full bg-white/70" onClick={() => signInGoogle(redirect).catch((e) => toast.error(e.message))}>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.9z"/></svg>
                Continuar com Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou use seu e-mail<span className="h-px flex-1 bg-border" /></div>
            </>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === 'cadastrar' && (
              <>
                <Field label="Nome completo"><Input value={f.name} onChange={set('name')} autoComplete="name" required /></Field>
                <Field label="WhatsApp (com DDD)"><Input value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="(98) 99999-9999" required /></Field>
              </>
            )}
            {mode !== 'nova-senha' && <Field label="E-mail"><Input type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></Field>}
            {mode !== 'recuperar' && (
              <Field label={mode === 'nova-senha' ? 'Nova senha' : 'Senha'} hint={mode !== 'entrar' ? 'Mínimo de 8 caracteres' : undefined}>
                <Input type="password" value={f.password} onChange={set('password')} autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'} required />
              </Field>
            )}
            {(mode === 'cadastrar' || mode === 'nova-senha') && <Field label="Repita a senha"><Input type="password" value={f.password2} onChange={set('password2')} autoComplete="new-password" required /></Field>}

            <Button type="submit" loading={busy} className="w-full" size="lg">
              {mode === 'entrar' ? 'Entrar' : mode === 'cadastrar' ? 'Criar conta' : mode === 'recuperar' ? 'Enviar link' : 'Salvar nova senha'}
            </Button>
          </form>

          {mode === 'entrar' && (
            <button type="button" onClick={() => setMode('recuperar')} className="mt-4 block mx-auto text-sm text-primary hover:underline">Esqueci minha senha</button>
          )}
          {mode === 'recuperar' && <button type="button" onClick={() => setMode('entrar')} className="mt-4 block mx-auto text-sm text-primary hover:underline">Voltar para o login</button>}

        </GlassCard>
      </div>
    </section>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useSearch } from 'wouter';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { supabase, supabaseReady } from '@/lib/supabase';
import { useSEO } from '@/hooks/useSEO';
import { Button, Field, Input } from '@/components/ui';
import { GlassCard } from '@/components/GlassCard';
import { cn } from '@/lib/utils';

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
        const { needsConfirmation } = await signUp({ email: f.email.trim(), password: f.password, name: f.name.trim(), phone: f.phone.trim() });
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

          {import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === 'true' && (mode === 'entrar' || mode === 'cadastrar') && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
              <Button variant="outline" className="w-full" onClick={() => signInGoogle().catch((e) => toast.error(e.message))}>Continuar com Google</Button>
            </>
          )}
        </GlassCard>
      </div>
    </section>
  );
}

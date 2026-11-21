import { useEffect, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { CheckCircle2, MailWarning } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { authUrlError } from '@/lib/supabase';
import { useSEO } from '@/hooks/useSEO';
import { GlassCard } from '@/components/GlassCard';
import { BackToSiteButton } from '@/components/BackToSiteButton';
import { Spinner } from '@/components/ui';

const safeNext = (v: string | null) => (v && v.startsWith('/') && !v.startsWith('//') ? v : '/minha-conta');

export default function Confirmado() {
  useSEO({ title: 'E-mail confirmado', noindex: true });
  const next = safeNext(new URLSearchParams(useSearch()).get('next'));
  const { user, loading } = useAuth();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setWaited(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  const expired = !!authUrlError;
  const ok = !expired && !!user;
  const pending = !expired && !user && (loading || !waited);
  const backPath = `/entrar?redirect=${encodeURIComponent(next)}&confirmado=1`;
  const nextLabel = next === '/agendar' ? 'Continuar meu agendamento' : 'Ir para minha conta';

  return (
    <section className="min-h-screen pt-32 pb-16 px-6 flex justify-center">
      <GlassCard className="max-w-lg w-full text-center animate-fade-in-up h-fit">
        {pending ? <Spinner /> : expired ? (
          <>
            <MailWarning className="mx-auto text-amber-600 mb-4" size={56} />
            <h1 className="text-3xl font-serif mb-2">Link expirado</h1>
            <p className="text-muted-foreground mb-6">Este link de confirmação não é mais válido (links valem por pouco tempo e só podem ser usados uma vez). Entre com seu e-mail e senha ou crie a conta novamente para receber outro.</p>
            <div className="flex flex-col gap-3">
              <Link href="/entrar?modo=cadastrar" className="btn-glass-gold px-6 py-3 inline-flex items-center justify-center">Receber novo link</Link>
              <BackToSiteButton path="/" />
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto text-emerald-600 mb-4" size={56} />
            <h1 className="text-3xl font-serif mb-2">E-mail confirmado!</h1>
            <p className="text-muted-foreground mb-6">{ok ? 'Sua conta está pronta. Agora é só escolher o serviço e o horário; quando a Valeska confirmar, o convite chega direto no seu Google Agenda.' : 'Seu e-mail já está confirmado. Entre na sua conta para continuar.'}</p>
            <div className="flex flex-col gap-3">
              <Link href={ok ? next : `/entrar?redirect=${encodeURIComponent(next)}`} className="btn-glass-gold px-6 py-3 inline-flex items-center justify-center">{ok ? nextLabel : 'Entrar na minha conta'}</Link>
              <BackToSiteButton path={backPath} />
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Abriu o link pelo app do e-mail? “Voltar ao site” leva você ao Chrome, Safari ou ao navegador que você usa.</p>
          </>
        )}
      </GlassCard>
    </section>
  );
}

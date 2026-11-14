import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import { CalendarPlus, LogOut, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api, supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/settings';
import { useSEO } from '@/hooks/useSEO';
import type { Booking } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';
import { downloadIcs, fmtDateLong, fmtTime, googleCalendarLink, money } from '@/lib/time';
import { Badge, Button, Empty, Field, Input, Select, Spinner, Textarea } from '@/components/ui';
import { GlassCard } from '@/components/GlassCard';
import { cn } from '@/lib/utils';

type Tab = 'proximos' | 'historico' | 'dados' | 'depoimento';

export default function MinhaConta() {
  useSEO({ title: 'Minha conta', noindex: true });
  const { user, profile, loading, signOut, refreshProfile, isAdmin } = useAuth();
  const { site, booking: cfg } = useSettings();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>('proximos');
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/entrar?redirect=/minha-conta', { replace: true });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('bookings').select('*').eq('client_id', user.id).order('starts_at', { ascending: false });
    if (error) toast.error('Não foi possível carregar seus agendamentos.');
    setBookings((data as Booking[]) || []);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  if (loading || !user) return <Spinner className="pt-40" />;

  const now = Date.now();
  const upcoming = (bookings || []).filter((b) => new Date(b.ends_at).getTime() >= now && ['pendente', 'confirmado'].includes(b.status)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const history = (bookings || []).filter((b) => !upcoming.includes(b));
  const hasDone = (bookings || []).some((b) => b.status === 'concluido');

  async function cancel(b: Booking) {
    if (!confirm('Deseja realmente cancelar este horário?')) return;
    try {
      const { error } = await supabase.rpc('cancel_my_booking', { p_id: b.id });
      if (error) throw new Error(error.message);
      api('calendar-sync', { body: { bookingId: b.id } }).catch(() => {});
      toast.success('Agendamento cancelado.');
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const tabs: [Tab, string][] = [['proximos', `Próximos (${upcoming.length})`], ['historico', 'Histórico'], ['dados', 'Meus dados'], ['depoimento', 'Depoimento']];

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-serif">Olá, <span className="text-primary italic font-light">{(profile?.full_name || 'cliente').split(' ')[0]}</span></h1>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && <a href="/admin" className="rounded-full border border-primary/40 px-4 py-2 text-sm text-primary hover:bg-primary/10">Painel admin</a>}
            <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate('/'))}><LogOut size={14} /> Sair</Button>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-full bg-muted mb-6 overflow-x-auto" role="tablist">
          {tabs.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('rounded-full px-4 py-2 text-sm whitespace-nowrap transition', tab === k ? 'bg-white shadow font-medium' : 'text-muted-foreground')}>{l}</button>
          ))}
        </div>

        {tab === 'proximos' && (
          <div className="space-y-4">
            {bookings === null ? <Spinner /> : upcoming.length === 0 ? (
              <GlassCard><Empty>Você não tem horários marcados.<div className="mt-4"><Link href="/agendar" className="btn-glass-gold inline-flex px-6 py-3">Agendar agora</Link></div></Empty></GlassCard>
            ) : upcoming.map((b) => {
              const canCancel = new Date(b.starts_at).getTime() - now >= cfg.cancel_hours * 3600000;
              return (
                <GlassCard key={b.id} className="!p-5">
                  <div className="flex justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-serif text-xl">{b.service_title}</p>
                      <p className="text-sm text-muted-foreground capitalize">{fmtDateLong(b.starts_at)} · {fmtTime(b.starts_at)}</p>
                    </div>
                    <Badge tone={b.status}>{STATUS_LABEL[b.status]}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <a href={googleCalendarLink(b, site.address, site.name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-xs hover:bg-primary/10"><CalendarPlus size={14} /> Google Agenda</a>
                    <Button variant="outline" size="sm" onClick={() => downloadIcs(b, site.address, site.name)}>.ics</Button>
                    {canCancel
                      ? <Button variant="danger" size="sm" onClick={() => cancel(b)}>Cancelar</Button>
                      : <a href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Olá! Preciso alterar meu horário de ${b.service_title} em ${fmtDateLong(b.starts_at)} às ${fmtTime(b.starts_at)}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs hover:bg-muted">Alterar pelo WhatsApp</a>}
                  </div>
                  {!canCancel && <p className="text-xs text-muted-foreground mt-2">O cancelamento online é permitido até {cfg.cancel_hours}h antes do horário.</p>}
                </GlassCard>
              );
            })}
          </div>
        )}

        {tab === 'historico' && (
          <div className="space-y-3">
            {bookings === null ? <Spinner /> : history.length === 0 ? <GlassCard><Empty>Seu histórico aparecerá aqui.</Empty></GlassCard> : history.map((b) => (
              <GlassCard key={b.id} className="!p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium">{b.service_title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{fmtDateLong(b.starts_at)} · {fmtTime(b.starts_at)}{b.status === 'concluido' && ` · ${money(b.final_price_cents ?? b.price_cents)}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={b.status}>{STATUS_LABEL[b.status]}</Badge>
                  {b.service_id && <Link href={`/agendar?servico=${b.service_id}`} className="text-xs text-primary hover:underline">Agendar de novo</Link>}
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {tab === 'dados' && <ProfileForm onSaved={refreshProfile} />}
        {tab === 'depoimento' && <TestimonialForm enabled={hasDone} />}
      </div>
    </section>
  );
}

function ProfileForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const { profile, user } = useAuth();
  const [f, setF] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '', birthday: profile?.birthday || '', marketing_opt_in: profile?.marketing_opt_in || false });
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setF({ full_name: profile?.full_name || '', phone: profile?.phone || '', birthday: profile?.birthday || '', marketing_opt_in: profile?.marketing_opt_in || false }), [profile]);

  async function save() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ full_name: f.full_name.trim(), phone: f.phone.trim(), birthday: f.birthday || null, marketing_opt_in: f.marketing_opt_in }).eq('id', user.id);
    if (!error && pwd) {
      if (pwd.length < 8) { setBusy(false); return toast.error('A nova senha deve ter ao menos 8 caracteres.'); }
      const r = await supabase.auth.updateUser({ password: pwd });
      if (r.error) { setBusy(false); return toast.error(r.error.message); }
      setPwd('');
    }
    setBusy(false);
    if (error) return toast.error('Não foi possível salvar.');
    toast.success('Dados atualizados!');
    onSaved();
  }

  return (
    <GlassCard className="space-y-4">
      <Field label="Nome completo"><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="WhatsApp"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" /></Field>
        <Field label="Aniversário" hint="Para mimos e promoções no seu mês"><Input type="date" value={f.birthday} onChange={(e) => setF({ ...f, birthday: e.target.value })} /></Field>
      </div>
      <Field label="Nova senha (opcional)"><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" /></Field>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#b98c00]" checked={f.marketing_opt_in} onChange={(e) => setF({ ...f, marketing_opt_in: e.target.checked })} /> Aceito receber lembretes e novidades pelo WhatsApp</label>
      <Button loading={busy} onClick={save}>Salvar alterações</Button>
    </GlassCard>
  );
}

function TestimonialForm({ enabled }: { enabled: boolean }) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  if (!enabled) return <GlassCard><Empty>Depois do seu primeiro atendimento concluído, você poderá deixar seu depoimento por aqui. 💛</Empty></GlassCard>;
  if (sent) return <GlassCard><Empty>Obrigada pelo carinho! Seu depoimento será publicado após aprovação.</Empty></GlassCard>;
  async function send() {
    if (!user || text.trim().length < 10) return toast.error('Escreva pelo menos 10 caracteres.');
    setBusy(true);
    const { error } = await supabase.from('testimonials').insert({ client_id: user.id, name: profile?.full_name || 'Cliente', role: 'Cliente', text: text.trim(), rating });
    setBusy(false);
    if (error) return toast.error('Não foi possível enviar agora.');
    setSent(true);
  }
  return (
    <GlassCard className="space-y-4">
      <p className="font-serif text-xl">Como foi sua experiência?</p>
      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} estrelas`}><Star className={cn('h-7 w-7 text-accent', n <= rating && 'fill-current')} /></button>)}</div>
      <Textarea rows={4} maxLength={600} value={text} onChange={(e) => setText(e.target.value)} placeholder="Conte como foi o atendimento e o resultado…" />
      <Button loading={busy} onClick={send}>Enviar depoimento</Button>
    </GlassCard>
  );
}

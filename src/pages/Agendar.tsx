import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { toast } from 'sonner';
import { CalendarCheck, CalendarPlus, CheckCircle2, Clock, MessageCircle } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { useAuth } from '@/lib/auth';
import { api, supabase, supabaseReady } from '@/lib/supabase';
import { addDays, dateKey, downloadIcs, durationLabel, fmtDateLong, fmtKeyLong, fmtTime, googleCalendarLink, money, weekdayOf } from '@/lib/time';
import { track } from '@/lib/analytics';
import { useSEO } from '@/hooks/useSEO';
import type { Booking, BusinessHour } from '@/lib/types';
import { Button, Field, Input, Spinner, Textarea } from '@/components/ui';
import { MonthPicker } from '@/components/MonthPicker';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { cn } from '@/lib/utils';

const DRAFT = 'vc_booking_draft';

const addMin = (t: string, m: number) => { const x = Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) + m; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };

export default function Agendar() {
  useSEO({ title: 'Agendar horário', description: 'Escolha o serviço, o dia e o horário e agende online em poucos cliques.' });
  const { site, services, booking: cfg } = useSettings();
  const { user, profile, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const search = new URLSearchParams(useSearch());

  const [serviceId, setServiceId] = useState<number | null>(Number(search.get('servico')) || null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsMsg, setSlotsMsg] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState<Booking | null>(null);

  const service = services.find((s) => s.id === serviceId) || null;
  const today = dateKey();
  const minKey = useMemo(() => dateKey(new Date(Date.now() + cfg.min_notice_hours * 3600000)), [cfg.min_notice_hours]);
  const maxKey = addDays(today, cfg.max_days_ahead);

  // restaura rascunho (volta do login)
  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT) || 'null');
      if (d && user) {
        setServiceId(d.serviceId ?? null);
        setDate(d.date ?? null);
        setTime(d.time ?? null);
        setNotes(d.notes ?? '');
        sessionStorage.removeItem(DRAFT);
      }
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => setPhone(profile?.phone || ''), [profile?.phone]);

  useEffect(() => {
    if (!supabaseReady) return;
    supabase.from('business_hours').select('*').then(({ data }) => setHours((data as BusinessHour[]) || []));
    supabase.from('blocked_dates').select('date').gte('date', today).then(({ data }) => setBlocked(new Set((data || []).map((r: any) => r.date))));
  }, [today]);

  const dayClosed = (k: string) => {
    if (blocked.has(k)) return true;
    const h = hours.find((x) => x.weekday === weekdayOf(k));
    return hours.length > 0 && !(h && h.is_open);
  };

  useEffect(() => {
    setTime(null);
    setSlots(null);
    if (!date || !serviceId) return;
    let cancelled = false;
    setLoadingSlots(true);
    fetch(`/api/availability?date=${date}&serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setSlots(j.slots || []);
        setSlotsMsg(j.reason || j.error || '');
      })
      .catch(() => !cancelled && (setSlots([]), setSlotsMsg('Não foi possível consultar a agenda. Tente novamente.')))
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => { cancelled = true; };
  }, [date, serviceId, tick]);

  function goLogin(modo: 'entrar' | 'cadastrar') {
    sessionStorage.setItem(DRAFT, JSON.stringify({ serviceId, date, time, notes }));
    navigate(`/entrar?redirect=${encodeURIComponent('/agendar')}${modo === 'cadastrar' ? '&modo=cadastrar' : ''}`);
  }

  async function confirm() {
    if (!service || !date || !time) return;
    if (phone.replace(/\D/g, '').length < 10) return toast.error('Informe um WhatsApp válido com DDD.');
    setSaving(true);
    track('booking_started', { service: service.title });
    try {
      const { booking } = await api<{ booking: Booking }>('book', { body: { serviceId: service.id, date, time, notes, phone } });
      setDone(booking);
      track('booking_completed', { service: service.title, value: service.price_cents / 100, currency: 'BRL' });
    } catch (e) {
      toast.error((e as Error).message);
      // atualiza os horários caso alguém tenha reservado antes
      setTick((t) => t + 1);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    const msg = `Olá! Acabei de agendar ${done.service_title} para ${fmtDateLong(done.starts_at)} às ${fmtTime(done.starts_at)}.`;
    return (
      <section className="min-h-screen pt-32 pb-16 px-6 flex justify-center">
        <GlassCard className="max-w-lg w-full text-center animate-fade-in-up h-fit">
          <CheckCircle2 className="mx-auto text-emerald-600 mb-4" size={56} />
          <h1 className="text-3xl font-serif mb-2">{done.status === 'confirmado' ? 'Horário confirmado!' : 'Solicitação enviada!'}</h1>
          <p className="text-muted-foreground mb-6">{done.status === 'confirmado' ? 'Tudo certo! Esperamos você.' : 'Assim que a Valeska confirmar, o status muda na sua conta. Qualquer dúvida, chame no WhatsApp.'}</p>
          <div className="glass rounded-2xl p-5 text-left mb-6">
            <p className="font-serif text-xl">{done.service_title}</p>
            <p className="text-sm text-muted-foreground capitalize mt-1">{fmtDateLong(done.starts_at)} · {fmtTime(done.starts_at)}</p>
            <p className="text-sm text-muted-foreground mt-1">{site.address}</p>
          </div>
          <div className="flex flex-col gap-3">
            <a href={googleCalendarLink(done, site.address, site.name)} target="_blank" rel="noopener noreferrer" className="btn-glass-gold px-6 py-3 inline-flex items-center justify-center gap-2" onClick={() => track('add_to_google_calendar')}><CalendarPlus size={18} /> Adicionar ao Google Agenda</a>
            <Button variant="outline" onClick={() => downloadIcs(done, site.address, site.name)}><CalendarCheck size={16} /> Baixar .ics (Apple / Outlook)</Button>
            <a href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-sm text-primary hover:underline"><MessageCircle size={16} /> Avisar pelo WhatsApp</a>
            <Link href="/minha-conta" className="text-sm text-muted-foreground hover:text-primary">Ver meus agendamentos</Link>
          </div>
        </GlassCard>
      </section>
    );
  }

  if (!supabaseReady) {
    return (
      <section className="min-h-screen pt-32 px-6 flex justify-center"><GlassCard className="max-w-lg h-fit text-center">
        <h1 className="text-3xl font-serif mb-3">Agendamento online</h1>
        <p className="text-muted-foreground mb-6">O agendamento online ainda não foi ativado neste ambiente. Enquanto isso, agende pelo WhatsApp.</p>
        <GlassButton href={`https://wa.me/${site.whatsapp}`}>Agendar pelo WhatsApp</GlassButton>
      </GlassCard></section>
    );
  }

  const step = !service ? 1 : !date || !time ? 2 : 3;

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-serif mb-3">Agende seu <span className="italic font-light text-primary">horário</span></h1>
          <div className="flex justify-center gap-2 text-xs text-muted-foreground mt-4">
            {['Serviço', 'Data e horário', 'Confirmação'].map((l, i) => (
              <span key={l} className={cn('px-3 py-1 rounded-full border', step === i + 1 ? 'bg-primary/15 border-primary/40 text-primary font-medium' : step > i + 1 ? 'border-primary/30' : 'border-border')}>{i + 1}. {l}</span>
            ))}
          </div>
        </div>

        <h2 className="font-serif text-2xl mb-4">1. Escolha o serviço</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {services.map((s) => (
            <button key={s.id} type="button" onClick={() => setServiceId(s.id)} aria-pressed={serviceId === s.id}
              className={cn('glass rounded-2xl p-5 text-left transition hover:-translate-y-0.5', serviceId === s.id && 'ring-2 ring-primary bg-primary/10')}>
              <div className="flex justify-between gap-3">
                <p className="font-serif text-lg">{s.title}</p>
                {s.tag && <span className="text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5 h-fit">{s.tag}</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
              <p className="text-sm mt-3 flex items-center gap-3"><span className="flex items-center gap-1 text-muted-foreground"><Clock size={14} /> {durationLabel(s.duration_min)}</span><span className="font-medium">{s.price_prefix} {money(s.price_cents)}</span></p>
            </button>
          ))}
        </div>

        {service && (
          <>
            <h2 className="font-serif text-2xl mb-4">2. Escolha o dia e o horário</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <MonthPicker value={date} onChange={setDate} isDisabled={dayClosed} minKey={minKey} maxKey={maxKey} />
              <div className="glass rounded-2xl p-5 min-h-[260px]">
                {!date ? <p className="text-sm text-muted-foreground">Selecione um dia no calendário para ver os horários livres.</p> : (
                  <>
                    <p className="font-serif text-lg capitalize">{fmtKeyLong(date)}</p><p className="text-xs text-muted-foreground mb-3">{service.title} · duração {durationLabel(service.duration_min)}. Os horários seguem o tempo do serviço.</p>
                    {loadingSlots && <Spinner />}
                    {!loadingSlots && slots && slots.length === 0 && <p className="text-sm text-muted-foreground">{slotsMsg || 'Sem horários livres neste dia. Tente outra data.'}</p>}
                    {!loadingSlots && slots && slots.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((t) => (
                          <button key={t} type="button" onClick={() => setTime(t)} aria-pressed={time === t} className={cn('rounded-xl border py-2 text-sm transition', time === t ? 'btn-glass-gold !rounded-xl' : 'border-input bg-white/60 hover:border-primary')}>{t}<span className="block text-[10px] opacity-70">até {addMin(t, service.duration_min)}</span></button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {service && date && time && (
          <>
            <h2 className="font-serif text-2xl mb-4">3. Confirme seu agendamento</h2>
            <GlassCard className="mb-10">
              <div className="grid sm:grid-cols-3 gap-4 text-sm mb-6">
                <div><p className="text-muted-foreground text-xs">Serviço</p><p className="font-medium">{service.title}</p></div>
                <div><p className="text-muted-foreground text-xs">Data e hora</p><p className="font-medium capitalize">{fmtKeyLong(date)} · {time} às {addMin(time, service.duration_min)}</p></div>
                <div><p className="text-muted-foreground text-xs">Valor</p><p className="font-medium">{service.price_prefix} {money(service.price_cents)}</p></div>
              </div>

              {authLoading ? <Spinner /> : !user ? (
                <div className="rounded-2xl bg-primary/10 p-5 text-center">
                  <p className="mb-4 text-sm">Para finalizar, entre na sua conta ou crie uma rápida. Seu horário escolhido fica guardado.</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button onClick={() => goLogin('entrar')}>Já tenho conta</Button>
                    <Button variant="outline" onClick={() => goLogin('cadastrar')}>Criar conta</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Agendando como <strong>{profile?.full_name || user.email}</strong></p>
                  <Field label="WhatsApp para contato (com DDD)"><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(98) 99999-9999" /></Field>
                  <Field label="Observações (opcional)" hint="Alergias, referências, primeira vez, etc."><Textarea rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                  <p className="text-xs text-muted-foreground">Cancelamentos online até {cfg.cancel_hours}h antes do horário. {cfg.auto_confirm ? '' : 'O horário será confirmado pela Valeska após o envio.'}</p>
                  <Button size="lg" className="w-full" loading={saving} onClick={confirm}>Confirmar agendamento</Button>
                </div>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useSearch } from 'wouter';
import { toast } from 'sonner';
import { CalendarPlus, MessageCircle, Plus, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Booking, BookingStatus, Profile, Service } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';
import { addDays, dateKey, durationLabel, fmtDateLong, fmtTime, money, toISO, waLink } from '@/lib/time';
import { Badge, Button, Card, Empty, Field, Input, Modal, Select, Spinner, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';
import { bookingValue, centsFromInput, inputFromCents, loadBusiness, syncBooking, useAsync } from '../lib';

type Range = 'hoje' | 'semana' | 'mes' | 'futuros' | 'passados' | 'todos';

export default function Agenda() {
  const search = new URLSearchParams(useSearch());
  const [range, setRange] = useState<Range>(search.get('status') === 'pendente' ? 'futuros' : 'semana');
  const [status, setStatus] = useState<string>(search.get('status') || '');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, loading, reload } = useAsync(async () => {
    const since = new Date(Date.now() - 400 * 86400000).toISOString();
    const [b, s, c, biz] = await Promise.all([
      supabase.from('bookings').select('*').gte('starts_at', since).order('starts_at', { ascending: true }).limit(3000),
      supabase.from('services').select('*').order('sort'),
      supabase.from('profiles').select('*').eq('role', 'client').order('full_name'),
      loadBusiness(),
    ]);
    return { bookings: (b.data as Booking[]) || [], services: (s.data as Service[]) || [], clients: (c.data as Profile[]) || [], biz };
  });

  const today = dateKey();
  const filtered = useMemo(() => {
    if (!data) return [];
    const weekEnd = addDays(today, 7);
    const monthEnd = addDays(today, 31);
    const now = Date.now();
    return data.bookings
      .filter((b) => {
        const k = dateKey(b.starts_at);
        if (range === 'hoje') return k === today;
        if (range === 'semana') return k >= today && k <= weekEnd;
        if (range === 'mes') return k >= today && k <= monthEnd;
        if (range === 'futuros') return new Date(b.ends_at).getTime() >= now;
        if (range === 'passados') return new Date(b.ends_at).getTime() < now;
        return true;
      })
      .filter((b) => !status || b.status === status)
      .filter((b) => !q || `${b.client_name} ${b.client_phone} ${b.service_title}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (range === 'passados' || range === 'todos' ? b.starts_at.localeCompare(a.starts_at) : a.starts_at.localeCompare(b.starts_at)));
  }, [data, range, status, q, today]);

  const groups = useMemo(() => {
    const m = new Map<string, Booking[]>();
    filtered.forEach((b) => { const k = dateKey(b.starts_at); m.set(k, [...(m.get(k) || []), b]); });
    return [...m.entries()];
  }, [filtered]);

  if (loading || !data) return <Spinner />;

  const ranges: [Range, string][] = [['hoje', 'Hoje'], ['semana', '7 dias'], ['mes', '30 dias'], ['futuros', 'Futuros'], ['passados', 'Passados'], ['todos', 'Todos']];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-serif">Agenda</h1>
        <Button onClick={() => setCreating(true)}><Plus size={16} /> Novo agendamento / bloqueio</Button>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {ranges.map(([k, l]) => <button key={k} onClick={() => setRange(k)} className={cn('rounded-full px-4 py-1.5 text-sm transition', range === k ? 'btn-glass-gold' : 'bg-muted hover:bg-muted/70')}>{l}</button>)}
        </div>
        <div className="grid sm:grid-cols-[1fr_200px] gap-3">
          <div className="relative"><Search className="absolute left-3 top-3 text-muted-foreground" size={16} /><Input className="pl-9" placeholder="Buscar por nome, telefone ou serviço" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos os status</option>{Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
        </div>
      </Card>

      {groups.length === 0 ? <Card><Empty>Nenhum agendamento encontrado neste filtro.</Empty></Card> : groups.map(([day, list]) => (
        <div key={day}>
          <h2 className="text-sm font-medium text-muted-foreground capitalize mb-2">{fmtDateLong(list[0].starts_at)}{day === today && ' · hoje'}</h2>
          <div className="space-y-2">
            {list.map((b) => (
              <button key={b.id} onClick={() => setSel(b)} className="w-full text-left glass rounded-2xl p-4 flex flex-wrap items-center gap-4 hover:ring-1 hover:ring-primary/40 transition">
                <div className="w-20 shrink-0"><p className="font-serif text-lg leading-none">{fmtTime(b.starts_at)}</p><p className="text-xs text-muted-foreground">até {fmtTime(b.ends_at)}</p></div>
                <div className="flex-1 min-w-[160px]">
                  <p className="font-medium">{b.source === 'bloqueio' ? '⛔ ' : ''}{b.client_name}</p>
                  <p className="text-sm text-muted-foreground">{b.service_title}{b.source === 'bloqueio' ? '' : ` · ${money(b.final_price_cents ?? b.price_cents)}`}</p>
                </div>
                <div className="flex items-center gap-2">{b.source !== 'site' && b.source !== 'bloqueio' && <Badge>manual</Badge>}<Badge tone={b.source === 'bloqueio' ? 'neutral' : b.status}>{b.source === 'bloqueio' && b.status !== 'cancelado' ? 'Bloqueio' : STATUS_LABEL[b.status]}</Badge></div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {sel && <BookingModal booking={sel} biz={data.biz} onClose={() => setSel(null)} onChanged={() => { setSel(null); reload(); }} />}
      {creating && <NewBookingModal services={data.services.filter((s) => s.active)} clients={data.clients} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); reload(); }} />}
    </div>
  );
}

function BookingModal({ booking, biz, onClose, onChanged }: { booking: Booking; biz: { name: string; address: string }; onClose: () => void; onChanged: () => void }) {
  const [b, setB] = useState(booking);
  const [adminNotes, setAdminNotes] = useState(booking.admin_notes || '');
  const [price, setPrice] = useState(inputFromCents(booking.final_price_cents ?? booking.price_cents));
  const [date, setDate] = useState(dateKey(booking.starts_at));
  const [time, setTime] = useState(fmtTime(booking.starts_at));
  const [busy, setBusy] = useState(false);
  const isBlock = b.source === 'bloqueio';

  async function update(patch: Partial<Booking>, ok = 'Salvo!') {
    setBusy(true);
    const { data, error } = await supabase.from('bookings').update(patch).eq('id', b.id).select('*').single();
    setBusy(false);
    if (error) return toast.error(error.code === '23P01' ? 'Esse horário conflita com outro agendamento.' : 'Não foi possível salvar.');
    setB(data as Booking);
    syncBooking(b.id);
    toast.success(ok);
    return data as Booking;
  }

  async function reschedule() {
    const dur = new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime();
    const start = new Date(toISO(date, time));
    const r = await update({ starts_at: start.toISOString(), ends_at: new Date(start.getTime() + dur).toISOString() }, 'Remarcado!');
    if (r) onChanged();
  }

  async function remove() {
    if (!confirm('Excluir definitivamente este registro? (Prefira "Cancelar" para manter o histórico.)')) return;
    if (b.google_event_id) await update({ status: 'cancelado' }); // remove do Google antes
    const { error } = await supabase.from('bookings').delete().eq('id', b.id);
    if (error) return toast.error('Não foi possível excluir.');
    toast.success('Excluído.');
    onChanged();
  }

  const when = `${fmtDateLong(b.starts_at)} às ${fmtTime(b.starts_at)}`;
  const first = b.client_name.split(' ')[0];
  const msgConfirm = `Olá, ${first}! Seu horário de ${b.service_title} está confirmado para ${when}. Endereço: ${biz.address}. Qualquer imprevisto, é só avisar! – ${biz.name}`;
  const msgRemind = `Oi, ${first}! Passando para lembrar do seu horário de ${b.service_title}, ${when}. Pode confirmar presença? 💛 – ${biz.name}`;

  return (
    <Modal open onClose={onClose} title={isBlock ? 'Bloqueio de horário' : 'Detalhes do agendamento'} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <p className="font-serif text-2xl">{b.client_name}</p>
            <p className="text-sm text-muted-foreground">{b.service_title}{!isBlock && ` · ${durationLabel(Math.round((new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60000))}`}</p>
            <p className="text-sm capitalize mt-1">{when}</p>
          </div>
          <Badge tone={b.status}>{STATUS_LABEL[b.status]}</Badge>
        </div>

        {!isBlock && (
          <div className="text-sm space-y-1">
            {b.client_phone && <p>📞 {b.client_phone}</p>}
            {b.client_email && <p>✉️ {b.client_email}</p>}
            {b.notes && <p className="rounded-xl bg-muted p-3">Obs. da cliente: {b.notes}</p>}
            <p className="text-xs text-muted-foreground">Origem: {b.source} · Google Agenda: {b.google_event_id ? 'sincronizado ✓' : 'não sincronizado'}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {b.status === 'pendente' && <Button variant="success" loading={busy} onClick={() => update({ status: 'confirmado' }, 'Confirmado!')}>Confirmar</Button>}
          {['pendente', 'confirmado'].includes(b.status) && !isBlock && <Button variant="success" loading={busy} onClick={async () => { const r = await update({ status: 'concluido', final_price_cents: centsFromInput(price) }, 'Marcado como concluído!'); if (r) onChanged(); }}>Concluir atendimento</Button>}
          {['pendente', 'confirmado'].includes(b.status) && !isBlock && <Button variant="outline" loading={busy} onClick={() => update({ status: 'faltou' }, 'Registrado como falta.')}>Faltou</Button>}
          {['pendente', 'confirmado'].includes(b.status) && <Button variant="danger" loading={busy} onClick={async () => { if (!confirm('Cancelar este horário?')) return; const r = await update({ status: 'cancelado', cancelled_by: 'admin' }, 'Cancelado.'); if (r) onChanged(); }}>{isBlock ? 'Remover bloqueio' : 'Cancelar'}</Button>}
          {['cancelado', 'faltou'].includes(b.status) && <Button variant="outline" loading={busy} onClick={() => update({ status: 'confirmado' }, 'Reativado!')}>Reativar</Button>}
          {isBlock && <Button variant="danger" onClick={remove}>Excluir</Button>}
        </div>

        {!isBlock && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Valor final cobrado (R$)" hint="Usado nos relatórios ao concluir"><Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" /></Field>
              <Field label="Notas internas"><Textarea rows={2} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} onBlur={() => adminNotes !== (b.admin_notes || '') && update({ admin_notes: adminNotes })} /></Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={waLink(b.client_phone, msgConfirm)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/40 text-emerald-700 px-4 py-2 text-sm hover:bg-emerald-50"><MessageCircle size={15} /> Confirmar por WhatsApp</a>
              <a href={waLink(b.client_phone, msgRemind)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 text-primary px-4 py-2 text-sm hover:bg-primary/10"><MessageCircle size={15} /> Enviar lembrete</a>
            </div>
          </>
        )}

        {['pendente', 'confirmado'].includes(b.status) && (
          <div className="rounded-2xl border border-border p-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2"><CalendarPlus size={16} /> Remarcar</p>
            <div className="flex flex-wrap gap-3 items-end">
              <Field label="Nova data"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
              <Field label="Novo horário"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
              <Button variant="outline" loading={busy} onClick={reschedule}>Salvar novo horário</Button>
            </div>
          </div>
        )}
        {!isBlock && <button onClick={remove} className="text-xs text-muted-foreground hover:text-destructive">Excluir registro permanentemente</button>}
      </div>
    </Modal>
  );
}

function NewBookingModal({ services, clients, onClose, onCreated }: { services: Service[]; clients: Profile[]; onClose: () => void; onCreated: () => void }) {
  const [mode, setMode] = useState<'agendamento' | 'bloqueio'>('agendamento');
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState<number | ''>(services[0]?.id ?? '');
  const [date, setDate] = useState(dateKey());
  const [time, setTime] = useState('09:00');
  const [blockMin, setBlockMin] = useState('60');
  const [blockTitle, setBlockTitle] = useState('Compromisso pessoal');
  const [status, setStatus] = useState<BookingStatus>('confirmado');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = clients.find((x) => x.id === clientId);
    if (c) { setName(c.full_name || ''); setPhone(c.phone || ''); }
  }, [clientId, clients]);

  async function save() {
    const start = new Date(toISO(date, time));
    if (Number.isNaN(start.getTime())) return toast.error('Data/hora inválida.');
    let row: Record<string, unknown>;
    if (mode === 'bloqueio') {
      const mins = Math.max(10, Number(blockMin) || 60);
      row = { client_name: 'Bloqueado', service_title: blockTitle || 'Bloqueio', price_cents: 0, starts_at: start.toISOString(), ends_at: new Date(start.getTime() + mins * 60000).toISOString(), status: 'confirmado', source: 'bloqueio' };
    } else {
      const s = services.find((x) => x.id === serviceId);
      if (!s) return toast.error('Escolha um serviço.');
      if (name.trim().length < 2) return toast.error('Informe o nome da cliente.');
      row = {
        client_id: clientId || null, client_name: name.trim(), client_phone: phone.trim() || null,
        client_email: clients.find((c) => c.id === clientId)?.email ?? null,
        service_id: s.id, service_title: s.title, price_cents: s.price_cents,
        starts_at: start.toISOString(), ends_at: new Date(start.getTime() + s.duration_min * 60000).toISOString(), status, source: 'manual',
      };
    }
    setBusy(true);
    const { data, error } = await supabase.from('bookings').insert(row).select('id').single();
    setBusy(false);
    if (error) return toast.error(error.code === '23P01' ? 'Já existe um agendamento ou bloqueio nesse horário.' : 'Não foi possível criar.');
    syncBooking(data.id);
    toast.success(mode === 'bloqueio' ? 'Horário bloqueado!' : 'Agendamento criado!');
    onCreated();
  }

  return (
    <Modal open onClose={onClose} title="Novo registro na agenda">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-muted">
          {(['agendamento', 'bloqueio'] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={cn('rounded-full py-2 text-sm', mode === m ? 'bg-white shadow font-medium' : 'text-muted-foreground')}>{m === 'agendamento' ? 'Agendamento' : 'Bloquear horário'}</button>)}
        </div>
        {mode === 'agendamento' ? (
          <>
            <Field label="Cliente cadastrada (opcional)"><Select value={clientId} onChange={(e) => setClientId(e.target.value)}><option value="">— Cliente sem cadastro —</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}</Select></Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="WhatsApp"><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></Field>
            </div>
            <Field label="Serviço"><Select value={serviceId} onChange={(e) => setServiceId(Number(e.target.value))}>{services.map((s) => <option key={s.id} value={s.id}>{s.title} · {durationLabel(s.duration_min)} · {money(s.price_cents)}</option>)}</Select></Field>
          </>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Motivo"><Input value={blockTitle} onChange={(e) => setBlockTitle(e.target.value)} /></Field>
            <Field label="Duração (minutos)"><Input type="number" min={10} step={5} value={blockMin} onChange={(e) => setBlockMin(e.target.value)} /></Field>
          </div>
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Data"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Horário"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
          {mode === 'agendamento' && <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus)}><option value="confirmado">Confirmado</option><option value="pendente">Pendente</option><option value="concluido">Concluído</option></Select></Field>}
        </div>
        <Button className="w-full" loading={busy} onClick={save}>{mode === 'bloqueio' ? 'Bloquear horário' : 'Criar agendamento'}</Button>
      </div>
    </Modal>
  );
}

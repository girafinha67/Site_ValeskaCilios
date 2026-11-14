import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BookingSettings, BusinessHour } from '@/lib/types';
import { defaultBooking } from '@/lib/settings';
import { dateKey, fmtDate } from '@/lib/time';
import { Button, Card, Field, Input, Spinner } from '@/components/ui';
import { useAsync } from '../lib';

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : '');

export default function Horarios() {
  const { data, loading, reload } = useAsync(async () => {
    const [h, b, s] = await Promise.all([
      supabase.from('business_hours').select('*').order('weekday'),
      supabase.from('blocked_dates').select('*').gte('date', dateKey()).order('date'),
      supabase.from('settings').select('value').eq('key', 'booking').maybeSingle(),
    ]);
    return { hours: (h.data as BusinessHour[]) || [], blocked: (b.data as { id: number; date: string; reason: string | null }[]) || [], booking: { ...defaultBooking, ...((s.data?.value as object) || {}) } as BookingSettings };
  });
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [rules, setRules] = useState<BookingSettings>(defaultBooking);
  const [bd, setBd] = useState({ date: '', reason: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) { setHours(Array.from({ length: 7 }).map((_, i) => data.hours.find((h) => h.weekday === i) || { weekday: i, is_open: false, start_time: '09:00', end_time: '19:00', break_start: null, break_end: null })); setRules(data.booking); } }, [data]);
  if (loading || !data) return <Spinner />;

  const patch = (i: number, p: Partial<BusinessHour>) => setHours((hs) => hs.map((h, j) => (j === i ? { ...h, ...p } : h)));

  async function saveAll() {
    setBusy(true);
    const [a, b] = await Promise.all([
      supabase.from('business_hours').upsert(hours.map((h) => ({ ...h, start_time: hhmm(h.start_time), end_time: hhmm(h.end_time), break_start: h.break_start || null, break_end: h.break_end || null }))),
      supabase.from('settings').upsert({ key: 'booking', value: rules, updated_at: new Date().toISOString() }),
    ]);
    setBusy(false);
    if (a.error || b.error) return toast.error('Não foi possível salvar.');
    toast.success('Horários e regras salvos!'); reload();
  }
  async function addBlock() {
    if (!bd.date) return toast.error('Escolha a data.');
    const { error } = await supabase.from('blocked_dates').insert({ date: bd.date, reason: bd.reason || null });
    if (error) return toast.error(error.code === '23505' ? 'Essa data já está bloqueada.' : 'Não foi possível bloquear.');
    setBd({ date: '', reason: '' }); reload();
  }
  const num = (k: keyof BookingSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setRules((r) => ({ ...r, [k]: Number(e.target.value) }));

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-serif">Horários e regras</h1>
      <Card className="space-y-3">
        <h2 className="font-serif text-lg">Horário de atendimento</h2>
        {hours.map((h, i) => (
          <div key={h.weekday} className="grid grid-cols-[130px_1fr] sm:grid-cols-[150px_70px_1fr] items-center gap-3 py-2 border-b border-border last:border-0">
            <span className="text-sm font-medium">{DAYS[i]}</span>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#b98c00]" checked={h.is_open} onChange={(e) => patch(i, { is_open: e.target.checked })} /> Abre</label>
            {h.is_open ? (
              <div className="col-span-2 sm:col-span-1 flex flex-wrap items-center gap-2 text-sm">
                <Input type="time" className="!w-28" value={hhmm(h.start_time)} onChange={(e) => patch(i, { start_time: e.target.value })} /> às <Input type="time" className="!w-28" value={hhmm(h.end_time)} onChange={(e) => patch(i, { end_time: e.target.value })} />
                <span className="text-muted-foreground ml-2">pausa</span>
                <Input type="time" className="!w-28" value={hhmm(h.break_start)} onChange={(e) => patch(i, { break_start: e.target.value || null })} /> – <Input type="time" className="!w-28" value={hhmm(h.break_end)} onChange={(e) => patch(i, { break_end: e.target.value || null })} />
              </div>
            ) : <span className="text-sm text-muted-foreground">Fechado</span>}
          </div>
        ))}
      </Card>

      <Card className="space-y-4">
        <h2 className="font-serif text-lg">Regras de agendamento</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Intervalo entre horários (min)" hint="De quanto em quanto tempo mostrar vagas"><Input type="number" min={10} step={5} value={rules.slot_step_min} onChange={num('slot_step_min')} /></Field>
          <Field label="Antecedência mínima (horas)"><Input type="number" min={0} value={rules.min_notice_hours} onChange={num('min_notice_hours')} /></Field>
          <Field label="Agenda aberta por (dias)"><Input type="number" min={1} value={rules.max_days_ahead} onChange={num('max_days_ahead')} /></Field>
          <Field label="Cancelamento online até (horas antes)"><Input type="number" min={0} value={rules.cancel_hours} onChange={num('cancel_hours')} /></Field>
          <Field label="Intervalo de preparo entre clientes (min)"><Input type="number" min={0} step={5} value={rules.buffer_min} onChange={num('buffer_min')} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#b98c00]" checked={rules.auto_confirm} onChange={(e) => setRules({ ...rules, auto_confirm: e.target.checked })} /> Confirmar automaticamente (sem precisar aprovar cada pedido)</label>
        <Button loading={busy} onClick={saveAll}>Salvar horários e regras</Button>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-serif text-lg">Dias bloqueados (feriados, folgas, viagens)</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <Field label="Data"><Input type="date" min={dateKey()} value={bd.date} onChange={(e) => setBd({ ...bd, date: e.target.value })} /></Field>
          <Field label="Motivo (opcional)" className="flex-1 min-w-[180px]"><Input value={bd.reason} onChange={(e) => setBd({ ...bd, reason: e.target.value })} /></Field>
          <Button variant="outline" onClick={addBlock}>Bloquear dia</Button>
        </div>
        {data.blocked.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum dia bloqueado.</p> : (
          <ul className="divide-y divide-border">
            {data.blocked.map((b) => (
              <li key={b.id} className="py-2 flex justify-between items-center text-sm"><span>{fmtDate(`${b.date}T12:00:00-03:00`)} {b.reason && <span className="text-muted-foreground">· {b.reason}</span>}</span><button aria-label="Remover" className="text-muted-foreground hover:text-destructive" onClick={async () => { await supabase.from('blocked_dates').delete().eq('id', b.id); reload(); }}><Trash2 size={16} /></button></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

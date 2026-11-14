import { db } from './supabase';
import { freeBusy } from './google';

export const TZ_OFFSET = '-03:00'; // Brasil (sem horário de verão)

export interface BookingSettings {
  slot_step_min: number;
  min_notice_hours: number;
  max_days_ahead: number;
  cancel_hours: number;
  buffer_min: number;
  auto_confirm: boolean;
}

const DEFAULTS: BookingSettings = { slot_step_min: 30, min_notice_hours: 4, max_days_ahead: 60, cancel_hours: 24, buffer_min: 0, auto_confirm: false };

export async function getBookingSettings(): Promise<BookingSettings> {
  const { data } = await db().from('settings').select('value').eq('key', 'booking').maybeSingle();
  return { ...DEFAULTS, ...(data?.value || {}) };
}

const toMin = (t: string | null) => (t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : 0);
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const isoAt = (date: string, time: string) => new Date(`${date}T${time}:00${TZ_OFFSET}`);

export function validDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T12:00:00Z`).getTime());
}

/** Lista os horários livres (HH:MM) de um dia para um serviço de `durationMin` minutos. */
export async function computeSlots(date: string, durationMin: number): Promise<{ slots: string[]; reason?: string }> {
  const s = await getBookingSettings();
  const supa = db();

  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const dayStart = isoAt(date, '00:00');
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);
  const now = Date.now();

  if (dayEnd.getTime() < now) return { slots: [], reason: 'Data passada' };
  if (dayStart.getTime() > now + s.max_days_ahead * 24 * 3600 * 1000) return { slots: [], reason: `Agenda aberta somente para os próximos ${s.max_days_ahead} dias` };

  const [{ data: hours }, { data: blocked }, { data: bookings }] = await Promise.all([
    supa.from('business_hours').select('*').eq('weekday', weekday).maybeSingle(),
    supa.from('blocked_dates').select('reason').eq('date', date).maybeSingle(),
    supa.from('bookings').select('starts_at,ends_at').in('status', ['pendente', 'confirmado']).lt('starts_at', dayEnd.toISOString()).gt('ends_at', dayStart.toISOString()),
  ]);

  if (blocked) return { slots: [], reason: blocked.reason || 'Dia indisponível' };
  if (!hours || !hours.is_open) return { slots: [], reason: 'Não atendemos neste dia da semana' };

  let busy: { s: number; e: number }[] = (bookings || []).map((b: any) => ({ s: new Date(b.starts_at).getTime(), e: new Date(b.ends_at).getTime() }));
  try {
    const g = await freeBusy(dayStart.toISOString(), dayEnd.toISOString());
    busy = busy.concat(g.map((x) => ({ s: new Date(x.start).getTime(), e: new Date(x.end).getTime() })));
  } catch (e) {
    console.error('freeBusy falhou (seguindo só com o banco):', (e as Error).message);
  }

  const open = toMin(hours.start_time);
  const close = toMin(hours.end_time);
  const bs = hours.break_start ? toMin(hours.break_start) : null;
  const be = hours.break_end ? toMin(hours.break_end) : null;
  const total = durationMin + s.buffer_min;
  const earliest = now + s.min_notice_hours * 3600 * 1000;
  const step = Math.max(10, s.slot_step_min);

  const slots: string[] = [];
  for (let m = open; m + durationMin <= close; m += step) {
    if (bs !== null && be !== null && m < be && m + durationMin > bs) continue;
    const start = isoAt(date, hhmm(m)).getTime();
    const end = start + total * 60000;
    if (start < earliest) continue;
    if (busy.some((b) => start < b.e && end > b.s)) continue;
    slots.push(hhmm(m));
  }
  return { slots, reason: slots.length ? undefined : 'Sem horários livres neste dia' };
}

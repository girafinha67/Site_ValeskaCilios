import type { Booking } from './types';

export const TZ = 'America/Sao_Paulo';
export const OFFSET = '-03:00';

/** 'YYYY-MM-DD' + 'HH:MM' (horário de Brasília) -> ISO UTC */
export const toISO = (date: string, time: string) => new Date(`${date}T${time}:00${OFFSET}`).toISOString();

/** Data (YYYY-MM-DD) no fuso de Brasília */
export const dateKey = (d: Date | string = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(typeof d === 'string' ? new Date(d) : d);

export const addDays = (key: string, n: number) => dateKey(new Date(new Date(`${key}T12:00:00${OFFSET}`).getTime() + n * 86400000));
export const weekdayOf = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay();

const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, ...o });
export const fmtTime = (iso: string) => f({ hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
export const fmtDate = (iso: string) => f({ day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
export const fmtDateLong = (iso: string) => f({ weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));
export const fmtKeyLong = (key: string) => fmtDateLong(`${key}T12:00:00${OFFSET}`);
export const fmtKeyShort = (key: string) => f({ weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(`${key}T12:00:00${OFFSET}`));
export const fmtDateTime = (iso: string) => `${fmtDate(iso)} às ${fmtTime(iso)}`;

export const money = (cents: number | null | undefined) =>
  ((cents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const durationLabel = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`) : `${m}min`;
};

export const onlyDigits = (s: string | null | undefined) => (s || '').replace(/\D/g, '');
export const waLink = (phone: string | null | undefined, text = '') => {
  let d = onlyDigits(phone);
  if (d.length <= 11) d = `55${d}`;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

const utcStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Link "Adicionar ao Google Agenda" para o cliente */
export const googleCalendarLink = (b: Pick<Booking, 'service_title' | 'starts_at' | 'ends_at'>, place = '', studio = 'Valeska Rocha') =>
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${b.service_title} – ${studio}`)}&dates=${utcStamp(b.starts_at)}/${utcStamp(b.ends_at)}&details=${encodeURIComponent('Agendamento realizado pelo site.')}&location=${encodeURIComponent(place)}&ctz=${TZ}`;

/** Baixa um arquivo .ics (Apple/Outlook/Google) */
export function downloadIcs(b: Pick<Booking, 'id' | 'service_title' | 'starts_at' | 'ends_at'>, place = '', studio = 'Valeska Rocha') {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Valeska Cilios//PT-BR', 'BEGIN:VEVENT',
    `UID:${b.id}@valeska-cilios`, `DTSTAMP:${utcStamp(new Date().toISOString())}`,
    `DTSTART:${utcStamp(b.starts_at)}`, `DTEND:${utcStamp(b.ends_at)}`,
    `SUMMARY:${b.service_title} – ${studio}`, `LOCATION:${place.replace(/,/g, '\\,')}`,
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete do seu horário', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'meu-horario.ics';
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

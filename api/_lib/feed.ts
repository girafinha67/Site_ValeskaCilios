import { createHmac } from 'node:crypto';

/** Token secreto da assinatura da agenda. Use CALENDAR_FEED_TOKEN ou deixe o automático. */
export function feedToken(): string {
  const t = (process.env.CALENDAR_FEED_TOKEN || '').trim();
  if (t) return t;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev';
  return createHmac('sha256', key).update('valeska-calendar-feed').digest('hex').slice(0, 40);
}

export interface FeedBooking {
  id: string;
  client_name: string;
  client_phone: string | null;
  service_title: string;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
  notes: string | null;
  admin_notes: string | null;
  updated_at?: string;
}

export const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
export const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function fold(line: string): string {
  const parts: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > (parts.length ? 74 : 75)) {
      parts.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

/** Gera o arquivo .ics (iCalendar) com os agendamentos. */
export function buildIcs(bookings: FeedBooking[], calName = 'Agenda Valeska Cílios'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Valeska Cilios//Agenda//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(calName)}`, 'X-WR-TIMEZONE:America/Sao_Paulo', 'REFRESH-INTERVAL;VALUE=DURATION:PT15M', 'X-PUBLISHED-TTL:PT15M',
  ];
  for (const b of bookings) {
    const block = b.source === 'bloqueio';
    const pending = b.status === 'pendente';
    const summary = block ? `⛔ ${b.service_title}` : `${pending ? '⏳' : '✨'} ${b.service_title} – ${b.client_name}`;
    const desc = block ? '' : [`Cliente: ${b.client_name}`, b.client_phone ? `WhatsApp: ${b.client_phone}` : '', `Status: ${b.status}`, b.notes ? `Obs. da cliente: ${b.notes}` : '', b.admin_notes ? `Notas: ${b.admin_notes}` : ''].filter(Boolean).join('\n');
    lines.push(
      'BEGIN:VEVENT', `UID:${b.id}@valeska-cilios`, `DTSTAMP:${stamp(b.updated_at || b.starts_at)}`,
      `LAST-MODIFIED:${stamp(b.updated_at || b.starts_at)}`, `DTSTART:${stamp(b.starts_at)}`, `DTEND:${stamp(b.ends_at)}`,
      `SUMMARY:${esc(summary)}`, ...(desc ? [`DESCRIPTION:${esc(desc)}`] : []), `STATUS:${pending ? 'TENTATIVE' : 'CONFIRMED'}`,
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Atendimento em 1 hora', 'END:VALARM', 'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

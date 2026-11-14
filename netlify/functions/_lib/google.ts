import { JWT } from 'google-auth-library';
import type { Booking } from './supabase';

export const TZ = 'America/Sao_Paulo';
const CAL_SCOPE = 'https://www.googleapis.com/auth/calendar';
const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

function readCredentials(): { client_email: string; private_key: string } | null {
  const raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim();
  if (!raw) return null;
  try {
    const text = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const c = JSON.parse(text);
    if (!c.client_email || !c.private_key) return null;
    return { client_email: c.client_email, private_key: String(c.private_key).replace(/\\n/g, '\n') };
  } catch {
    return null;
  }
}

export const googleConfigured = () => !!readCredentials();
export const calendarConfigured = () => googleConfigured() && !!process.env.GOOGLE_CALENDAR_ID;
export const serviceAccountEmail = () => readCredentials()?.client_email ?? null;

async function request<T>(scope: string, url: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', data?: unknown): Promise<T> {
  const c = readCredentials();
  if (!c) throw new Error('Conta de serviço do Google não configurada (GOOGLE_SERVICE_ACCOUNT_JSON).');
  const client = new JWT({ email: c.client_email, key: c.private_key, scopes: [scope] });
  const res = await client.request<T>({ url, method, data });
  return res.data;
}

// ---------------- Google Agenda ----------------
const calUrl = (path = '') => `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || '')}${path}`;

export async function calendarInfo() {
  return request<{ summary: string; timeZone: string }>(CAL_SCOPE, calUrl());
}

export async function freeBusy(timeMin: string, timeMax: string): Promise<{ start: string; end: string }[]> {
  if (!calendarConfigured()) return [];
  const r = await request<{ calendars: Record<string, { busy: { start: string; end: string }[] }> }>(
    CAL_SCOPE,
    'https://www.googleapis.com/calendar/v3/freeBusy',
    'POST',
    { timeMin, timeMax, timeZone: TZ, items: [{ id: process.env.GOOGLE_CALENDAR_ID }] },
  );
  return Object.values(r.calendars || {})[0]?.busy ?? [];
}

function eventBody(b: Booking) {
  const pending = b.status === 'pendente';
  const lines = [
    `Cliente: ${b.client_name}`,
    b.client_phone ? `Telefone/WhatsApp: ${b.client_phone}` : '',
    b.client_email ? `E-mail: ${b.client_email}` : '',
    `Status: ${b.status}`,
    b.notes ? `Observações da cliente: ${b.notes}` : '',
    b.admin_notes ? `Notas internas: ${b.admin_notes}` : '',
    '',
    'Gerado automaticamente pelo site Valeska Cílios.',
  ].filter((l) => l !== '');
  return {
    summary: `${pending ? '⏳ ' : '✨ '}${b.service_title} – ${b.client_name}`,
    description: lines.join('\n'),
    start: { dateTime: b.starts_at, timeZone: TZ },
    end: { dateTime: b.ends_at, timeZone: TZ },
    colorId: pending ? '5' : b.status === 'concluido' ? '8' : '10',
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
  };
}

/** Cria/atualiza/remove o evento conforme o status. Devolve o novo google_event_id (ou null). */
export async function syncEvent(b: Booking): Promise<string | null> {
  if (!calendarConfigured()) return b.google_event_id;
  const remove = b.status === 'cancelado' || b.status === 'faltou';
  if (remove) {
    if (b.google_event_id) {
      try {
        await request(CAL_SCOPE, calUrl(`/events/${b.google_event_id}`), 'DELETE');
      } catch (e: any) {
        if (![404, 410].includes(e?.response?.status)) throw e;
      }
    }
    return null;
  }
  if (b.google_event_id) {
    try {
      await request(CAL_SCOPE, calUrl(`/events/${b.google_event_id}`), 'PATCH', eventBody(b));
      return b.google_event_id;
    } catch (e: any) {
      if (![404, 410].includes(e?.response?.status)) throw e;
    }
  }
  const created = await request<{ id: string }>(CAL_SCOPE, calUrl('/events'), 'POST', eventBody(b));
  return created.id;
}

// ---------------- Google Analytics 4 ----------------
export const ga4Configured = () => googleConfigured() && !!process.env.GA4_PROPERTY_ID;

export async function ga4Report(body: unknown) {
  return request<{ rows?: { dimensionValues?: { value: string }[]; metricValues: { value: string }[] }[]; totals?: unknown }>(
    GA_SCOPE,
    `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`,
    'POST',
    body,
  );
}

// ---------------- Google Search Console ----------------
export const gscConfigured = () => googleConfigured() && !!process.env.GSC_SITE_URL;

export async function gscQuery(body: unknown) {
  return request<{ rows?: { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[] }>(
    GSC_SCOPE,
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE_URL || '')}/searchAnalytics/query`,
    'POST',
    body,
  );
}

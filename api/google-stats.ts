import { authenticate } from './_lib/supabase.js';
import {
  calendarConfigured, calendarInfo, ga4Configured, ga4Report, googleConfigured, gscConfigured, gscQuery, serviceAccountEmail,
} from './_lib/google.js';
import { fail, json } from './_lib/http.js';
import { feedToken } from './_lib/feed.js';
import { mailConfigured } from './_lib/mail.js';

const isoDay = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const num = (v?: string) => Number(v ?? 0);

async function safe<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: string }> {
  try {
    return { data: await fn() };
  } catch (e: any) {
    const msg = e?.response?.data?.error?.message || e?.message || 'Erro desconhecido';
    return { error: msg };
  }
}

async function handler(req: Request) {
  try {
    const auth = await authenticate(req);
    if (!auth || auth.profile.role !== 'admin') return fail(403, 'Apenas administradores.');

    const days = Math.min(90, Math.max(7, Number(new URL(req.url).searchParams.get('days')) || 28));

    const status = {
      serviceAccountEmail: serviceAccountEmail(),
      googleConfigured: googleConfigured(),
      calendarConfigured: calendarConfigured(),
      ga4Configured: ga4Configured(),
      gscConfigured: gscConfigured(),
      mailConfigured: mailConfigured(),
    };

    const calendar = calendarConfigured() ? await safe(() => calendarInfo()) : null;

    const ga4 = ga4Configured()
      ? await safe(async () => {
          const range = [{ startDate: `${days}daysAgo`, endDate: 'today' }];
          const metrics = [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }];
          const [daily, pages, channels, totals] = await Promise.all([
            ga4Report({ dateRanges: range, dimensions: [{ name: 'date' }], metrics, orderBys: [{ dimension: { dimensionName: 'date' } }] }),
            ga4Report({ dateRanges: range, dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 8 }),
            ga4Report({ dateRanges: range, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 6 }),
            ga4Report({ dateRanges: range, metrics }),
          ]);
          const t = totals.rows?.[0]?.metricValues ?? [];
          return {
            totals: { users: num(t[0]?.value), sessions: num(t[1]?.value), pageviews: num(t[2]?.value) },
            daily: (daily.rows || []).map((r) => ({ date: r.dimensionValues![0].value, users: num(r.metricValues[0].value), sessions: num(r.metricValues[1].value), pageviews: num(r.metricValues[2].value) })),
            pages: (pages.rows || []).map((r) => ({ path: r.dimensionValues![0].value, views: num(r.metricValues[0].value) })),
            channels: (channels.rows || []).map((r) => ({ channel: r.dimensionValues![0].value, sessions: num(r.metricValues[0].value) })),
          };
        })
      : null;

    const gsc = gscConfigured()
      ? await safe(async () => {
          const base = { startDate: isoDay(-days - 2), endDate: isoDay(-2) };
          const [totals, queries, pages] = await Promise.all([
            gscQuery({ ...base }),
            gscQuery({ ...base, dimensions: ['query'], rowLimit: 10 }),
            gscQuery({ ...base, dimensions: ['page'], rowLimit: 8 }),
          ]);
          const row = totals.rows?.[0];
          const map = (rows?: { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[]) =>
            (rows || []).map((r) => ({ key: r.keys?.[0] ?? '', clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
          return {
            totals: row ? { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position } : { clicks: 0, impressions: 0, ctr: 0, position: 0 },
            queries: map(queries.rows),
            pages: map(pages.rows),
          };
        })
      : null;

    const host = req.headers.get('x-forwarded-host') || new URL(req.url).host;
    const feedUrl = `https://${host}/agenda/${feedToken()}.ics`;
    return json(200, { days, status, calendar, ga4, gsc, feedUrl });
  } catch (e) {
    console.error(e);
    return fail(500, 'Falha ao consultar as integrações do Google.');
  }
}

export { handler as GET, handler as POST };


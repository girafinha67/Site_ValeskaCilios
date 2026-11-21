import { timingSafeEqual } from 'node:crypto';
import { db } from './_lib/supabase.js';
import { buildIcs, feedToken, type FeedBooking } from './_lib/feed.js';

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Assinatura da agenda (iCalendar). Endereço: /agenda/<token>.ics  — funciona no Google Agenda, iPhone e Outlook, sem API do Google. */
async function handler(req: Request) {
  const u = new URL(req.url);
  const given = (u.searchParams.get('file') || u.searchParams.get('token') || '').replace(/\.ics$/i, '');
  if (!given || !same(given, feedToken())) return new Response('Não encontrado', { status: 404 });
  try {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const until = new Date(Date.now() + 365 * 86400000).toISOString();
    const { data, error } = await db()
      .from('bookings')
      .select('id,client_name,client_phone,service_title,starts_at,ends_at,status,source,notes,admin_notes,updated_at')
      .in('status', ['pendente', 'confirmado', 'concluido'])
      .gte('starts_at', since)
      .lte('starts_at', until)
      .order('starts_at');
    if (error) throw error;
    return new Response(buildIcs((data || []) as FeedBooking[]), {
      status: 200,
      headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300', 'Content-Disposition': 'inline; filename="agenda.ics"' },
    });
  } catch (e) {
    console.error(e);
    return new Response('Erro ao gerar a agenda', { status: 500 });
  }
}

export { handler as GET };

import { authenticate, db, type Booking } from './_lib/supabase';
import { calendarConfigured, syncEvent } from './_lib/google';
import { fail, json } from './_lib/http';

async function syncOne(b: Booking) {
  const supa = db();
  const eventId = await syncEvent(b);
  if (eventId !== b.google_event_id) await supa.from('bookings').update({ google_event_id: eventId }).eq('id', b.id);
}

async function handler(req: Request) {
  if (req.method !== 'POST') return fail(405, 'Método não permitido.');
  try {
    const auth = await authenticate(req);
    if (!auth) return fail(401, 'Não autenticado.');
    if (!calendarConfigured()) return json(200, { synced: 0, skipped: true, message: 'Google Agenda não configurado.' });

    const body = await req.json().catch(() => ({}));
    const supa = db();

    if (body.all) {
      if (auth.profile.role !== 'admin') return fail(403, 'Apenas administradores.');
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data } = await supa.from('bookings').select('*').gte('starts_at', since).order('starts_at');
      let synced = 0;
      const errors: string[] = [];
      for (const b of (data || []) as Booking[]) {
        try {
          await syncOne(b);
          synced++;
        } catch (e) {
          errors.push(`${b.client_name}: ${(e as Error).message}`);
        }
      }
      return json(200, { synced, errors });
    }

    const { data: b } = await supa.from('bookings').select('*').eq('id', String(body.bookingId || '')).maybeSingle();
    if (!b) return fail(404, 'Agendamento não encontrado.');
    if (auth.profile.role !== 'admin' && b.client_id !== auth.id) return fail(403, 'Sem permissão.');
    await syncOne(b as Booking);
    return json(200, { synced: 1 });
  } catch (e) {
    console.error(e);
    return fail(500, `Falha ao sincronizar com o Google Agenda: ${(e as Error).message}`);
  }
}

export { handler as GET, handler as POST };


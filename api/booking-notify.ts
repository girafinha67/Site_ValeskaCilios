import { authenticate, db, type Booking } from './_lib/supabase.js';
import { loadStudio, mailConfigured, sendInvite } from './_lib/mail.js';
import { notifyBooking } from './_lib/notify.js';
import { fail, json } from './_lib/http.js';

async function handler(req: Request) {
  if (req.method !== 'POST') return fail(405, 'Método não permitido.');
  try {
    const auth = await authenticate(req);
    if (!auth) return fail(401, 'Não autenticado.');
    const body = await req.json().catch(() => ({}));

    // e-mail de teste (admin): envia um convite de exemplo para o e-mail do próprio admin
    if (body.test) {
      if (auth.profile.role !== 'admin') return fail(403, 'Apenas administradores.');
      if (!mailConfigured()) return fail(400, 'Configure SMTP_HOST, SMTP_USER e SMTP_PASS na Vercel.');
      if (!auth.profile.email) return fail(400, 'Seu perfil não tem e-mail.');
      const start = new Date(Date.now() + 2 * 86400000);
      start.setUTCHours(13, 0, 0, 0);
      const sample = {
        id: crypto.randomUUID(), client_id: auth.id, client_name: auth.profile.full_name || 'Cliente', client_phone: null, client_email: auth.profile.email,
        service_id: null, service_title: 'Lash Lift & Tint (teste)', price_cents: 0, final_price_cents: null, starts_at: start.toISOString(),
        ends_at: new Date(start.getTime() + 90 * 60000).toISOString(), status: 'confirmado', notes: null, admin_notes: null, google_event_id: null, updated_at: new Date().toISOString(),
      } as Booking;
      await sendInvite(sample, 'request', await loadStudio());
      return json(200, { sent: true, to: auth.profile.email });
    }

    const { data: b } = await db().from('bookings').select('*').eq('id', String(body.bookingId || '')).maybeSingle();
    if (!b) return fail(404, 'Agendamento não encontrado.');
    if (auth.profile.role !== 'admin' && b.client_id !== auth.id) return fail(403, 'Sem permissão.');
    return json(200, await notifyBooking(b as Booking));
  } catch (e) {
    console.error(e);
    return fail(500, `Não foi possível enviar o convite: ${(e as Error).message}`);
  }
}

export { handler as GET, handler as POST };

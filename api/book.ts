import { authenticate, db, type Booking } from './_lib/supabase.js';
import { computeSlots, getBookingSettings, isoAt, validDate } from './_lib/slots.js';
import { syncEvent } from './_lib/google.js';
import { notifyBooking } from './_lib/notify.js';
import { fail, json } from './_lib/http.js';

async function handler(req: Request) {
  if (req.method !== 'POST') return fail(405, 'Método não permitido.');
  try {
    const auth = await authenticate(req);
    if (!auth) return fail(401, 'Entre na sua conta para agendar.');

    const body = await req.json().catch(() => ({}));
    const { serviceId, date, time } = body as { serviceId: number; date: string; time: string };
    const notes = String(body.notes || '').slice(0, 500) || null;
    const phone = String(body.phone || auth.profile.phone || '').replace(/[^\d+() -]/g, '').slice(0, 25);

    if (!serviceId || !validDate(date) || !/^\d{2}:\d{2}$/.test(time || '')) return fail(400, 'Dados do agendamento inválidos.');
    if (phone.replace(/\D/g, '').length < 10) return fail(400, 'Informe um telefone/WhatsApp válido (com DDD).');

    const supa = db();
    const { data: service } = await supa.from('services').select('*').eq('id', serviceId).maybeSingle();
    if (!service || !service.active) return fail(404, 'Serviço não encontrado.');

    // limite anti-abuso: no máximo 3 agendamentos futuros ativos por cliente
    const { count } = await supa
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', auth.id)
      .in('status', ['pendente', 'confirmado'])
      .gt('starts_at', new Date().toISOString());
    if ((count ?? 0) >= 3) return fail(409, 'Você já tem 3 agendamentos futuros. Cancele um ou fale conosco pelo WhatsApp.');

    const { slots } = await computeSlots(date, service.duration_min);
    if (!slots.includes(time)) return fail(409, 'Esse horário não está mais disponível. Escolha outro.');

    const settings = await getBookingSettings();
    const starts = isoAt(date, time);
    const ends = new Date(starts.getTime() + service.duration_min * 60000);

    if (phone && phone !== auth.profile.phone) await supa.from('profiles').update({ phone }).eq('id', auth.id);

    const { data: inserted, error } = await supa
      .from('bookings')
      .insert({
        client_id: auth.id,
        client_name: auth.profile.full_name || auth.profile.email || 'Cliente',
        client_phone: phone,
        client_email: auth.profile.email,
        service_id: service.id,
        service_title: service.title,
        price_cents: service.price_cents,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        status: settings.auto_confirm ? 'confirmado' : 'pendente',
        notes,
        source: 'site',
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23P01') return fail(409, 'Esse horário acabou de ser reservado por outra pessoa. Escolha outro.');
      throw error;
    }

    let booking = inserted as Booking;
    try {
      const eventId = await syncEvent(booking);
      if (eventId && eventId !== booking.google_event_id) {
        await supa.from('bookings').update({ google_event_id: eventId }).eq('id', booking.id);
        booking = { ...booking, google_event_id: eventId };
      }
    } catch (e) {
      console.error('Falha ao criar evento no Google Agenda (agendamento mantido):', (e as Error).message);
    }

    // confirmação automática: já manda o convite para o Google Agenda / calendário da cliente
    if (booking.status === 'confirmado') {
      const { data: fresh } = await supa.from('bookings').select('*').eq('id', booking.id).maybeSingle();
      if (fresh) await notifyBooking(fresh as Booking).catch(() => undefined);
    }

    return json(200, { booking });
  } catch (e) {
    console.error(e);
    return fail(500, 'Não foi possível concluir o agendamento agora. Tente novamente.');
  }
}

export { handler as GET, handler as POST };


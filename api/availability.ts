import { db } from './_lib/supabase.js';
import { computeSlots, validDate } from './_lib/slots.js';
import { fail, json } from './_lib/http.js';

async function handler(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date') || '';
    const serviceId = Number(url.searchParams.get('serviceId'));
    if (!validDate(date) || !serviceId) return fail(400, 'Informe date (AAAA-MM-DD) e serviceId.');

    const { data: service } = await db().from('services').select('id,duration_min,active').eq('id', serviceId).maybeSingle();
    if (!service || !service.active) return fail(404, 'Serviço não encontrado.');

    const result = await computeSlots(date, service.duration_min);
    return json(200, result);
  } catch (e) {
    console.error(e);
    return fail(500, 'Não foi possível consultar a agenda agora.');
  }
}

export { handler as GET, handler as POST };


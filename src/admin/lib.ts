import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, supabase } from '@/lib/supabase';
import { siteConfig, type SiteConfig } from '@/data/siteConfig';

/** Carrega dados assíncronos com recarregamento manual. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fn());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload, setData };
}

/** Sincroniza o agendamento: Google Agenda por API (opcional) e convite de calendário por e-mail para a cliente. */
export async function syncBooking(id: string) {
  let synced = false;
  try {
    const r = await api<{ skipped?: boolean }>('calendar-sync', { body: { bookingId: id } });
    synced = !r.skipped;
  } catch (e) {
    toast.warning(`Salvo, mas o Google Agenda não sincronizou: ${(e as Error).message}`);
  }
  try {
    const r = await api<{ sent: boolean; kind?: string; reason?: string; message?: string }>('booking-notify', { body: { bookingId: id } });
    if (r.sent) toast.success(r.kind === 'cancel' ? 'Cancelamento enviado: o horário sai do calendário da cliente.' : 'Convite enviado: o horário entra no Google Agenda da cliente.');
    else if (r.reason === 'smtp') toast.warning('Configure o e-mail (SMTP) na Vercel para enviar o convite de agenda à cliente. Veja Google > Convites por e-mail.');
    else if (r.reason === 'no_email') toast.info('Esta cliente não tem e-mail cadastrado: o convite de agenda não foi enviado.');
    else if (r.reason === 'migration' || r.reason === 'error') toast.warning(r.message || 'Não foi possível enviar o convite de agenda.');
  } catch (e) {
    toast.warning(`Salvo, mas o convite de agenda não foi enviado: ${(e as Error).message}`);
  }
  return synced;
}

export async function loadBusiness(): Promise<SiteConfig> {
  const { data } = await supabase.from('settings').select('value').eq('key', 'business').maybeSingle();
  const clean = Object.fromEntries(Object.entries((data?.value as Record<string, string>) || {}).filter(([, v]) => v !== '' && v != null));
  return { ...siteConfig, ...clean };
}

export const centsFromInput = (s: string) => Math.round(Number(String(s).replace(/\./g, '').replace(',', '.')) * 100) || 0;
export const inputFromCents = (c: number) => (c / 100).toFixed(2).replace('.', ',');
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const bookingValue = (b: { status: string; final_price_cents: number | null; price_cents: number }) => (b.status === 'concluido' ? b.final_price_cents ?? b.price_cents : 0);

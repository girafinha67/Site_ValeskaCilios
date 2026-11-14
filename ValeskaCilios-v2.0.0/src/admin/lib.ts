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

/** Sincroniza um agendamento com o Google Agenda (silencioso quando não configurado). */
export async function syncBooking(id: string) {
  try {
    const r = await api<{ skipped?: boolean }>('calendar-sync', { body: { bookingId: id } });
    return !r.skipped;
  } catch (e) {
    toast.warning(`Salvo, mas o Google Agenda não sincronizou: ${(e as Error).message}`);
    return false;
  }
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

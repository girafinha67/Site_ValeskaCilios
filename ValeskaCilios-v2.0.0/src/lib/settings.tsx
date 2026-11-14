import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, supabaseReady } from './supabase';
import { siteConfig, type SiteConfig } from '@/data/siteConfig';
import { fallbackServices } from '@/data/services';
import { initAnalytics } from './analytics';
import type { BookingSettings, Service } from './types';

interface SettingsState {
  site: SiteConfig;
  booking: BookingSettings;
  services: Service[];
  ready: boolean;
  reload: () => Promise<void>;
}

export const defaultBooking: BookingSettings = { slot_step_min: 30, min_notice_hours: 4, max_days_ahead: 60, cancel_hours: 24, buffer_min: 0, auto_confirm: false };

const Ctx = createContext<SettingsState>({ site: siteConfig, booking: defaultBooking, services: fallbackServices, ready: false, reload: async () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteConfig>(siteConfig);
  const [booking, setBooking] = useState<BookingSettings>(defaultBooking);
  const [services, setServices] = useState<Service[]>(fallbackServices);
  const [ready, setReady] = useState(false);

  const reload = async () => {
    if (!supabaseReady) {
      initAnalytics();
      return setReady(true);
    }
    try {
      const [{ data: s }, { data: sv }] = await Promise.all([
        supabase.from('settings').select('key,value'),
        supabase.from('services').select('*').eq('active', true).order('sort').order('id'),
      ]);
      const map = Object.fromEntries((s || []).map((r: any) => [r.key, r.value]));
      const clean = Object.fromEntries(Object.entries(map.business || {}).filter(([, v]) => v !== '' && v != null));
      setSite({ ...siteConfig, ...clean });
      setBooking({ ...defaultBooking, ...(map.booking || {}) });
      if (sv && sv.length) setServices(sv as Service[]);
      initAnalytics(map.integrations?.ga_id);
    } catch {
      initAnalytics();
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const value = useMemo(() => ({ site, booking, services, ready, reload }), [site, booking, services, ready]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);

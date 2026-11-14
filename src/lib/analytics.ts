// Google Analytics 4 com Consent Mode v2: só coleta dados de analytics depois do aceite (LGPD).
const KEY = 'vc_cookie_consent';
let initialized = false;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const getConsent = (): 'granted' | 'denied' | null => {
  try {
    return (localStorage.getItem(KEY) as 'granted' | 'denied' | null) ?? null;
  } catch {
    return null;
  }
};

export function setConsent(value: 'granted' | 'denied') {
  try {
    localStorage.setItem(KEY, value);
  } catch { /* ignore */ }
  if (window.gtag) window.gtag('consent', 'update', { analytics_storage: value });
}

export function initAnalytics(gaId?: string) {
  const id = (gaId || (import.meta.env.VITE_GA_ID as string | undefined) || '').trim();
  if (!id || initialized || typeof document === 'undefined') return;
  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('consent', 'default', { analytics_storage: getConsent() ?? 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  pageview(location.pathname + location.search);
}

export const pageview = (path: string) => window.gtag?.('event', 'page_view', { page_path: path, page_location: location.href, page_title: document.title });
export const track = (name: string, params: Record<string, unknown> = {}) => window.gtag?.('event', name, params);

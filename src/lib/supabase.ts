import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Erro vindo do link do e-mail (ex.: link expirado). Lido antes do supabase-js limpar a URL. */
export const authUrlError: { code: string; message: string } | null = (() => {
  if (typeof location === 'undefined') return null;
  const p = new URLSearchParams(`${location.search.replace(/^\?/, '')}&${location.hash.replace(/^#/, '')}`);
  const code = p.get('error_code') || p.get('error');
  return code ? { code, message: p.get('error_description') || '' } : null;
})();

export const supabaseReady = Boolean(url && key);

// Se as variáveis ainda não foram configuradas, o site continua abrindo (modo vitrine) e avisa no agendamento/login.
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Chamada autenticada às Vercel Functions (/api/...). */
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`/api/${path}`, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
  return json as T;
}

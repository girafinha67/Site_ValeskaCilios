import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Cliente com chave service_role (ignora RLS). Use apenas no servidor. */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: 'client' | 'admin';
}

export interface Booking {
  id: string;
  client_id: string | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  service_id: number | null;
  service_title: string;
  price_cents: number;
  final_price_cents: number | null;
  starts_at: string;
  ends_at: string;
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'faltou';
  notes: string | null;
  admin_notes: string | null;
  google_event_id: string | null;
  source?: string;
  updated_at?: string;
  invite_hash?: string | null;
}

/** Valida o token do usuário (Authorization: Bearer ...) e devolve o perfil. */
export async function authenticate(req: Request): Promise<{ id: string; profile: Profile } | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const supa = db();
  const { data, error } = await supa.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await supa.from('profiles').select('id,email,full_name,phone,role').eq('id', data.user.id).maybeSingle();
  if (!profile) return null;
  return { id: data.user.id, profile: profile as Profile };
}

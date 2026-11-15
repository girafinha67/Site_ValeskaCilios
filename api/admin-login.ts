import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
import { db } from './_lib/supabase.js';
import { fail, json } from './_lib/http.js';

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Login do painel: e-mail e senha vêm das variáveis ADMIN_EMAIL e ADMIN_PASSWORD (Vercel).
 * Valida aqui, garante o usuário administrador no Supabase e devolve a sessão.
 */
async function handler(req: Request) {
  if (req.method !== 'POST') return fail(405, 'Método não permitido.');
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    if (!adminEmail || !adminPassword) return fail(500, 'Defina ADMIN_EMAIL e ADMIN_PASSWORD nas variáveis de ambiente da Vercel.');
    if (adminPassword.length < 8) return fail(500, 'ADMIN_PASSWORD precisa ter 8 caracteres.');

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!same(email, adminEmail) || !same(password, adminPassword)) {
      await sleep(800); // freia tentativas em massa
      return fail(401, 'E-mail ou senha incorretos.');
    }

    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
    const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;
    const supa = db();
    const pub = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });

    let { data, error } = await pub.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    if (error || !data.session) {
      // usuário ainda não existe, ou a senha do Supabase está diferente da definida na Vercel: sincroniza
      const { data: prof } = await supa.from('profiles').select('id').ilike('email', adminEmail).maybeSingle();
      let id: string | undefined = prof?.id;
      if (!id) {
        const created = await supa.auth.admin.createUser({ email: adminEmail, password: adminPassword, email_confirm: true, user_metadata: { full_name: 'Administradora' } });
        id = created.data.user?.id;
        if (!id) {
          for (let page = 1; page <= 5 && !id; page++) {
            const list = await supa.auth.admin.listUsers({ page, perPage: 1000 });
            id = list.data.users.find((u) => u.email?.toLowerCase() === adminEmail)?.id;
          }
        }
      }
      if (!id) return fail(500, 'Não foi possível preparar o usuário administrador.');
      const upd = await supa.auth.admin.updateUserById(id, { password: adminPassword, email_confirm: true });
      if (upd.error) throw upd.error;
      ({ data, error } = await pub.auth.signInWithPassword({ email: adminEmail, password: adminPassword }));
      if (error || !data.session) throw error || new Error('Sessão não criada');
    }

    await supa.from('profiles').upsert({ id: data.user!.id, email: adminEmail, role: 'admin' }, { onConflict: 'id' });
    return json(200, { access_token: data.session!.access_token, refresh_token: data.session!.refresh_token });
  } catch (e) {
    console.error(e);
    return fail(500, 'Falha ao entrar no painel. Confira as variáveis de ambiente na Vercel.');
  }
}

export { handler as POST };

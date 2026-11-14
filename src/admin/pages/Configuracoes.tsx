import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { siteConfig } from '@/data/siteConfig';
import type { Profile } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Button, Card, Field, Input, Spinner } from '@/components/ui';
import { useAsync } from '../lib';

const FIELDS: [keyof typeof siteConfig, string][] = [['name', 'Nome do estúdio'], ['tagline', 'Slogan'], ['phone', 'Telefone (exibição)'], ['whatsapp', 'WhatsApp (só números com 55 + DDD)'], ['email', 'E-mail'], ['address', 'Endereço'], ['hoursText', 'Horário (texto exibido)'], ['instagram', 'Instagram (URL)'], ['facebook', 'Facebook (URL)'], ['tiktok', 'TikTok (URL)'], ['youtube', 'YouTube (URL)']];

export default function Configuracoes() {
  const { profile } = useAuth();
  const { data, loading, reload } = useAsync(async () => {
    const [s, a] = await Promise.all([supabase.from('settings').select('key,value'), supabase.from('profiles').select('*').eq('role', 'admin')]);
    return { map: Object.fromEntries((s.data || []).map((r: any) => [r.key, r.value])) as Record<string, any>, admins: (a.data as Profile[]) || [] };
  });
  const [biz, setBiz] = useState<Record<string, string>>({});
  const [ga, setGa] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) { setBiz({ ...siteConfig, ...(data.map.business || {}) }); setGa(data.map.integrations?.ga_id || ''); } }, [data]);
  if (loading || !data) return <Spinner />;

  async function save() {
    setBusy(true);
    const [a, b] = await Promise.all([
      supabase.from('settings').upsert({ key: 'business', value: biz, updated_at: new Date().toISOString() }),
      supabase.from('settings').upsert({ key: 'integrations', value: { ...(data!.map.integrations || {}), ga_id: ga.trim() }, updated_at: new Date().toISOString() }),
    ]);
    setBusy(false);
    if (a.error || b.error) return toast.error('Não foi possível salvar.');
    toast.success('Configurações salvas! O site já usa os novos dados.'); reload();
  }
  async function promote() {
    const e = email.trim().toLowerCase();
    if (!e) return;
    await supabase.from('admin_emails').upsert({ email: e });
    const { data: up } = await supabase.from('profiles').update({ role: 'admin' }).ilike('email', e).select('id');
    toast.success(up?.length ? 'Administrador adicionado!' : 'E-mail liberado: quando essa pessoa criar a conta, vira administradora.');
    setEmail(''); reload();
  }
  async function demote(p: Profile) {
    if (p.id === profile?.id) return toast.error('Você não pode remover a si mesma.');
    if (!confirm(`Remover acesso de ${p.email}?`)) return;
    await supabase.from('admin_emails').delete().ilike('email', p.email || '');
    await supabase.from('profiles').update({ role: 'client' }).eq('id', p.id);
    reload();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-serif">Configurações</h1>
      <Card className="space-y-4">
        <h2 className="font-serif text-lg">Dados do estúdio (aparecem no site)</h2>
        <div className="grid sm:grid-cols-2 gap-4">{FIELDS.map(([k, l]) => <Field key={k} label={l} className={k === 'address' || k === 'tagline' ? 'sm:col-span-2' : ''}><Input value={biz[k] || ''} onChange={(e) => setBiz({ ...biz, [k]: e.target.value })} /></Field>)}</div>
        <Field label="ID do Google Analytics 4 (G-XXXXXXXXXX)" hint="Ativa a medição de visitas no site (respeitando o consentimento de cookies)."><Input value={ga} onChange={(e) => setGa(e.target.value)} placeholder="G-XXXXXXXXXX" /></Field>
        <Button loading={busy} onClick={save}>Salvar configurações</Button>
      </Card>
      <Card className="space-y-4">
        <h2 className="font-serif text-lg">Administradores</h2>
        <ul className="divide-y divide-border text-sm">{data.admins.map((p) => <li key={p.id} className="py-2 flex justify-between"><span>{p.full_name || p.email} <span className="text-muted-foreground">· {p.email}</span></span>{p.id !== profile?.id && <button className="text-xs text-destructive" onClick={() => demote(p)}>Remover</button>}</li>)}</ul>
        <div className="flex gap-2 items-end"><Field label="Dar acesso de administrador (e-mail)" className="flex-1"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field><Button variant="outline" onClick={promote}>Adicionar</Button></div>
      </Card>
    </div>
  );
}

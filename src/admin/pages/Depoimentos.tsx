import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Testimonial } from '@/lib/types';
import { Badge, Button, Card, Empty, Field, Input, Select, Spinner, Textarea } from '@/components/ui';
import { Stars } from '@/components/Stars';
import { useAsync } from '../lib';

export default function Depoimentos() {
  const { data, loading, reload } = useAsync(async () => ((await supabase.from('testimonials').select('*').order('approved').order('created_at', { ascending: false })).data as Testimonial[]) || []);
  const [f, setF] = useState({ name: '', role: 'Cliente', text: '', rating: '5' });
  if (loading || !data) return <Spinner />;

  async function setApproved(t: Testimonial, approved: boolean) { await supabase.from('testimonials').update({ approved }).eq('id', t.id); reload(); }
  async function remove(t: Testimonial) { if (confirm('Excluir depoimento?')) { await supabase.from('testimonials').delete().eq('id', t.id); reload(); } }
  async function add() {
    if (f.name.trim().length < 2 || f.text.trim().length < 10) return toast.error('Preencha nome e depoimento (mín. 10 caracteres).');
    const { error } = await supabase.from('testimonials').insert({ name: f.name.trim(), role: f.role, text: f.text.trim(), rating: Number(f.rating), approved: true });
    if (error) return toast.error('Não foi possível adicionar.');
    setF({ name: '', role: 'Cliente', text: '', rating: '5' }); toast.success('Publicado!'); reload();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-serif">Depoimentos</h1>
      <p className="text-sm text-muted-foreground">Só os aprovados aparecem na página inicial. Enquanto não houver nenhum aprovado, o site mostra os depoimentos de exemplo.</p>
      {data.length === 0 ? <Card><Empty>Nenhum depoimento ainda.</Empty></Card> : data.map((t) => (
        <Card key={t.id} className="space-y-2">
          <div className="flex justify-between gap-3 flex-wrap"><div><p className="font-medium">{t.name} <span className="text-muted-foreground font-normal text-sm">· {t.role}</span></p><Stars n={t.rating} size={14} /></div><Badge tone={t.approved ? 'confirmado' : 'pendente'}>{t.approved ? 'Publicado' : 'Aguardando aprovação'}</Badge></div>
          <p className="text-sm text-muted-foreground">“{t.text}”</p>
          <div className="flex gap-2">{t.approved ? <Button size="sm" variant="outline" onClick={() => setApproved(t, false)}>Despublicar</Button> : <Button size="sm" variant="success" onClick={() => setApproved(t, true)}>Aprovar e publicar</Button>}<Button size="sm" variant="danger" onClick={() => remove(t)}>Excluir</Button></div>
        </Card>
      ))}
      <Card className="space-y-3">
        <h2 className="font-serif text-lg">Adicionar depoimento manualmente</h2>
        <div className="grid sm:grid-cols-3 gap-3"><Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Descrição"><Input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></Field><Field label="Nota"><Select value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })}>{[5, 4, 3].map((n) => <option key={n}>{n}</option>)}</Select></Field></div>
        <Field label="Texto"><Textarea rows={3} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
        <Button onClick={add}>Publicar</Button>
      </Card>
    </div>
  );
}

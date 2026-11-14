import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Service } from '@/lib/types';
import { durationLabel, money } from '@/lib/time';
import { Badge, Button, Card, Field, Input, Modal, Spinner, Textarea } from '@/components/ui';
import { centsFromInput, inputFromCents, useAsync } from '../lib';

const blank = { title: '', description: '', duration_min: '60', price: '0,00', price_prefix: 'A partir de', tag: '', icon: '✦', sort: '0', active: true };

export default function Servicos() {
  const { data, loading, reload } = useAsync(async () => ((await supabase.from('services').select('*').order('sort').order('id')).data as Service[]) || []);
  const [edit, setEdit] = useState<{ id?: number; f: typeof blank } | null>(null);
  const [busy, setBusy] = useState(false);
  if (loading || !data) return <Spinner />;

  const open = (s?: Service) => setEdit(s ? { id: s.id, f: { title: s.title, description: s.description, duration_min: String(s.duration_min), price: inputFromCents(s.price_cents), price_prefix: s.price_prefix, tag: s.tag || '', icon: s.icon, sort: String(s.sort), active: s.active } } : { f: { ...blank, sort: String(data.length + 1) } });

  async function save() {
    if (!edit) return;
    const { f } = edit;
    if (!f.title.trim()) return toast.error('Informe o nome do serviço.');
    const row = { title: f.title.trim(), description: f.description.trim(), duration_min: Math.max(10, Number(f.duration_min) || 60), price_cents: centsFromInput(f.price), price_prefix: f.price_prefix, tag: f.tag.trim() || null, icon: f.icon || '✦', sort: Number(f.sort) || 0, active: f.active };
    setBusy(true);
    const { error } = edit.id ? await supabase.from('services').update(row).eq('id', edit.id) : await supabase.from('services').insert(row);
    setBusy(false);
    if (error) return toast.error('Não foi possível salvar.');
    toast.success('Serviço salvo!'); setEdit(null); reload();
  }
  async function remove() {
    if (!edit?.id || !confirm('Excluir este serviço? Agendamentos antigos são mantidos. (Para só esconder do site, desmarque "Ativo".)')) return;
    const { error } = await supabase.from('services').delete().eq('id', edit.id);
    if (error) return toast.error('Não foi possível excluir.');
    setEdit(null); reload();
  }
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<any>) => setEdit((s) => s && { ...s, f: { ...s.f, [k]: k === 'active' ? e.target.checked : e.target.value } });

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex justify-between items-center"><h1 className="text-3xl font-serif">Serviços</h1><Button onClick={() => open()}><Plus size={16} /> Novo serviço</Button></div>
      <p className="text-sm text-muted-foreground">As mudanças aparecem no site e no agendamento na hora.</p>
      <div className="space-y-2">
        {data.map((s) => (
          <button key={s.id} onClick={() => open(s)} className="w-full text-left glass rounded-2xl p-4 flex flex-wrap items-center gap-4 hover:ring-1 hover:ring-primary/40">
            <span className="text-primary text-xl">{s.icon}</span>
            <div className="flex-1 min-w-[180px]"><p className="font-medium">{s.title} {s.tag && <Badge tone="gold">{s.tag}</Badge>} {!s.active && <Badge>oculto</Badge>}</p><p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p></div>
            <p className="text-sm text-muted-foreground">{durationLabel(s.duration_min)} · {money(s.price_cents)}</p>
          </button>
        ))}
      </div>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Editar serviço' : 'Novo serviço'}>
          <div className="space-y-3">
            <Field label="Nome"><Input value={edit.f.title} onChange={set('title')} /></Field>
            <Field label="Descrição"><Textarea rows={3} value={edit.f.description} onChange={set('description')} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duração (min)"><Input type="number" min={10} step={5} value={edit.f.duration_min} onChange={set('duration_min')} /></Field>
              <Field label="Preço (R$)"><Input value={edit.f.price} onChange={set('price')} inputMode="decimal" /></Field>
              <Field label="Prefixo do preço"><Input value={edit.f.price_prefix} onChange={set('price_prefix')} /></Field>
              <Field label="Selo (ex.: Popular)"><Input value={edit.f.tag} onChange={set('tag')} /></Field>
              <Field label="Ícone"><Input value={edit.f.icon} onChange={set('icon')} /></Field>
              <Field label="Ordem"><Input type="number" value={edit.f.sort} onChange={set('sort')} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#b98c00]" checked={edit.f.active} onChange={set('active')} /> Ativo (visível no site e no agendamento)</label>
            <div className="flex justify-between pt-2"><Button loading={busy} onClick={save}>Salvar</Button>{edit.id && <Button variant="danger" onClick={remove}>Excluir</Button>}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

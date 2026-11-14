import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { ContactMessage } from '@/lib/types';
import { fmtDateTime, waLink } from '@/lib/time';
import { Badge, Button, Card, Empty, Modal, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAsync } from '../lib';

export default function Mensagens() {
  const { data, loading, reload } = useAsync(async () => ((await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(300)).data as ContactMessage[]) || []);
  const [sel, setSel] = useState<ContactMessage | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);
  if (loading || !data) return <Spinner />;
  const list = onlyUnread ? data.filter((m) => !m.is_read) : data;

  async function open(m: ContactMessage) {
    setSel(m);
    if (!m.is_read) { await supabase.from('contact_messages').update({ is_read: true }).eq('id', m.id); reload(); }
  }
  async function remove(m: ContactMessage) {
    if (!confirm('Excluir esta mensagem?')) return;
    await supabase.from('contact_messages').delete().eq('id', m.id);
    toast.success('Excluída.'); setSel(null); reload();
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex justify-between items-center"><h1 className="text-3xl font-serif">Mensagens</h1><label className="text-sm flex items-center gap-2"><input type="checkbox" className="accent-[#b98c00]" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} /> Só não lidas</label></div>
      {list.length === 0 ? <Card><Empty>Nenhuma mensagem.</Empty></Card> : list.map((m) => (
        <button key={m.id} onClick={() => open(m)} className={cn('w-full text-left glass rounded-2xl p-4 hover:ring-1 hover:ring-primary/40', !m.is_read && 'border-primary')}>
          <div className="flex justify-between gap-3"><p className={cn(!m.is_read && 'font-semibold')}>{m.name}{!m.is_read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />}</p><span className="text-xs text-muted-foreground">{fmtDateTime(m.created_at)}</span></div>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{m.message}</p>
        </button>
      ))}
      {sel && (
        <Modal open onClose={() => setSel(null)} title={`Mensagem de ${sel.name}`}>
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground">{fmtDateTime(sel.created_at)}</p>
            {sel.service && <Badge tone="gold">{sel.service}</Badge>}
            <p className="whitespace-pre-wrap rounded-xl bg-muted p-4">{sel.message}</p>
            <p>✉️ {sel.email}{sel.phone && <> · 📞 {sel.phone}</>}</p>
            <div className="flex flex-wrap gap-2">
              <a className="btn-glass-gold px-5 py-2.5 text-sm" href={`mailto:${sel.email}?subject=${encodeURIComponent('Re: seu contato')}`}>Responder por e-mail</a>
              {sel.phone && <a className="rounded-full border border-emerald-600/40 text-emerald-700 px-5 py-2.5 text-sm" target="_blank" rel="noreferrer" href={waLink(sel.phone, `Olá, ${sel.name.split(' ')[0]}! Recebi sua mensagem pelo site.`)}>Responder no WhatsApp</a>}
              <Button variant="danger" onClick={() => remove(sel)}>Excluir</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

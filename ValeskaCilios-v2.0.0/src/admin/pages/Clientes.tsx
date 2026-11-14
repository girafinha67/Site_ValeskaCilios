import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, MessageCircle, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Booking, Profile } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';
import { dateKey, downloadCsv, fmtDate, fmtDateLong, fmtTime, money, waLink } from '@/lib/time';
import { Badge, Button, Card, Empty, Field, Input, Modal, Spinner, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';
import { bookingValue, loadBusiness, sum, useAsync } from '../lib';

interface Row { key: string; profile: Profile | null; name: string; phone: string | null; email: string | null; bookings: Booking[]; visits: number; spent: number; last: string | null; next: string | null }

export default function Clientes() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'todas' | 'inativas' | 'aniversario'>('todas');
  const [sel, setSel] = useState<Row | null>(null);

  const { data, loading, reload } = useAsync(async () => {
    const [p, b, biz] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'client'),
      supabase.from('bookings').select('*').neq('source', 'bloqueio').order('starts_at', { ascending: false }).limit(5000),
      loadBusiness(),
    ]);
    return { profiles: (p.data as Profile[]) || [], bookings: (b.data as Booking[]) || [], biz };
  });

  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    const now = Date.now();
    const map = new Map<string, Row>();
    data.profiles.forEach((p) => map.set(p.id, { key: p.id, profile: p, name: p.full_name || p.email || 'Sem nome', phone: p.phone, email: p.email, bookings: [], visits: 0, spent: 0, last: null, next: null }));
    data.bookings.forEach((b) => {
      const key = b.client_id && map.has(b.client_id) ? b.client_id : `m:${(b.client_phone || b.client_name).replace(/\D/g, '') || b.client_name.toLowerCase()}`;
      if (!map.has(key)) map.set(key, { key, profile: null, name: b.client_name, phone: b.client_phone, email: b.client_email, bookings: [], visits: 0, spent: 0, last: null, next: null });
      map.get(key)!.bookings.push(b);
    });
    map.forEach((r) => {
      r.visits = r.bookings.filter((b) => b.status === 'concluido').length;
      r.spent = sum(r.bookings.map(bookingValue));
      r.last = r.bookings.find((b) => b.status === 'concluido')?.starts_at ?? null;
      r.next = [...r.bookings].reverse().find((b) => ['pendente', 'confirmado'].includes(b.status) && new Date(b.starts_at).getTime() > now)?.starts_at ?? null;
    });
    return [...map.values()].sort((a, b) => (b.last || '').localeCompare(a.last || '') || a.name.localeCompare(b.name));
  }, [data]);

  if (loading || !data) return <Spinner />;
  const month = dateKey().slice(5, 7);
  const days = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  const list = rows.filter((r) => `${r.name} ${r.phone} ${r.email}`.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => filter === 'todas' || (filter === 'inativas' ? r.last && days(r.last) >= 30 && !r.next : r.profile?.birthday?.slice(5, 7) === month));

  const exportCsv = () => downloadCsv('clientes.csv', [['Nome', 'Telefone', 'E-mail', 'Atendimentos', 'Total gasto (R$)', 'Último atendimento', 'Cadastro no site'], ...rows.map((r) => [r.name, r.phone, r.email, r.visits, (r.spent / 100).toFixed(2).replace('.', ','), r.last ? fmtDate(r.last) : '', r.profile ? 'sim' : 'não'])]);

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-wrap justify-between gap-3 items-center"><h1 className="text-3xl font-serif">Clientes <span className="text-base text-muted-foreground">({rows.length})</span></h1><Button variant="outline" onClick={exportCsv}><Download size={15} /> Exportar CSV</Button></div>
      <Card className="space-y-3">
        <div className="relative"><Search className="absolute left-3 top-3 text-muted-foreground" size={16} /><Input className="pl-9" placeholder="Buscar cliente" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex flex-wrap gap-2">
          {([['todas', 'Todas'], ['inativas', 'Sem retorno há 30+ dias'], ['aniversario', 'Aniversariantes do mês']] as const).map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={cn('rounded-full px-4 py-1.5 text-sm', filter === k ? 'btn-glass-gold' : 'bg-muted')}>{l}</button>)}
        </div>
      </Card>
      {list.length === 0 ? <Card><Empty>Nenhuma cliente encontrada.</Empty></Card> : (
        <div className="space-y-2">
          {list.map((r) => (
            <button key={r.key} onClick={() => setSel(r)} className="w-full text-left glass rounded-2xl p-4 flex flex-wrap gap-4 items-center hover:ring-1 hover:ring-primary/40">
              <div className="flex-1 min-w-[180px]"><p className="font-medium">{r.name} {r.profile ? '' : <Badge>sem cadastro</Badge>}</p><p className="text-xs text-muted-foreground">{r.phone || r.email || '—'}</p></div>
              <div className="text-sm text-muted-foreground">{r.visits} atend. · {money(r.spent)}</div>
              <div className="text-xs text-muted-foreground w-40">{r.next ? `Próximo: ${fmtDate(r.next)}` : r.last ? `Último: ${fmtDate(r.last)} (${days(r.last)}d)` : 'Sem atendimentos'}</div>
            </button>
          ))}
        </div>
      )}
      {sel && <ClientModal row={sel} biz={data.biz} onClose={() => setSel(null)} onSaved={() => { reload(); }} />}
    </div>
  );
}

function ClientModal({ row, biz, onClose, onSaved }: { row: Row; biz: { name: string }; onClose: () => void; onSaved: () => void }) {
  const [notes, setNotes] = useState(row.profile?.admin_notes || '');
  const [bday, setBday] = useState(row.profile?.birthday || '');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!row.profile) return;
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ admin_notes: notes, birthday: bday || null }).eq('id', row.profile.id);
    setBusy(false);
    if (error) return toast.error('Não foi possível salvar.');
    toast.success('Salvo!'); onSaved();
  }
  const first = row.name.split(' ')[0];
  return (
    <Modal open onClose={onClose} title={row.name} wide>
      <div className="space-y-5">
        <div className="text-sm space-y-1"><p>📞 {row.phone || '—'}</p><p>✉️ {row.email || '—'}</p><p className="text-muted-foreground">{row.visits} atendimentos · {money(row.spent)} gastos</p></div>
        <div className="flex flex-wrap gap-2">
          <a href={waLink(row.phone, `Oi, ${first}! Faz um tempinho que não te vejo por aqui 💛 Que tal agendar a sua manutenção? – ${biz.name}`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/40 text-emerald-700 px-4 py-2 text-sm hover:bg-emerald-50"><MessageCircle size={15} /> Convidar a voltar</a>
          <a href={waLink(row.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm hover:bg-muted">Abrir conversa</a>
        </div>
        {row.profile ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Aniversário"><Input type="date" value={bday} onChange={(e) => setBday(e.target.value)} /></Field>
            <Field label="Anotações (alergias, preferências, mapping)"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
            <Button loading={busy} onClick={save}>Salvar</Button>
          </div>
        ) : <p className="text-xs text-muted-foreground">Cliente sem conta no site (agendada manualmente). Anotações ficam nos agendamentos.</p>}
        <div>
          <p className="font-serif text-lg mb-2">Histórico</p>
          <ul className="divide-y divide-border text-sm max-h-60 overflow-y-auto">
            {row.bookings.map((b) => <li key={b.id} className="py-2 flex justify-between gap-2"><span>{b.service_title} <span className="text-muted-foreground capitalize">· {fmtDateLong(b.starts_at)} {fmtTime(b.starts_at)}</span></span><Badge tone={b.status}>{STATUS_LABEL[b.status]}</Badge></li>)}
          </ul>
        </div>
      </div>
    </Modal>
  );
}

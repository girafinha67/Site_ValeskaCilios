import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';
import { addDays, dateKey, downloadCsv, fmtDate, fmtTime, money, weekdayOf } from '@/lib/time';
import { Button, Card, Select, Spinner } from '@/components/ui';
import { bookingValue, sum, useAsync } from '../lib';

const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Relatorios() {
  const [period, setPeriod] = useState('mes');
  const { data, loading } = useAsync(async () => ((await supabase.from('bookings').select('*').neq('source', 'bloqueio').order('starts_at').limit(10000)).data as Booking[]) || []);

  const list = useMemo(() => {
    if (!data) return [];
    const today = dateKey();
    const ym = today.slice(0, 7);
    const prev = dateKey(new Date(new Date(`${ym}-01T12:00:00-03:00`).getTime() - 86400000)).slice(0, 7);
    return data.filter((b) => {
      const k = dateKey(b.starts_at);
      if (period === 'mes') return k.startsWith(ym);
      if (period === 'anterior') return k.startsWith(prev);
      if (period === '90') return k >= addDays(today, -90) && k <= today;
      if (period === 'ano') return k.startsWith(today.slice(0, 4));
      return true;
    });
  }, [data, period]);

  if (loading || !data) return <Spinner />;
  const done = list.filter((b) => b.status === 'concluido');
  const revenue = sum(done.map(bookingValue));
  const finished = list.filter((b) => ['concluido', 'cancelado', 'faltou'].includes(b.status));
  const rate = (s: string) => (finished.length ? Math.round((finished.filter((b) => b.status === s).length / finished.length) * 100) : 0);

  const byService = Object.values(done.reduce<Record<string, { name: string; qtd: number; total: number }>>((acc, b) => {
    (acc[b.service_title] ||= { name: b.service_title, qtd: 0, total: 0 }); acc[b.service_title].qtd++; acc[b.service_title].total += bookingValue(b); return acc;
  }, {})).sort((a, b) => b.total - a.total);
  const byWeekday = WD.map((l, i) => ({ l, qtd: list.filter((b) => ['pendente', 'confirmado', 'concluido'].includes(b.status) && weekdayOf(dateKey(b.starts_at)) === i).length }));
  const topClients = Object.values(done.reduce<Record<string, { name: string; qtd: number; total: number }>>((acc, b) => {
    const k = b.client_id || b.client_phone || b.client_name; (acc[k] ||= { name: b.client_name, qtd: 0, total: 0 }); acc[k].qtd++; acc[k].total += bookingValue(b); return acc;
  }, {})).sort((a, b) => b.total - a.total).slice(0, 5);
  const bySource = ['site', 'manual'].map((s) => ({ s, n: list.filter((b) => b.source === s).length }));

  const exportCsv = () => downloadCsv(`agendamentos-${period}.csv`, [['Data', 'Hora', 'Cliente', 'Telefone', 'Serviço', 'Status', 'Origem', 'Valor (R$)'], ...list.map((b) => [fmtDate(b.starts_at), fmtTime(b.starts_at), b.client_name, b.client_phone, b.service_title, STATUS_LABEL[b.status], b.source, (bookingValue(b) / 100).toFixed(2).replace('.', ',')])]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap justify-between gap-3 items-center"><h1 className="text-3xl font-serif">Relatórios</h1>
        <div className="flex gap-2"><Select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="mes">Este mês</option><option value="anterior">Mês anterior</option><option value="90">Últimos 90 dias</option><option value="ano">Este ano</option><option value="tudo">Tudo</option></Select><Button variant="outline" onClick={exportCsv}><Download size={15} /> CSV</Button></div></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Receita', money(revenue)], ['Atendimentos concluídos', done.length], ['Ticket médio', money(done.length ? Math.round(revenue / done.length) : 0)], ['Cancelamentos / faltas', `${rate('cancelado')}% / ${rate('faltou')}%`]].map(([l, v]) => <Card key={l as string}><p className="text-2xl font-serif">{v}</p><p className="text-xs text-muted-foreground mt-1">{l}</p></Card>)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><h2 className="font-serif text-lg mb-3">Agendamentos por dia da semana</h2><div className="h-52"><ResponsiveContainer><BarChart data={byWeekday}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="l" fontSize={12} /><YAxis allowDecimals={false} width={28} fontSize={12} /><Tooltip /><Bar dataKey="qtd" name="Agendamentos" fill="#b98c00" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card><h2 className="font-serif text-lg mb-3">Receita por serviço</h2>{byService.length === 0 ? <p className="text-sm text-muted-foreground">Sem atendimentos concluídos no período.</p> : <table className="w-full text-sm"><tbody>{byService.map((s) => <tr key={s.name} className="border-b border-border last:border-0"><td className="py-2">{s.name}</td><td className="text-muted-foreground">{s.qtd}x</td><td className="text-right font-medium">{money(s.total)}</td></tr>)}</tbody></table>}</Card>
        <Card><h2 className="font-serif text-lg mb-3">Melhores clientes</h2>{topClients.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : <ul className="text-sm space-y-2">{topClients.map((c) => <li key={c.name} className="flex justify-between"><span>{c.name} <span className="text-muted-foreground">({c.qtd}x)</span></span><span className="font-medium">{money(c.total)}</span></li>)}</ul>}</Card>
        <Card><h2 className="font-serif text-lg mb-3">Origem dos agendamentos</h2><ul className="text-sm space-y-2">{bySource.map((s) => <li key={s.s} className="flex justify-between"><span>{s.s === 'site' ? 'Site (online)' : 'Manual (WhatsApp/balcão)'}</span><span className="font-medium">{s.n}</span></li>)}</ul></Card>
      </div>
    </div>
  );
}

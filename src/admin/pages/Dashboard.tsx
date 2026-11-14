import { Link } from 'wouter';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarClock, Clock3, DollarSign, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';
import { addDays, dateKey, fmtDateLong, fmtTime, money } from '@/lib/time';
import { Badge, Button, Card, Empty, Spinner } from '@/components/ui';
import { bookingValue, sum, syncBooking, useAsync } from '../lib';

export default function Dashboard() {
  const { data, loading, reload } = useAsync(async () => {
    const since = new Date(Date.now() - 190 * 86400000).toISOString();
    const [b, c, m, t] = await Promise.all([
      supabase.from('bookings').select('*').gte('starts_at', since).order('starts_at'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('approved', false),
    ]);
    return { bookings: ((b.data as Booking[]) || []).filter((x) => x.source !== 'bloqueio'), newClients: c.count ?? 0, unread: m.count ?? 0, pendingTestimonials: t.count ?? 0 };
  });

  if (loading || !data) return <Spinner />;
  const { bookings } = data;
  const today = dateKey();
  const monthKey = today.slice(0, 7);
  const now = Date.now();

  const todays = bookings.filter((b) => dateKey(b.starts_at) === today && ['pendente', 'confirmado', 'concluido'].includes(b.status));
  const pending = bookings.filter((b) => b.status === 'pendente' && new Date(b.starts_at).getTime() > now);
  const monthRevenue = sum(bookings.filter((b) => dateKey(b.starts_at).startsWith(monthKey)).map(bookingValue));
  const upcoming = bookings.filter((b) => new Date(b.starts_at).getTime() >= now && ['pendente', 'confirmado'].includes(b.status)).slice(0, 6);

  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i), 1);
    const key = dateKey(d).slice(0, 7);
    return { key, label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d), receita: sum(bookings.filter((b) => dateKey(b.starts_at).startsWith(key)).map(bookingValue)) / 100 };
  });
  const next14 = Array.from({ length: 14 }).map((_, i) => {
    const k = addDays(today, i);
    return { label: k.slice(8) + '/' + k.slice(5, 7), qtd: bookings.filter((b) => dateKey(b.starts_at) === k && ['pendente', 'confirmado'].includes(b.status)).length };
  });

  async function setStatus(b: Booking, status: Booking['status']) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', b.id);
    if (error) return toast.error('Não foi possível atualizar.');
    syncBooking(b.id);
    toast.success(status === 'confirmado' ? 'Horário confirmado!' : 'Atualizado.');
    reload();
  }

  const kpis = [
    { icon: CalendarClock, label: 'Atendimentos hoje', value: todays.length },
    { icon: Clock3, label: 'Aguardando confirmação', value: pending.length, link: '/agenda?status=pendente' },
    { icon: DollarSign, label: 'Receita do mês', value: money(monthRevenue) },
    { icon: UserPlus, label: 'Novas clientes (30 dias)', value: data.newClients },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div><h1 className="text-3xl font-serif">Visão geral</h1><p className="text-sm text-muted-foreground capitalize">{fmtDateLong(new Date().toISOString())}</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const inner = (
            <Card className="h-full"><k.icon className="text-primary mb-3" size={22} /><p className="text-2xl font-serif">{k.value}</p><p className="text-xs text-muted-foreground mt-1">{k.label}</p></Card>
          );
          return k.link ? <Link key={k.label} href={k.link}>{inner}</Link> : <div key={k.label}>{inner}</div>;
        })}
      </div>

      {(data.unread > 0 || data.pendingTestimonials > 0) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {data.unread > 0 && <Link href="/mensagens" className="rounded-full bg-primary/15 text-primary px-4 py-2">{data.unread} mensagem(ns) não lida(s)</Link>}
          {data.pendingTestimonials > 0 && <Link href="/depoimentos" className="rounded-full bg-primary/15 text-primary px-4 py-2">{data.pendingTestimonials} depoimento(s) para aprovar</Link>}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-serif text-lg mb-4">Receita dos últimos 6 meses</h2>
          <div className="h-56"><ResponsiveContainer><BarChart data={months}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" fontSize={12} /><YAxis fontSize={12} width={50} /><Tooltip formatter={(v: number) => money(v * 100)} /><Bar dataKey="receita" fill="#b98c00" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card>
          <h2 className="font-serif text-lg mb-4">Agendamentos nos próximos 14 dias</h2>
          <div className="h-56"><ResponsiveContainer><BarChart data={next14}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" fontSize={11} /><YAxis allowDecimals={false} fontSize={12} width={30} /><Tooltip /><Bar dataKey="qtd" name="Agendamentos" fill="#d4a62a" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4"><h2 className="font-serif text-lg">Próximos atendimentos</h2><Link href="/agenda" className="text-sm text-primary">Abrir agenda →</Link></div>
        {upcoming.length === 0 ? <Empty>Nenhum atendimento futuro.</Empty> : (
          <ul className="divide-y divide-border">
            {upcoming.map((b) => (
              <li key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{b.client_name} <span className="text-muted-foreground font-normal">· {b.service_title}</span></p>
                  <p className="text-xs text-muted-foreground capitalize">{fmtDateLong(b.starts_at)} às {fmtTime(b.starts_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={b.status}>{STATUS_LABEL[b.status]}</Badge>
                  {b.status === 'pendente' && <Button size="sm" variant="success" onClick={() => setStatus(b, 'confirmado')}>Confirmar</Button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

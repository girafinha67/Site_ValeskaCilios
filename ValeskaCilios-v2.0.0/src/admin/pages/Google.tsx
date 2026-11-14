import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, CircleAlert, RefreshCw } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/lib/supabase';
import { Button, Card, Select, Spinner } from '@/components/ui';
import { useAsync } from '../lib';

interface Stats {
  status: { serviceAccountEmail: string | null; googleConfigured: boolean; calendarConfigured: boolean; ga4Configured: boolean; gscConfigured: boolean };
  calendar: { data?: { summary: string }; error?: string } | null;
  ga4: { data?: { totals: { users: number; sessions: number; pageviews: number }; daily: { date: string; users: number; pageviews: number }[]; pages: { path: string; views: number }[]; channels: { channel: string; sessions: number }[] }; error?: string } | null;
  gsc: { data?: { totals: { clicks: number; impressions: number; ctr: number; position: number }; queries: { key: string; clicks: number; impressions: number; position: number }[]; pages: { key: string; clicks: number; impressions: number }[] }; error?: string } | null;
}

const Status = ({ ok, title, detail, hint }: { ok: boolean; title: string; detail?: string; hint: string }) => (
  <Card className="flex gap-3">{ok ? <CheckCircle2 className="text-emerald-600 shrink-0" /> : <CircleAlert className="text-amber-600 shrink-0" />}<div><p className="font-medium">{title}</p><p className="text-xs text-muted-foreground">{ok ? detail : hint}</p></div></Card>
);

export default function GoogleIntegracoes() {
  const [days, setDays] = useState('28');
  const [syncing, setSyncing] = useState(false);
  const { data, loading, error, reload } = useAsync(() => api<Stats>(`google-stats?days=${days}`), [days]);

  async function syncAll() {
    setSyncing(true);
    try {
      const r = await api<{ synced: number; skipped?: boolean; errors?: string[] }>('calendar-sync', { body: { all: true } });
      if (r.skipped) toast.warning('Google Agenda ainda não configurado.');
      else toast.success(`${r.synced} agendamento(s) sincronizado(s).${r.errors?.length ? ` ${r.errors.length} erro(s).` : ''}`);
    } catch (e) { toast.error((e as Error).message); }
    setSyncing(false);
  }

  if (loading) return <Spinner />;
  if (error || !data) return <p className="text-destructive">{error || 'Falha ao carregar.'} (Em desenvolvimento local use "netlify dev".)</p>;
  const { status, calendar, ga4, gsc } = data;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap justify-between gap-3 items-center"><h1 className="text-3xl font-serif">Google: Agenda, Analytics e Search</h1><div className="flex gap-2"><Select value={days} onChange={(e) => setDays(e.target.value)}><option value="7">7 dias</option><option value="28">28 dias</option><option value="90">90 dias</option></Select><Button variant="outline" onClick={reload}><RefreshCw size={15} /></Button></div></div>

      <div className="grid md:grid-cols-3 gap-4">
        <Status ok={status.calendarConfigured && !calendar?.error} title="Google Agenda" detail={calendar?.data?.summary ? `Conectada: ${calendar.data.summary}` : 'Conectada'} hint={calendar?.error || 'Defina GOOGLE_SERVICE_ACCOUNT_JSON e GOOGLE_CALENDAR_ID (veja o README).'} />
        <Status ok={status.ga4Configured && !ga4?.error} title="Google Analytics 4" detail="Dados recebidos" hint={ga4?.error || 'Defina GA4_PROPERTY_ID e dê acesso de Leitor ao e-mail da conta de serviço.'} />
        <Status ok={status.gscConfigured && !gsc?.error} title="Search Console" detail="Dados recebidos" hint={gsc?.error || 'Defina GSC_SITE_URL e adicione a conta de serviço como usuária.'} />
      </div>
      {status.serviceAccountEmail && <p className="text-xs text-muted-foreground">E-mail da conta de serviço (compartilhe a agenda/propriedades com ele): <code className="select-all bg-muted rounded px-1.5 py-0.5">{status.serviceAccountEmail}</code></p>}

      <Card className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">Sincronizar agenda com o Google</p><p className="text-xs text-muted-foreground">Cria/atualiza no Google Agenda todos os agendamentos de ontem em diante.</p></div><Button loading={syncing} disabled={!status.calendarConfigured} onClick={syncAll}>Sincronizar agora</Button></Card>

      {ga4?.data && (
        <div className="space-y-4">
          <h2 className="font-serif text-2xl">Visitas do site (GA4)</h2>
          <div className="grid grid-cols-3 gap-4">{[['Usuários', ga4.data.totals.users], ['Sessões', ga4.data.totals.sessions], ['Visualizações', ga4.data.totals.pageviews]].map(([l, v]) => <Card key={l as string}><p className="text-2xl font-serif">{v}</p><p className="text-xs text-muted-foreground">{l}</p></Card>)}</div>
          <Card><div className="h-56"><ResponsiveContainer><AreaChart data={ga4.data.daily.map((d) => ({ ...d, label: `${d.date.slice(6)}/${d.date.slice(4, 6)}` }))}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="label" fontSize={11} /><YAxis width={30} fontSize={12} /><Tooltip /><Area type="monotone" dataKey="pageviews" name="Visualizações" stroke="#b98c00" fill="#b98c0033" /><Area type="monotone" dataKey="users" name="Usuários" stroke="#1d2140" fill="#1d214022" /></AreaChart></ResponsiveContainer></div></Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card><h3 className="font-serif mb-2">Páginas mais vistas</h3><ul className="text-sm space-y-1.5">{ga4.data.pages.map((p) => <li key={p.path} className="flex justify-between gap-2"><span className="truncate">{p.path}</span><span className="font-medium">{p.views}</span></li>)}</ul></Card>
            <Card><h3 className="font-serif mb-2">De onde vêm as visitas</h3><ul className="text-sm space-y-1.5">{ga4.data.channels.map((p) => <li key={p.channel} className="flex justify-between"><span>{p.channel}</span><span className="font-medium">{p.sessions}</span></li>)}</ul></Card>
          </div>
        </div>
      )}

      {gsc?.data && (
        <div className="space-y-4">
          <h2 className="font-serif text-2xl">Buscas no Google (Search Console)</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[['Cliques', gsc.data.totals.clicks], ['Impressões', gsc.data.totals.impressions], ['CTR', `${(gsc.data.totals.ctr * 100).toFixed(1)}%`], ['Posição média', gsc.data.totals.position.toFixed(1)]].map(([l, v]) => <Card key={l as string}><p className="text-2xl font-serif">{v}</p><p className="text-xs text-muted-foreground">{l}</p></Card>)}</div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card><h3 className="font-serif mb-2">Principais buscas</h3><ul className="text-sm space-y-1.5">{gsc.data.queries.map((q) => <li key={q.key} className="flex justify-between gap-2"><span className="truncate">{q.key}</span><span className="text-muted-foreground">{q.clicks} cliques · pos. {q.position.toFixed(1)}</span></li>)}</ul></Card>
            <Card><h3 className="font-serif mb-2">Páginas que aparecem</h3><ul className="text-sm space-y-1.5">{gsc.data.pages.map((q) => <li key={q.key} className="flex justify-between gap-2"><span className="truncate">{q.key.replace(/^https?:\/\/[^/]+/, '') || '/'}</span><span className="text-muted-foreground">{q.clicks} cliques</span></li>)}</ul></Card>
          </div>
        </div>
      )}
    </div>
  );
}

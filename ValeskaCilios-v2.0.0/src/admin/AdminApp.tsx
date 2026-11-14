import { Suspense, lazy, useState, type FormEvent } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { Toaster, toast } from 'sonner';
import { BarChart3, CalendarDays, Clock, Globe, LayoutDashboard, LogOut, Menu, MessageSquare, Scissors, Settings, Star, Users, X } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase, supabaseReady } from '@/lib/supabase';
import { Button, Field, Input, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAsync } from './lib';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Servicos = lazy(() => import('./pages/Servicos'));
const Horarios = lazy(() => import('./pages/Horarios'));
const Mensagens = lazy(() => import('./pages/Mensagens'));
const Depoimentos = lazy(() => import('./pages/Depoimentos'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const GoogleIntegracoes = lazy(() => import('./pages/Google'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));

const NAV = [
  { path: '/', label: 'Visão geral', icon: LayoutDashboard },
  { path: '/agenda', label: 'Agenda', icon: CalendarDays, badge: 'pending' },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/servicos', label: 'Serviços', icon: Scissors },
  { path: '/horarios', label: 'Horários e regras', icon: Clock },
  { path: '/mensagens', label: 'Mensagens', icon: MessageSquare, badge: 'unread' },
  { path: '/depoimentos', label: 'Depoimentos', icon: Star, badge: 'testimonials' },
  { path: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { path: '/google', label: 'Google (Agenda, GA4, Search)', icon: Globe },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
] as const;

function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try { await signIn(email.trim(), password); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="glass rounded-3xl p-8 w-full max-w-sm space-y-4">
        <div className="text-center mb-2">
          <p className="font-serif text-3xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Valeska Cílios</p>
          <p className="text-sm text-muted-foreground">Painel administrativo</p>
        </div>
        {!supabaseReady && <p className="text-xs rounded-xl bg-amber-100 text-amber-800 p-3">Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja o README).</p>}
        <Field label="E-mail"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
        <Field label="Senha"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></Field>
        <Button type="submit" loading={busy} className="w-full" size="lg">Entrar</Button>
        <a href="/" className="block text-center text-xs text-muted-foreground hover:text-primary">← Voltar ao site</a>
      </form>
    </div>
  );
}

function Shell() {
  const [location] = useLocation();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: counts, reload } = useAsync(async () => {
    const [p, m, t] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pendente').gte('starts_at', new Date().toISOString()),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('approved', false),
    ]);
    return { pending: p.count ?? 0, unread: m.count ?? 0, testimonials: t.count ?? 0 };
  }, [location]);
  void reload;

  const sidebar = (
    <nav className="flex flex-col gap-1" aria-label="Menu do painel">
      {NAV.map((n) => {
        const active = n.path === '/' ? location === '/' : location.startsWith(n.path);
        const badge = 'badge' in n ? counts?.[n.badge] : 0;
        return (
          <Link key={n.path} href={n.path} onClick={() => setOpen(false)} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition', active ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:bg-muted')}>
            <n.icon size={18} /> <span className="flex-1">{n.label}</span>
            {!!badge && <span className="rounded-full bg-primary text-white text-[11px] px-2 py-0.5">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-6 border-r border-border bg-white/50 p-5 sticky top-0 h-screen">
        <p className="font-serif text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Valeska Cílios</p>
        {sidebar}
        <div className="mt-auto space-y-2 text-xs text-muted-foreground">
          <p className="truncate">{profile?.email}</p>
          <a href="/" target="_blank" rel="noreferrer" className="block hover:text-primary">Ver site ↗</a>
          <button onClick={() => signOut()} className="flex items-center gap-1 hover:text-destructive"><LogOut size={14} /> Sair</button>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white/90 backdrop-blur border-b border-border px-4 py-3">
        <p className="font-serif text-xl text-primary">Painel</p>
        <button onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </header>
      {open && <div className="lg:hidden fixed inset-0 top-[53px] z-30 bg-white p-5 overflow-y-auto">{sidebar}<button onClick={() => signOut()} className="mt-6 text-sm text-destructive flex items-center gap-1"><LogOut size={14} /> Sair</button></div>}

      <main className="flex-1 min-w-0 p-4 sm:p-8">
        <Suspense fallback={<Spinner />}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/agenda" component={Agenda} />
            <Route path="/clientes" component={Clientes} />
            <Route path="/servicos" component={Servicos} />
            <Route path="/horarios" component={Horarios} />
            <Route path="/mensagens" component={Mensagens} />
            <Route path="/depoimentos" component={Depoimentos} />
            <Route path="/relatorios" component={Relatorios} />
            <Route path="/google" component={GoogleIntegracoes} />
            <Route path="/configuracoes" component={Configuracoes} />
            <Route><p className="py-20 text-center text-muted-foreground">Página não encontrada.</p></Route>
          </Switch>
        </Suspense>
      </main>
    </div>
  );
}

function Gate() {
  const { user, loading, isAdmin, signOut, profile } = useAuth();
  if (loading) return <Spinner className="pt-40" />;
  if (!user) return <Login />;
  if (!profile) return <Spinner className="pt-40" />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="glass rounded-3xl p-8 max-w-sm space-y-4">
          <p className="font-serif text-2xl">Acesso restrito</p>
          <p className="text-sm text-muted-foreground">A conta {user.email} não tem permissão de administrador.</p>
          <div className="flex gap-2 justify-center"><Button variant="outline" onClick={() => signOut()}>Sair</Button><a href="/" className="btn-glass-gold px-5 py-2.5 text-sm">Ir ao site</a></div>
        </div>
      </div>
    );
  }
  return <Shell />;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <WouterRouter base="/admin">
        <Gate />
      </WouterRouter>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

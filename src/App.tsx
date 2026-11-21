import { Suspense, lazy, type ReactNode } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollToTop } from '@/components/ScrollToTop';
import { CookieBanner } from '@/components/CookieBanner';
import { Spinner } from '@/components/ui';
import { AuthProvider } from '@/lib/auth';
import { SettingsProvider } from '@/lib/settings';
import NotFound from '@/pages/not-found';

const Home = lazy(() => import('@/pages/Home'));
const Sobre = lazy(() => import('@/pages/Sobre'));
const Servicos = lazy(() => import('@/pages/Servicos'));
const Agendar = lazy(() => import('@/pages/Agendar'));
const Entrar = lazy(() => import('@/pages/Entrar'));
const Confirmado = lazy(() => import('@/pages/Confirmado'));
const MinhaConta = lazy(() => import('@/pages/MinhaConta'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogArtigo = lazy(() => import('@/pages/BlogArtigo'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Contato = lazy(() => import('@/pages/Contato'));
const Privacidade = lazy(() => import('@/pages/Legal').then((m) => ({ default: m.Privacidade })));
const Termos = lazy(() => import('@/pages/Legal').then((m) => ({ default: m.Termos })));

const Layout = ({ children }: { children: ReactNode }) => (
  <>
    <Navbar />
    <main id="conteudo"><Suspense fallback={<Spinner className="pt-48" />}>{children}</Suspense></main>
    <Footer />
  </>
);

const page = (C: React.ComponentType) => () => <Layout><C /></Layout>;

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <WouterRouter>
          <ScrollToTop />
          <Switch>
            <Route path="/" component={page(Home)} />
            <Route path="/sobre" component={page(Sobre)} />
            <Route path="/servicos" component={page(Servicos)} />
            <Route path="/agendar" component={page(Agendar)} />
            <Route path="/entrar" component={page(Entrar)} />
            <Route path="/confirmado" component={page(Confirmado)} />
            <Route path="/minha-conta" component={page(MinhaConta)} />
            <Route path="/blog" component={page(Blog)} />
            <Route path="/blog/:slug" component={page(BlogArtigo)} />
            <Route path="/faq" component={page(FAQ)} />
            <Route path="/contato" component={page(Contato)} />
            <Route path="/privacidade" component={page(Privacidade)} />
            <Route path="/termos" component={page(Termos)} />
            <Route component={page(NotFound)} />
          </Switch>
        </WouterRouter>
        <CookieBanner />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </SettingsProvider>
  );
}

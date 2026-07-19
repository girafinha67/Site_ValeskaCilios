import React, { Suspense, lazy } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import NotFound from '@/pages/not-found';

const Home = lazy(() => import('@/pages/Home'));
const Sobre = lazy(() => import('@/pages/Sobre'));
const Servicos = lazy(() => import('@/pages/Servicos'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogArtigo = lazy(() => import('@/pages/BlogArtigo'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Contato = lazy(() => import('@/pages/Contato'));
const PrivacidadePolicy = lazy(() => import('@/pages/PrivacidadePolicy'));
const TermosUso = lazy(() => import('@/pages/TermosUso'));

const LoadingFallback = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-transparent">
    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
  </div>
);

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
      <Footer />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <AppLayout><Home /></AppLayout>} />
      <Route path="/sobre" component={() => <AppLayout><Sobre /></AppLayout>} />
      <Route path="/servicos" component={() => <AppLayout><Servicos /></AppLayout>} />
      <Route path="/blog" component={() => <AppLayout><Blog /></AppLayout>} />
      <Route path="/blog/:slug" component={() => <AppLayout><BlogArtigo /></AppLayout>} />
      <Route path="/faq" component={() => <AppLayout><FAQ /></AppLayout>} />
      <Route path="/contato" component={() => <AppLayout><Contato /></AppLayout>} />
      <Route path="/privacidade" component={() => <AppLayout><PrivacidadePolicy /></AppLayout>} />
      <Route path="/termos" component={() => <AppLayout><TermosUso /></AppLayout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ScrollToTop />
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;

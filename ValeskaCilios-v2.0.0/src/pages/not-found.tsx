import { GlassButton } from '@/components/GlassButton';
import { useSEO } from '@/hooks/useSEO';

export default function NotFound() {
  useSEO({ title: 'Página não encontrada', noindex: true });
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6 pt-24 text-center">
      <div>
        <p className="font-serif text-8xl text-primary/40">404</p>
        <h1 className="text-3xl font-serif mt-4 mb-3">Página não encontrada</h1>
        <p className="text-muted-foreground mb-8">O endereço que você tentou acessar não existe ou foi movido.</p>
        <GlassButton href="/">Voltar ao início</GlassButton>
      </div>
    </section>
  );
}

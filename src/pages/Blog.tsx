import { useState } from 'react';
import { Link } from 'wouter';
import { blogPosts } from '@/data/blogPosts';
import { useSEO } from '@/hooks/useSEO';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { GlassCard } from '@/components/GlassCard';
import { cn } from '@/lib/utils';

export default function Blog() {
  useSEO({ title: 'Blog', description: 'Dicas de cuidados, tendências e informações sobre extensões de cílios.' });
  const [cat, setCat] = useState<string | null>(null);
  const cats = Array.from(new Set(blogPosts.map((p) => p.category)));
  const list = cat ? blogPosts.filter((p) => p.category === cat) : blogPosts;
  useScrollAnimation([cat]);
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-serif mb-6">Nosso <span className="italic font-light text-primary">Blog</span></h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Seu guia completo sobre cuidados, tendências e os bastidores do universo da beleza do olhar.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[null, ...cats].map((c) => (
            <button key={c ?? 'all'} onClick={() => setCat(c)} className={cn('px-5 py-2 rounded-full text-sm transition', cat === c ? 'btn-glass-gold' : 'glass hover:bg-white/80')}>{c ?? 'Todos os artigos'}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {list.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="scroll-animate">
              <GlassCard className="!p-0 overflow-hidden h-full flex flex-col hover:-translate-y-1">
                <div className="h-56 bg-gradient-to-br from-[#fde8f0] via-[#e8f4fd] to-[#fff5e8] shrink-0" />
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex justify-between text-xs text-muted-foreground mb-3"><span>{new Date(p.date).toLocaleDateString('pt-BR')}</span><span>{p.readTime}</span></div>
                  <span className="text-xs text-primary font-medium mb-2">{p.category}</span>
                  <h2 className="font-serif text-xl mb-3 leading-snug">{p.title}</h2>
                  <p className="text-sm text-muted-foreground flex-grow">{p.excerpt}</p>
                  <span className="mt-6 text-primary text-sm font-medium">Ler artigo completo →</span>
                </div>
              </GlassCard>
            </Link>
          ))}
          {!list.length && <div className="col-span-full py-20 text-center glass rounded-3xl">Nenhum artigo encontrado para esta categoria.</div>}
        </div>
      </div>
    </section>
  );
}

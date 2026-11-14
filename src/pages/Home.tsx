import { Link } from 'wouter';
import { ArrowRight, Clock } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { useSEO } from '@/hooks/useSEO';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useTestimonials } from '@/hooks/useTestimonials';
import { blogPosts } from '@/data/blogPosts';
import { GlassButton } from '@/components/GlassButton';
import { GlassCard } from '@/components/GlassCard';
import { Stars } from '@/components/Stars';
import { durationLabel, money } from '@/lib/time';

export default function Home() {
  const { site, services } = useSettings();
  const testimonials = useTestimonials();
  useSEO({ description: site.description });
  useScrollAnimation([services.length, testimonials.length]);

  return (
    <>
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 px-6">
        <div className="absolute top-1/4 -right-64 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-start gap-8 z-10 animate-fade-in-up">
            <div className="glass px-4 py-1.5 rounded-full text-sm font-medium text-primary">Especialista em Design de Cílios</div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold leading-[1.1] tracking-tight">
              Realce o seu olhar com <span className="italic font-light text-primary">elegância</span> e cuidado
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md font-light">{site.tagline}. Técnicas exclusivas para valorizar a sua beleza natural.</p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <GlassButton href="/agendar" size="lg" trackName="cta_agendar_hero">Agendar online</GlassButton>
              <GlassButton href={`https://wa.me/${site.whatsapp}`} size="lg" trackName="whatsapp_click">WhatsApp</GlassButton>
            </div>
          </div>
          <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-[#fde8f0] via-[#e8f4fd] to-[#fff5e8] rounded-[2.5rem] rotate-3 opacity-60" />
            <div className="absolute inset-0 glass rounded-[2.5rem] -rotate-2 overflow-hidden flex flex-col items-center justify-center shadow-2xl p-8 border-white/60">
              <div className="w-32 h-32 rounded-full border border-primary/40 absolute top-10 right-10" />
              <div className="w-48 h-48 rounded-full border border-secondary/40 absolute bottom-10 left-10" />
              <div className="w-full max-w-xs text-center z-10 space-y-5">
                <div className="flex flex-col items-center gap-1"><Stars /><span className="text-xs font-medium text-muted-foreground">+ de 500 clientes satisfeitas</span></div>
                <div className="w-16 h-[2px] bg-primary mx-auto rounded-full" />
                <p className="font-serif text-3xl italic">O olhar que você sempre sonhou, com quem realmente entende do assunto!</p>
                <div className="w-16 h-[2px] bg-primary mx-auto rounded-full" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs font-medium text-primary uppercase tracking-widest">Especialista</span>
                  <span className="font-serif text-lg">{site.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16 scroll-animate">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif mb-4">Nossos Serviços</h2>
              <p className="text-muted-foreground max-w-lg">Técnicas personalizadas para cada tipo de olhar, garantindo um resultado harmonioso e natural.</p>
            </div>
            <Link href="/servicos" className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">Ver todos <ArrowRight size={18} /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.slice(0, 3).map((s) => (
              <GlassCard key={s.id} className="scroll-animate flex flex-col h-full group relative hover:-translate-y-1">
                {s.tag && <span className="absolute top-6 right-6 bg-white/80 text-xs font-medium px-3 py-1 rounded-full text-primary shadow-sm">{s.tag}</span>}
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl mb-6 group-hover:scale-110 transition-transform">{s.icon}</div>
                <h3 className="text-xl font-serif mb-3">{s.title}</h3>
                <p className="text-muted-foreground text-sm mb-6 flex-grow">{s.description}</p>
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-border/50">
                  <div><p className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> {durationLabel(s.duration_min)}</p><p className="font-medium">{s.price_prefix} {money(s.price_cents)}</p></div>
                  <GlassButton href={`/agendar?servico=${s.id}`} size="sm" trackName="cta_agendar_servico">Agendar</GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-secondary/5 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-4xl md:text-5xl font-serif mb-4">O que dizem nossas clientes</h2>
            <p className="text-muted-foreground">Histórias reais de transformações que vão muito além do olhar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.slice(0, 6).map((t) => (
              <GlassCard key={t.id} className="scroll-animate !p-6">
                <Stars n={t.rating} />
                <p className="my-4 text-sm leading-relaxed text-muted-foreground">“{t.text}”</p>
                <p className="font-serif">{t.name}</p>
                {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <GlassCard className="text-center scroll-animate !p-10 md:!p-16 bg-gradient-to-br from-primary/10 to-secondary/10">
            <h2 className="text-3xl md:text-5xl font-serif mb-4">Pronta para ter o olhar dos seus sonhos?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Agende sua avaliação gratuita e descubra qual técnica é perfeita para realçar a sua beleza natural.</p>
            <GlassButton href="/agendar" size="lg" trackName="cta_agendar_final">Agendar meu horário</GlassButton>
          </GlassCard>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-end mb-12 scroll-animate">
            <div><h2 className="text-4xl font-serif mb-3">Blog</h2><p className="text-muted-foreground">Dicas de cuidados, tendências e tudo sobre o universo dos cílios.</p></div>
            <Link href="/blog" className="hidden md:inline-flex items-center gap-2 text-primary font-medium">Ler todos os artigos <ArrowRight size={18} /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="scroll-animate">
                <GlassCard className="!p-0 overflow-hidden h-full hover:-translate-y-1">
                  <div className="h-40 bg-gradient-to-br from-[#fde8f0] via-[#e8f4fd] to-[#fff5e8]" />
                  <div className="p-6">
                    <p className="text-xs text-muted-foreground mb-2">{new Date(p.date).toLocaleDateString('pt-BR')} · {p.readTime}</p>
                    <h3 className="font-serif text-lg leading-snug">{p.title}</h3>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

import { Clock, Tag } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { useSEO } from '@/hooks/useSEO';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { GlassButton } from '@/components/GlassButton';
import { GlassCard } from '@/components/GlassCard';
import { durationLabel, money } from '@/lib/time';

const steps = [
  ['Avaliação', 'Análise da saúde dos fios naturais e mapeamento facial (visagismo).'],
  ['Preparação', 'Spa dos cílios para remover oleosidade e garantir a retenção da cola.'],
  ['Aplicação', 'Isolamento fio a fio num ambiente relaxante (você pode até dormir!).'],
  ['Finalização', 'Secagem, escovação e orientações de cuidados pós-procedimento.'],
];

export default function Servicos() {
  const { site, services } = useSettings();
  useSEO({ title: 'Serviços', description: `Conheça todas as técnicas de extensão de cílios, lash lift e design de sobrancelhas oferecidas por ${site.name}.` });
  useScrollAnimation([services.length]);
  return (
    <>
      <section className="pt-32 pb-16 px-6 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
        <div className="container mx-auto max-w-3xl animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-serif mb-6">Nossos <span className="italic font-light text-primary">Serviços</span></h1>
          <p className="text-lg text-muted-foreground">De looks sutis e naturais ao volume mais dramático. Tudo feito com precisão, produtos premium e muito cuidado com a saúde dos seus cílios.</p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((s) => (
            <GlassCard key={s.id} className="scroll-animate flex flex-col relative">
              {s.tag && <span className="absolute top-6 right-6 bg-white/80 text-xs font-medium px-3 py-1 rounded-full text-primary shadow-sm">{s.tag}</span>}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-primary text-2xl shrink-0">{s.icon}</div>
                <div>
                  <h2 className="text-2xl font-serif mb-2">{s.title}</h2>
                  <div className="flex gap-4 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1"><Clock size={14} /> {durationLabel(s.duration_min)}</span>
                    <span className="flex items-center gap-1"><Tag size={14} /> {s.price_prefix} {money(s.price_cents)}</span>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">{s.description}</p>
              <div className="pt-6 border-t border-glass-border flex gap-3 flex-wrap">
                <GlassButton href={`/agendar?servico=${s.id}`} size="sm" trackName="cta_agendar_servico">Agendar online</GlassButton>
                <GlassButton href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre o serviço de ${s.title}.`)}`} size="sm" trackName="whatsapp_click">Tirar dúvidas</GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 bg-gradient-to-br from-[#fde8f0]/40 via-[#e8f4fd]/40 to-[#fff5e8]/40">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16 scroll-animate"><h2 className="text-4xl font-serif">A experiência completa em nosso estúdio</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map(([t, d], i) => (
              <div key={t} className="scroll-animate text-center">
                <div className="w-16 h-16 mx-auto glass rounded-full flex items-center justify-center font-serif text-2xl text-primary mb-4">{i + 1}</div>
                <h3 className="font-serif text-lg mb-2">{t}</h3>
                <p className="text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

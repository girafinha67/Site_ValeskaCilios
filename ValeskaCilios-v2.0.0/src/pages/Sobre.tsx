import { Award, Heart, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { useSEO } from '@/hooks/useSEO';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { GlassButton } from '@/components/GlassButton';
import { GlassCard } from '@/components/GlassCard';

const pillars = [
  { icon: Heart, title: 'Saúde em primeiro lugar', text: 'Nunca comprometo a saúde dos seus cílios naturais. Avalio cuidadosamente o peso e comprimento ideal para a sua estrutura.' },
  { icon: Sparkles, title: 'Design personalizado', text: "Não existe um 'copiar e colar'. Faço um estudo do seu visagismo para criar o mapeamento que valorize o formato único dos seus olhos." },
  { icon: ShieldCheck, title: 'Materiais premium', text: 'Utilizo apenas materiais certificados e de alta tecnologia. Fios super macios, adesivos hipoalergênicos e ferramentas esterilizadas.' },
];
const formation = [
  ['Lash Academy Internacional', 'Especialização em Visagismo Ocular'],
  ['Beauty Institute São Paulo', 'Técnica Volume Russo Avançado'],
  ['Escola Russa de Estética', 'Formação Clássica Fio a Fio'],
];

export default function Sobre() {
  const { site } = useSettings();
  useSEO({ title: 'Sobre', description: `Conheça a história de ${site.name}, especialista em design de cílios.` });
  useScrollAnimation();
  return (
    <>
      <section className="w-full overflow-hidden pt-32 pb-16 px-6 relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -z-10" />
        <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1 animate-fade-in-up">
            <div className="aspect-[4/5] w-full max-w-md mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-white/50 to-secondary/30 rounded-[3rem] -rotate-3" />
              <div className="absolute inset-0 glass rounded-[3rem] rotate-2 flex items-center justify-center overflow-hidden border-2 border-white/60">
                <div className="text-center p-8 space-y-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center"><span className="font-serif text-4xl text-primary/80">{site.name.charAt(0)}</span></div>
                  <p className="font-serif text-2xl text-foreground/50 italic">{site.name}</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 glass p-4 rounded-2xl z-20 shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Award size={20} /></div>
                <div><p className="font-serif text-lg leading-none">+5 anos</p><p className="text-xs text-muted-foreground">de experiência</p></div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-serif mb-6">Prazer, eu sou a <span className="text-primary italic font-light">Valeska</span></h1>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>Acredito que o olhar tem o poder de comunicar quem somos antes mesmo de dizermos a primeira palavra. Minha jornada no universo da beleza começou há mais de cinco anos, com uma paixão inegável por detalhes e estética.</p>
              <p>O que me fascina no design de cílios não é apenas o resultado estético, mas a transformação na autoestima de cada mulher que senta na minha maca. É ver aquele sorriso tímido se transformar em uma postura radiante ao se olhar no espelho.</p>
              <p>Minha técnica é baseada em três pilares: saúde do cílio natural, design personalizado para o seu rosto e acabamento impecável. Cada fio é aplicado com precisão cirúrgica e muito amor.</p>
            </div>
            <div className="mt-10"><GlassButton href="/agendar" trackName="cta_agendar_sobre">Agendar meu horário</GlassButton></div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-4xl font-serif mb-4">Meus princípios</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Trabalho com propósito e dedicação para entregar o melhor para você.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((p) => (
              <div key={p.title} className="scroll-animate text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-6 text-primary"><p.icon size={26} /></div>
                <h3 className="text-xl font-serif mb-4">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="container mx-auto max-w-3xl">
          <GlassCard className="scroll-animate">
            <h2 className="text-3xl font-serif mb-8 text-center">Formação & Especializações</h2>
            <ul className="space-y-6">
              {formation.map(([school, course]) => (
                <li key={school} className="flex items-center gap-4 glass p-5 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><Star size={18} /></div>
                  <div><p className="font-serif">{school}</p><p className="text-sm text-muted-foreground">{course}</p></div>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </section>
    </>
  );
}

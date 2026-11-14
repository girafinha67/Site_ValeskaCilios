import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { faqItems } from '@/data/faq';
import { useSettings } from '@/lib/settings';
import { useSEO } from '@/hooks/useSEO';
import { GlassButton } from '@/components/GlassButton';
import { cn } from '@/lib/utils';

export default function FAQ() {
  const { site } = useSettings();
  const [open, setOpen] = useState<number[]>([1]);
  useSEO({ title: 'Dúvidas Frequentes', description: 'Respostas para as perguntas mais comuns sobre extensões de cílios, cuidados e agendamentos.' });
  const toggle = (id: number) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  return (
    <section className="pt-32 pb-16 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqItems.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) }) }} />
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-14 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-serif mb-6">Dúvidas <span className="italic font-light text-primary">Frequentes</span></h1>
          <p className="text-lg text-muted-foreground">Tudo o que você precisa saber antes, durante e depois do seu procedimento.</p>
        </div>
        <div className="space-y-4">
          {faqItems.map((f) => {
            const isOpen = open.includes(f.id);
            return (
              <div key={f.id} className="glass rounded-2xl overflow-hidden">
                <button onClick={() => toggle(f.id)} aria-expanded={isOpen} className="w-full flex items-center justify-between gap-4 text-left p-6 hover:bg-white/60 transition">
                  <span className="font-serif text-lg">{f.question}</span>
                  <span className={cn('w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition', isOpen && 'rotate-180 bg-primary text-white border-transparent')}><ChevronDown size={16} /></span>
                </button>
                {isOpen && <p className="px-6 pb-6 text-muted-foreground leading-relaxed">{f.answer}</p>}
              </div>
            );
          })}
        </div>
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-serif mb-3">Ainda tem dúvidas?</h2>
          <p className="text-muted-foreground mb-6">Fale diretamente comigo, será um prazer ajudar.</p>
          <GlassButton href={`https://wa.me/${site.whatsapp}`} trackName="whatsapp_click">Chamar no WhatsApp</GlassButton>
        </div>
      </div>
    </section>
  );
}

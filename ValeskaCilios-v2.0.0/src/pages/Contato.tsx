import { useState, type FormEvent } from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { SiInstagram, SiFacebook, SiTiktok, SiYoutube, SiWhatsapp } from 'react-icons/si';
import { toast } from 'sonner';
import { useSettings } from '@/lib/settings';
import { supabase, supabaseReady } from '@/lib/supabase';
import { track } from '@/lib/analytics';
import { useSEO } from '@/hooks/useSEO';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { GlassCard } from '@/components/GlassCard';

export default function Contato() {
  const { site, services } = useSettings();
  useSEO({ title: 'Contato', description: 'Agende seu horário, tire dúvidas ou venha nos visitar.' });
  const [f, setF] = useState({ name: '', email: '', phone: '', service: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (f.website) return; // honeypot (robôs)
    if (f.name.trim().length < 2) return toast.error('Informe seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast.error('Informe um e-mail válido.');
    if (f.message.trim().length < 5) return toast.error('Escreva sua mensagem.');
    if (!supabaseReady) return toast.error('Envio de mensagens ainda não configurado. Use o WhatsApp.');
    setBusy(true);
    const { error } = await supabase.from('contact_messages').insert({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() || null, service: f.service || null, message: f.message.trim() });
    setBusy(false);
    if (error) return toast.error('Não foi possível enviar agora. Tente pelo WhatsApp.');
    track('generate_lead', { method: 'contact_form' });
    setSent(true);
  }

  const info = [
    { icon: MapPin, label: 'Endereço', value: site.address },
    { icon: Phone, label: 'Telefone / WhatsApp', value: site.phone },
    { icon: Clock, label: 'Horário de Atendimento', value: site.hoursText },
    { icon: Mail, label: 'E-mail', value: site.email },
  ];
  const socials = [[SiInstagram, site.instagram, 'Instagram'], [SiFacebook, site.facebook, 'Facebook'], [SiTiktok, site.tiktok, 'TikTok'], [SiYoutube, site.youtube, 'YouTube'], [SiWhatsapp, `https://wa.me/${site.whatsapp}`, 'WhatsApp']] as const;

  return (
    <section className="pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-serif mb-6">Fale <span className="italic font-light text-primary">conosco</span></h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Agende seu horário, tire dúvidas ou venha nos visitar. Estamos prontos para receber você.</p>
        </div>
        <div className="grid lg:grid-cols-5 gap-8">
          <GlassCard className="lg:col-span-3 animate-fade-in-up">
            <h2 className="text-2xl font-serif mb-6">Envie uma mensagem</h2>
            {sent ? <p className="py-10 text-center text-muted-foreground">Mensagem enviada! Responderemos o mais rápido possível. 💛</p> : (
              <form onSubmit={submit} className="space-y-4" noValidate>
                <input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} className="hidden" aria-hidden="true" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nome completo"><Input value={f.name} onChange={set('name')} autoComplete="name" /></Field>
                  <Field label="Telefone"><Input value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" /></Field>
                </div>
                <Field label="E-mail"><Input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
                <Field label="Serviço de interesse">
                  <Select value={f.service} onChange={set('service')}>
                    <option value="">Selecione uma opção</option>
                    {services.map((s) => <option key={s.id} value={s.title}>{s.title}</option>)}
                    <option value="Apenas dúvida / Outro">Apenas dúvida / Outro</option>
                  </Select>
                </Field>
                <Field label="Sua mensagem"><Textarea rows={4} maxLength={2000} value={f.message} onChange={set('message')} /></Field>
                <Button type="submit" loading={busy} size="lg" className="w-full">Enviar Mensagem</Button>
              </form>
            )}
          </GlassCard>
          <div className="lg:col-span-2 space-y-6 animate-fade-in-up">
            <GlassCard>
              <h2 className="text-2xl font-serif mb-6">Informações de Contato</h2>
              <ul className="space-y-5">
                {info.map((i) => (
                  <li key={i.label} className="flex gap-4">
                    <span className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><i.icon size={20} /></span>
                    <div><p className="text-sm font-medium">{i.label}</p><p className="text-sm text-muted-foreground">{i.value}</p></div>
                  </li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard>
              <h2 className="text-xl font-serif mb-4">Acompanhe nas Redes Sociais</h2>
              <div className="flex gap-3">
                {socials.filter(([, h]) => h).map(([Icon, href, label]) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} onClick={() => label === 'WhatsApp' && track('whatsapp_click')} className="w-11 h-11 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary hover:scale-110 transition"><Icon size={20} /></a>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}

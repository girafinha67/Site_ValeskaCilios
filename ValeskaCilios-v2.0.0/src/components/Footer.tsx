import { Link } from 'wouter';
import { SiInstagram, SiFacebook, SiTiktok, SiYoutube, SiWhatsapp } from 'react-icons/si';
import { useSettings } from '@/lib/settings';

export function Footer() {
  const { site, services } = useSettings();
  const year = new Date().getFullYear();
  const socials = [
    { icon: SiInstagram, href: site.instagram, label: 'Instagram' },
    { icon: SiFacebook, href: site.facebook, label: 'Facebook' },
    { icon: SiTiktok, href: site.tiktok, label: 'TikTok' },
    { icon: SiYoutube, href: site.youtube, label: 'YouTube' },
    { icon: SiWhatsapp, href: `https://wa.me/${site.whatsapp}`, label: 'WhatsApp' },
  ].filter((s) => s.href);

  return (
    <footer className="relative mt-24 overflow-hidden bg-white/40 pt-16 pb-8 backdrop-blur-3xl border-t border-glass-border">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-accent opacity-50" />
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <Link href="/" className="inline-block font-serif text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{site.name}</Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">{site.description}</p>
          </div>
          <div>
            <h3 className="font-serif text-lg mb-6">Navegação</h3>
            <ul className="space-y-3">
              {[['Home', '/'], ['Sobre Mim', '/sobre'], ['Serviços', '/servicos'], ['Agendar', '/agendar'], ['Minha conta', '/minha-conta'], ['Blog', '/blog'], ['FAQ', '/faq']].map(([n, h]) => (
                <li key={n}><Link href={h} className="text-muted-foreground hover:text-primary transition-colors text-sm">{n}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg mb-6">Serviços Populares</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {services.slice(0, 5).map((s) => <li key={s.id}>{s.title}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg mb-6">Contato</h3>
            <ul className="space-y-3 text-sm text-muted-foreground mb-6">
              <li>{site.address}</li><li>{site.phone}</li><li>{site.email}</li><li>{site.hoursText}</li>
            </ul>
            <div className="flex gap-3">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary hover:scale-110 transition-all">
                  <s.icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {year} {site.name}. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/privacidade" className="hover:text-primary">Política de Privacidade</Link>
            <Link href="/termos" className="hover:text-primary">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

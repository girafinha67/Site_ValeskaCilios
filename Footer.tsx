import { Link } from 'wouter';
import { siteConfig } from '@/data/siteConfig';
import { SiInstagram, SiFacebook, SiTiktok, SiYoutube, SiWhatsapp } from 'react-icons/si';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-24 overflow-hidden bg-white/40 pt-16 pb-8 backdrop-blur-3xl border-t border-glass-border">
      {/* Decorative gradient background */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-accent opacity-50" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Col 1 */}
          <div className="space-y-4">
            <Link href="/" className="inline-block font-serif text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              {siteConfig.name}
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {siteConfig.description}
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h3 className="font-serif text-lg font-medium mb-6 text-foreground">Navegação</h3>
            <ul className="space-y-3">
              {[
                ['Home', '/'],
                ['Sobre Mim', '/sobre'],
                ['Serviços', '/servicos'],
                ['Blog', '/blog'],
                ['FAQ', '/faq']
              ].map(([name, href]) => (
                <li key={name}>
                  <Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h3 className="font-serif text-lg font-medium mb-6 text-foreground">Serviços Populares</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>Fio a Fio Clássico</li>
              <li>Volume Russo</li>
              <li>Mega Volume</li>
              <li>Lash Lift & Tint</li>
              <li>Design de Sobrancelhas</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h3 className="font-serif text-lg font-medium mb-6 text-foreground">Contato</h3>
            <ul className="space-y-3 text-sm text-muted-foreground mb-6">
              <li>{siteConfig.address}</li>
              <li>{siteConfig.phone}</li>
              <li>{siteConfig.email}</li>
            </ul>
            
            <div className="flex gap-4">
              {[
                { icon: SiInstagram, href: siteConfig.instagram, label: 'Instagram' },
                { icon: SiFacebook, href: siteConfig.facebook, label: 'Facebook' },
                { icon: SiTiktok, href: siteConfig.tiktok, label: 'TikTok' },
                { icon: SiYoutube, href: siteConfig.youtube, label: 'YouTube' },
                { icon: SiWhatsapp, href: `https://wa.me/${siteConfig.whatsapp}`, label: 'WhatsApp' }
              ].map((social) => (
                <a 
                  key={social.label}
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary hover:scale-110 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} {siteConfig.name}. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</Link>
            <Link href="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

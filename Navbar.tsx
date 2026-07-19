import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { siteConfig } from '@/data/siteConfig';
import { GlassButton } from '../shared/GlassButton';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Sobre', path: '/sobre' },
    { name: 'Serviços', path: '/servicos' },
    { name: 'Blog', path: '/blog' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contato', path: '/contato' },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 py-4",
        scrolled ? "py-3" : "py-5"
      )}
    >
      <div className={cn(
        "mx-auto max-w-6xl w-full flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300",
        scrolled ? "glass shadow-md bg-white/70" : "bg-transparent"
      )}>
        {/* Logo */}
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-foreground z-50 relative group">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:opacity-80">
            {siteConfig.name}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  href={link.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100",
                    location === link.path ? "text-primary after:scale-x-100 after:origin-bottom-left" : "text-muted-foreground"
                  )}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          <GlassButton variant="pink" href={`https://wa.me/${siteConfig.whatsapp}`} size="sm">
            Agendar
          </GlassButton>
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden z-50 relative p-2 text-foreground focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Overlay */}
        <div 
          className={cn(
            "fixed inset-0 bg-white/95 backdrop-blur-md z-40 flex flex-col justify-center items-center transition-all duration-300 ease-in-out md:hidden",
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          <ul className="flex flex-col items-center gap-8 text-xl">
            {navLinks.map((link) => (
              <li key={link.path} className="overflow-hidden">
                <div 
                  className={cn(
                    "transition-transform duration-500",
                    mobileMenuOpen ? "translate-y-0" : "translate-y-full"
                  )}
                  style={{ transitionDelay: `${navLinks.indexOf(link) * 100}ms` }}
                >
                  <Link 
                    href={link.path}
                    className={cn(
                      "font-serif font-medium",
                      location === link.path ? "text-primary" : "text-foreground"
                    )}
                  >
                    {link.name}
                  </Link>
                </div>
              </li>
            ))}
            <li className="mt-4">
              <div 
                className={cn(
                  "transition-transform duration-500",
                  mobileMenuOpen ? "translate-y-0" : "translate-y-full"
                )}
                style={{ transitionDelay: `${navLinks.length * 100}ms` }}
              >
                <GlassButton variant="pink" href={`https://wa.me/${siteConfig.whatsapp}`}>
                  Agendar Horário
                </GlassButton>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}

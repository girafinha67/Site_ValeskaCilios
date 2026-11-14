import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, User } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { useAuth } from '@/lib/auth';
import { GlassButton } from './GlassButton';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Sobre', path: '/sobre' },
  { name: 'Serviços', path: '/servicos' },
  { name: 'Blog', path: '/blog' },
  { name: 'FAQ', path: '/faq' },
  { name: 'Contato', path: '/contato' },
];

export function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { site } = useSettings();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  useEffect(() => setOpen(false), [location]);

  const account = user ? { name: 'Minha conta', path: '/minha-conta' } : { name: 'Entrar', path: '/entrar' };

  return (
    <header className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6', scrolled ? 'py-3' : 'py-5')}>
      <div className={cn('mx-auto max-w-6xl w-full flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300', scrolled ? 'glass shadow-md bg-white/70' : 'bg-transparent')}>
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight z-50 relative group">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent group-hover:opacity-80 transition">{site.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7" aria-label="Principal">
          <ul className="flex items-center gap-6">
            {navLinks.map((l) => (
              <li key={l.path}>
                <Link href={l.path} className={cn('text-sm font-medium transition-colors hover:text-primary', location === l.path ? 'text-primary' : 'text-muted-foreground')}>{l.name}</Link>
              </li>
            ))}
          </ul>
          <Link href={account.path} className={cn('flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors', location === account.path ? 'text-primary' : 'text-muted-foreground')}>
            <User size={16} /> {account.name}
          </Link>
          {isAdmin && <a href="/admin" className="text-xs rounded-full border border-primary/40 px-3 py-1 text-primary hover:bg-primary/10">Painel</a>}
          <GlassButton href="/agendar" size="sm" trackName="cta_agendar_nav">Agendar</GlassButton>
        </nav>

        <button className="md:hidden z-50 relative p-2" onClick={() => setOpen(!open)} aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={cn('fixed inset-0 bg-white/95 backdrop-blur-md z-40 flex flex-col justify-center items-center transition-all duration-300 md:hidden', open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}>
          <ul className="flex flex-col items-center gap-7 text-xl">
            {[...navLinks, account].map((l) => (
              <li key={l.path}><Link href={l.path} className={cn('font-serif font-medium', location === l.path ? 'text-primary' : 'text-foreground')}>{l.name}</Link></li>
            ))}
            {isAdmin && <li><a href="/admin" className="font-serif text-primary">Painel admin</a></li>}
            <li className="mt-2"><GlassButton href="/agendar">Agendar Horário</GlassButton></li>
          </ul>
        </div>
      </div>
    </header>
  );
}

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { pageview } from '@/lib/analytics';

export function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const t = setTimeout(() => pageview(location), 50); // espera o título da página atualizar
    return () => clearTimeout(t);
  }, [location]);
  return null;
}

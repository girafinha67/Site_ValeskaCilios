import { useEffect } from 'react';
import { SITE_URL } from '@/data/siteConfig';

interface SEO { title?: string; description?: string; ogImage?: string; ogType?: string; noindex?: boolean }

function setMeta(sel: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(sel);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSEO({ title, description, ogImage, ogType = 'website', noindex }: SEO) {
  useEffect(() => {
    const full = title ? `${title} | Valeska Rocha` : 'Valeska Rocha – Design e Alongamento de Cílios';
    document.title = full;
    const desc = description || 'Design e alongamento de cílios com técnica, cuidado e acabamento impecável. Agende online.';
    setMeta('meta[name="description"]', 'name', 'description', desc);
    setMeta('meta[property="og:title"]', 'property', 'og:title', full);
    setMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    setMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMeta('meta[property="og:image"]', 'property', 'og:image', ogImage || `${SITE_URL}/og-image.svg`);
    setMeta('meta[property="og:url"]', 'property', 'og:url', SITE_URL + location.pathname);
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = SITE_URL + location.pathname;
  }, [title, description, ogImage, ogType, noindex]);
}

import { useSEO } from '@/hooks/useSEO';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
}

export function SEOHead(props: SEOHeadProps) {
  useSEO(props);
  return null;
}

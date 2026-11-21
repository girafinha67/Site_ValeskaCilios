import { useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui';
import { detectBrowser, openInBrowser } from '@/lib/browser';

/** "Voltar ao site": leva a pessoa de volta ao navegador que ela usa (Chrome, Safari, Samsung Internet...). */
export function BackToSiteButton({ path = '/', className }: { path?: string; className?: string }) {
  const [hint, setHint] = useState('');

  function go() {
    const url = `${location.origin}${path}`;
    const env = detectBrowser();
    const r = openInBrowser(url);
    if (r === 'stay' || (env.ios && !env.iosRealBrowser)) {
      window.setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setHint('Se o site não abriu no seu navegador, toque no ícone da bússola (ou em ⋯) no canto da tela e escolha “Abrir no Safari/navegador”.');
        }
      }, 1200);
    }
  }

  return (
    <div className={className}>
      <Button variant="outline" size="lg" className="w-full" onClick={go}><Globe size={18} /> Voltar ao site</Button>
      {hint && <p className="mt-3 text-xs text-muted-foreground text-center">{hint}</p>}
    </div>
  );
}

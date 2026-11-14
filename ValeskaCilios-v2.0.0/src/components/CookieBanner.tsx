import { useState } from 'react';
import { Link } from 'wouter';
import { getConsent, setConsent } from '@/lib/analytics';
import { Button } from './ui';

export function CookieBanner() {
  const [shown, setShown] = useState(() => getConsent() === null);
  if (!shown) return null;
  const choose = (v: 'granted' | 'denied') => {
    setConsent(v);
    setShown(false);
  };
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-md z-[90] glass rounded-2xl p-5 shadow-2xl bg-white/90" role="dialog" aria-label="Aviso de cookies">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Usamos cookies de estatística (Google Analytics) para melhorar o site. Você decide. Saiba mais na{' '}
        <Link href="/privacidade" className="text-primary underline">Política de Privacidade</Link>.
      </p>
      <div className="mt-4 flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => choose('denied')}>Recusar</Button>
        <Button size="sm" onClick={() => choose('granted')}>Aceitar</Button>
      </div>
    </div>
  );
}

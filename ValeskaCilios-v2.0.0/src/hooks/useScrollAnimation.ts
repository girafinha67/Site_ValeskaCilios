import { useEffect } from 'react';

/** Revela elementos .scroll-animate ao rolar a página. `deps` re-observa quando o conteúdo muda. */
export function useScrollAnimation(deps: unknown[] = []) {
  useEffect(() => {
    const els = document.querySelectorAll('.scroll-animate:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-visible'), io.unobserve(e.target))),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

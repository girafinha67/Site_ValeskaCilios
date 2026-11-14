import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

interface Props { children: ReactNode; href?: string; onClick?: () => void; className?: string; size?: 'sm' | 'md' | 'lg'; type?: 'button' | 'submit'; disabled?: boolean; trackName?: string }

export function GlassButton({ children, href, onClick, className, size = 'md', type = 'button', disabled, trackName }: Props) {
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg font-medium' };
  const cls = cn('btn-glass-gold inline-flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', sizes[size], className);
  const click = () => {
    if (trackName) track(trackName, { link: href });
    onClick?.();
  };
  if (href && /^(https?:|mailto:|tel:)/.test(href)) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={click}>{children}</a>;
  if (href) return <Link href={href} className={cls} onClick={click}>{children}</Link>;
  return <button type={type} className={cls} onClick={click} disabled={disabled}>{children}</button>;
}

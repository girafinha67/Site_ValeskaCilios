import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GlassCard({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div style={style} className={cn('glass rounded-3xl p-6 md:p-8 transition-transform duration-300', className)}>{children}</div>;
}

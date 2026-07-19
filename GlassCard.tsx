import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className, onClick }: GlassCardProps) {
  return (
    <div 
      className={cn("glass rounded-[24px] p-6 sm:p-8 transition-transform duration-300 hover:scale-[1.02]", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

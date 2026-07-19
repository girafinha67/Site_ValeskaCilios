import { ReactNode } from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface GlassButtonProps {
  variant: 'blue' | 'pink' | 'orange';
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GlassButton({ 
  variant, 
  children, 
  onClick, 
  href, 
  className,
  size = 'md' 
}: GlassButtonProps) {
  const baseClass = `btn-glass-${variant}`;
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg font-medium"
  };

  const combinedClass = cn(
    "inline-flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", 
    baseClass, 
    sizeClasses[size], 
    className
  );

  if (href) {
    // If it's an external link
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={combinedClass} onClick={onClick}>
          {children}
        </a>
      );
    }
    
    // Internal wouter link
    return (
      <Link href={href} className={combinedClass} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClass} onClick={onClick}>
      {children}
    </button>
  );
}

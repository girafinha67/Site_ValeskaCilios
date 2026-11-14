import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type BtnVariant = 'gold' | 'outline' | 'ghost' | 'danger' | 'success';
export function Button({ variant = 'gold', size = 'md', loading, className, children, disabled, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean }) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3.5 text-base' };
  const variants: Record<BtnVariant, string> = {
    gold: 'btn-glass-gold',
    outline: 'rounded-full border border-primary/50 text-foreground hover:bg-primary/10 transition',
    ghost: 'rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition',
    danger: 'rounded-full bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition',
    success: 'rounded-full bg-emerald-600/10 text-emerald-700 border border-emerald-600/30 hover:bg-emerald-600/20 transition',
  };
  return (
    <button {...rest} disabled={disabled || loading} className={cn('inline-flex items-center justify-center gap-2 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed', sizes[size], variants[variant], className)}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

const fieldCls = 'w-full rounded-xl border border-input bg-white/70 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => <input ref={ref} {...p} className={cn(fieldCls, className)} />);
Input.displayName = 'Input';
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => <textarea ref={ref} {...p} className={cn(fieldCls, 'resize-y', className)} />);
Textarea.displayName = 'Textarea';
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => <select ref={ref} {...p} className={cn(fieldCls, 'pr-8', className)} />);
Select.displayName = 'Select';

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('glass rounded-2xl p-5', className)}>{children}</div>;
}

const badgeColors: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800 border-amber-300',
  confirmado: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  concluido: 'bg-sky-100 text-sky-800 border-sky-300',
  cancelado: 'bg-red-100 text-red-800 border-red-300',
  faltou: 'bg-zinc-200 text-zinc-700 border-zinc-300',
  neutral: 'bg-muted text-muted-foreground border-border',
  gold: 'bg-primary/15 text-primary border-primary/30',
};
export const Badge = ({ tone = 'neutral', children }: { tone?: string; children: ReactNode }) => (
  <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', badgeColors[tone] ?? badgeColors.neutral)}>{children}</span>
);

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={title}>
      <div className={cn('bg-card w-full max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
        <div className="sticky top-0 z-10 flex items-center justify-between bg-card/95 backdrop-blur px-6 py-4 border-b border-border">
          <h3 className="text-lg font-serif">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted" aria-label="Fechar"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export const Spinner = ({ className }: { className?: string }) => (
  <div className={cn('flex justify-center py-10', className)}><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
);

export const Empty = ({ children }: { children: ReactNode }) => <div className="py-10 text-center text-sm text-muted-foreground">{children}</div>;

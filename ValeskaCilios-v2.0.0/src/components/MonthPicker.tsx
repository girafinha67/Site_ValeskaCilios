import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, dateKey, weekdayOf } from '@/lib/time';
import { cn } from '@/lib/utils';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface Props { value: string | null; onChange: (key: string) => void; isDisabled: (key: string) => boolean; minKey: string; maxKey: string }

export function MonthPicker({ value, onChange, isDisabled, minKey, maxKey }: Props) {
  const [cursor, setCursor] = useState(() => (value || minKey).slice(0, 7)); // YYYY-MM
  const [y, m] = cursor.split('-').map(Number);

  const cells = useMemo(() => {
    const first = `${cursor}-01`;
    const lead = weekdayOf(first);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const out: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(`${cursor}-${String(d).padStart(2, '0')}`);
    return out;
  }, [cursor, y, m]);

  const go = (delta: number) => {
    const next = new Date(Date.UTC(y, m - 1 + delta, 1));
    setCursor(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
  };
  const canPrev = `${cursor}-01` > minKey.slice(0, 7) + '-01';
  const canNext = addDays(`${cursor}-01`, 32).slice(0, 7) <= maxKey.slice(0, 7);
  const today = dateKey();

  return (
    <div className="glass rounded-2xl p-4 select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => go(-1)} disabled={!canPrev} className="p-2 rounded-full hover:bg-muted disabled:opacity-30" aria-label="Mês anterior"><ChevronLeft size={18} /></button>
        <p className="font-serif text-lg">{MONTHS[m - 1]} {y}</p>
        <button type="button" onClick={() => go(1)} disabled={!canNext} className="p-2 rounded-full hover:bg-muted disabled:opacity-30" aria-label="Próximo mês"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">{WEEK.map((w, i) => <span key={i}>{w}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((k, i) => {
          if (!k) return <span key={`e${i}`} />;
          const off = k < minKey || k > maxKey || isDisabled(k);
          const sel = k === value;
          return (
            <button key={k} type="button" disabled={off} onClick={() => onChange(k)} aria-pressed={sel}
              className={cn('aspect-square rounded-xl text-sm transition', off ? 'text-muted-foreground/40 cursor-not-allowed' : 'hover:bg-primary/15', sel && 'btn-glass-gold !rounded-xl', k === today && !sel && 'ring-1 ring-primary/50')}>
              {Number(k.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { Star } from 'lucide-react';
export const Stars = ({ n = 5, size = 16 }: { n?: number; size?: number }) => (
  <div className="flex gap-0.5 text-accent" aria-label={`${n} de 5 estrelas`}>
    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={size} className={i < n ? 'fill-current' : 'opacity-25'} />)}
  </div>
);

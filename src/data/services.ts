import type { Service } from '@/lib/types';

// Usado apenas como reserva caso o banco de dados ainda não esteja configurado/acessível.
const mk = (id: number, title: string, description: string, duration_min: number, price_cents: number, tag: string | null): Service => ({
  id, title, description, duration_min, price_cents, price_prefix: 'A partir de', tag, icon: '✦', active: true, sort: id,
});

export const fallbackServices: Service[] = [
  mk(1, 'Fio a Fio Clássico', 'Técnica tradicional que aplica um fio de extensão em cada cílio natural, criando um resultado elegante e natural.', 120, 18000, 'Popular'),
  mk(2, 'Volume Russo', 'Leques de 2 a 6 fios por cílio natural para um volume dramático e deslumbrante.', 150, 24000, 'Destaque'),
  mk(3, 'Mega Volume', 'Máximo volume e impacto com leques ultrafinos para um look poderoso e sofisticado.', 180, 29000, null),
  mk(4, 'Design de Sobrancelhas', 'Modelagem personalizada para harmonizar com seu formato de rosto e realçar seu olhar.', 45, 8000, null),
  mk(5, 'Lash Lift & Tint', 'Curvatura permanente e coloração dos cílios naturais para um olhar mais aberto sem extensões.', 90, 15000, 'Novo'),
  mk(6, 'Manutenção', 'Reposição dos cílios que caíram naturalmente, mantendo o volume e a perfeição do seu look.', 60, 12000, null),
];

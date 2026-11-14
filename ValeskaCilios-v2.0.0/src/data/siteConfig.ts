// Valores PADRÃO. Tudo aqui pode ser editado depois em  Painel Admin > Configurações  (sem republicar o site).
export const siteConfig = {
  name: 'Valeska Rocha',
  tagline: 'Especialista em Design e Alongamento de Cílios',
  description:
    'Transforme seu olhar com Valeska Rocha, especialista em design e alongamento de cílios. Técnicas exclusivas para realçar sua beleza natural.',
  phone: '+55 (98) 98184-8193',
  email: 'maravaleska22@gmail.com',
  whatsapp: '5598981848193',
  address: 'Rua das Flores, 456 – Jardins, São Paulo – SP',
  hoursText: 'Terça a Sábado, das 09h às 19h',
  instagram: 'https://www.instagram.com/valleskacilios?igsh=aWh4ajBlbGhqM2c2',
  facebook: 'https://facebook.com/maravaleska',
  tiktok: 'https://tiktok.com/@maravaleska',
  youtube: 'https://youtube.com/@maravaleska',
};

export type SiteConfig = typeof siteConfig;
export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || 'https://www.maravaleska.com.br';

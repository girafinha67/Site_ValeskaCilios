# Valeska Cílios – v2.0.0

Site + agendamento online + área do cliente + painel admin (página separada em `/admin`) + Google Agenda, Analytics (GA4) e Search Console.

Stack: Vite + React + TypeScript + Tailwind · Supabase (login e banco) · Vercel (hospedagem + Functions).

## Colocar no ar (≈ 20 min)

### 1) Supabase (grátis)
1. Crie um projeto em supabase.com.
2. **SQL Editor** → cole o arquivo `supabase/schema.sql` inteiro → **Run**.
3. **Authentication > Providers > Email**: deixe **Confirm email LIGADO** (segurança do admin).
4. **Authentication > URL Configuration**: Site URL = endereço do seu site; adicione `https://SEUSITE/**` em Redirect URLs.
5. **Project Settings > API**: copie *Project URL*, *anon key* e *service_role key*.

### 2) Vercel
1. Suba esta pasta para o GitHub e importe em vercel.com/new (preset Vite; o `vercel.json` já configura tudo, incluindo `/admin` e as funções em `/api`).
2. **Settings > Environment Variables**: cadastre as do `.env.example`.
   Públicas (VITE): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`.
   Secreta (SEM prefixo VITE, nunca no navegador): `SUPABASE_SERVICE_ROLE_KEY`.
3. Faça Redeploy.

### 3) Primeiro acesso admin
Acesse `/entrar`, crie conta com o e-mail **maravaleska22@gmail.com** (já pré-autorizado no SQL), confirme o e-mail e entre em **`/admin`**.
Outro e-mail: rode no SQL `update public.profiles set role='admin' where email='x@x.com';` ou use Admin > Configurações.

### 4) Google Agenda + Analytics + Search Console (uma conta de serviço só)
1. console.cloud.google.com → novo projeto → ative as APIs: **Google Calendar API**, **Google Analytics Data API**, **Google Search Console API**.
2. **IAM > Contas de serviço** → criar → **Chaves > Adicionar chave > JSON**. Cole o JSON inteiro (ou em base64) em `GOOGLE_SERVICE_ACCOUNT_JSON`.
3. **Google Agenda**: Configurações da agenda > *Compartilhar com pessoas* → adicione o e-mail da conta de serviço com **"Fazer alterações em eventos"**. Copie o *ID da agenda* para `GOOGLE_CALENDAR_ID`.
4. **Analytics 4**: crie a propriedade, copie o ID de medição (`G-...`) em Admin > Configurações (ou `VITE_GA_ID`). Em Admin da propriedade > *Gerenciamento de acesso* adicione a conta de serviço como **Leitor**; coloque o número da propriedade em `GA4_PROPERTY_ID`.
5. **Search Console**: adicione o site, verifique pelo método *Tag HTML* e coloque só o código em `VITE_GSC_VERIFICATION`. Em Configurações > Usuários adicione a conta de serviço (Restrito). Preencha `GSC_SITE_URL` (ex.: `https://www.maravaleska.com.br/`). Depois envie `/sitemap.xml` (gerado automaticamente).
6. Painel `/admin/google` mostra o status de cada integração e botão "Sincronizar agora".

### 5) Login com Google (opcional)
Ative o provedor Google no Supabase e coloque `VITE_ENABLE_GOOGLE_LOGIN=true`.

## O que tem
**Site:** Home, Sobre, Serviços (do banco), Blog, FAQ, Contato (salva no painel), Privacidade/Termos (LGPD), aviso de cookies, SEO (sitemap, robots, JSON-LD).
**Cliente:** cadastro/login/recuperar senha, agendar (calendário + horários livres em tempo real, sem duplicidade), minha conta (próximos/histórico, cancelar, adicionar ao Google Agenda/.ics, editar dados, depoimento).
**Admin (`/admin`):** visão geral com gráficos, agenda (confirmar, concluir com valor, faltou, remarcar, cancelar, agendamento manual, bloqueio de horário, WhatsApp pronto), clientes (histórico, notas, aniversariantes, quem sumiu, CSV), serviços, horários/pausas/feriados/regras, mensagens, depoimentos, relatórios (receita, ticket, faltas, CSV), Google (Agenda/GA4/Search), configurações do estúdio, administradores.

## Desenvolvimento local
`npm install` → copie `.env.example` para `.env` → `npm run dev` (usa Vercel CLI: `npm i -g vercel`) ou `npm run dev:web` só para o visual.

## Atenção
- Endereço padrão ("Rua das Flores, 456 – São Paulo") parece placeholder: edite em Admin > Configurações.
- Nome aparece como "Valeska Rocha" (site antigo misturava "Mara Valeska").
- Fuso fixo de Brasília (UTC-3).

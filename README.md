# Valeska Cílios – v5.3.1

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

### 3) Login do painel admin (e-mail e senha pela Vercel)
Na Vercel cadastre:
- `ADMIN_EMAIL` = seu e-mail (ex.: maravaleska22@gmail.com)
- `ADMIN_PASSWORD` = senha de **8 caracteres**
Redeploy e entre em **`/admin`** com esse e-mail e senha. Para trocar a senha, altere a variável e faça Redeploy: o painel passa a aceitar a nova na hora. Quem não é o admin não entra, mesmo tendo conta de cliente.

### 4) Google Agenda real (agendamentos do site aparecem sozinhos na sua agenda)
1. Acesse console.cloud.google.com, crie um projeto e ative **Google Calendar API** (e, se quiser, *Google Analytics Data API* e *Google Search Console API*).
2. **IAM e administrador > Contas de serviço > Criar conta de serviço** (nome: `site-agenda`). Depois abra a conta > **Chaves > Adicionar chave > Criar nova chave > JSON** (baixa um arquivo).
3. Transforme o JSON em uma linha só (base64) e cole em `GOOGLE_SERVICE_ACCOUNT_JSON` na Vercel:
   - Mac/Linux: `base64 -w0 arquivo.json`
   - Windows (PowerShell): `[Convert]::ToBase64String([IO.File]::ReadAllBytes("arquivo.json"))`
4. No **Google Agenda** (agenda.google.com, no computador): passe o mouse na sua agenda > ⋮ > **Configurações e compartilhamento** > **Compartilhar com pessoas específicas** > adicione o **e-mail da conta de serviço** (`...@...iam.gserviceaccount.com`, aparece no JSON e em `/admin/google`) com permissão **"Fazer alterações em eventos"**.
5. Na mesma tela, em **Integrar agenda**, copie o **ID da agenda** (para a agenda principal é o seu próprio Gmail) e cole em `GOOGLE_CALENDAR_ID`.
6. Redeploy. Em `/admin/google` o cartão "Google Agenda" deve ficar verde; clique em **Sincronizar agora** para enviar os agendamentos já existentes.
Depois disso: cada agendamento feito no site (ou criado/remarcado/cancelado no painel) aparece, muda ou some do seu Google Agenda automaticamente, e horários em que você já tem compromisso no Google ficam indisponíveis no site.
(Analytics e Search Console: mesma conta de serviço; veja `.env.example` e adicione o e-mail dela como Leitor/Usuário em cada serviço.)

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

## Supabase já criado
Projeto `valeska-cilios` (ref `lgyiqhvlutazociwmbhy`, região São Paulo) com o schema aplicado. As chaves públicas VITE já estão no `.env` e `.env.example`.
Na Vercel cadastre `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL` e a secreta `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API > service_role).

## Como os horários funcionam
Cada serviço ocupa o tempo da sua duração (Admin > Serviços). O site oferece o primeiro horário na abertura e segue de duração em duração; ao lado de qualquer atendimento já marcado, libera o horário logo depois. Ex.: cílios de 1h marcado às 9h -> o próximo cliente só pode às 10h. Serviço de 2h bloqueia 2h. Pausas (almoço), dias bloqueados e compromissos do Google Agenda também são respeitados. Em Admin > Horários e regras dá para trocar para grade fixa e definir folga entre clientes.

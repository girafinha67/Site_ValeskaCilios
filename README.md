# Valeska Cílios – v5.4.0

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

### 5) Login com Google
O botão "Continuar com Google" aparece por padrão (para esconder, `VITE_ENABLE_GOOGLE_LOGIN=false`). Ative em Supabase > Authentication > Providers > **Google** com um *OAuth Client ID* (console.cloud.google.com > APIs e serviços > Credenciais > ID do cliente OAuth, tipo Web; URI de redirecionamento = a "Callback URL" que o Supabase mostra). É só login (e-mail e nome); nenhuma API do Google precisa ser ativada.

### 6) Convite automático no Google Agenda da cliente (sem API do Google)
Quando você **confirma** um horário no painel (ou quando a confirmação é automática), **remarca** ou **cancela**, a cliente recebe um e-mail bonito com um convite de calendário (.ics). No Gmail/Google Agenda o evento entra sozinho; no iPhone e Outlook também. Não usa Google Cloud nem API.
1. Rode no Supabase (SQL Editor) o arquivo `supabase/migrations/2026-11-21_convite_agenda.sql`.
2. Na Vercel cadastre o e-mail de envio (SMTP): `SMTP_HOST`, `SMTP_PORT` (465), `SMTP_USER`, `SMTP_PASS` e `MAIL_FROM` (ex.: `"Valeska Rocha" <maravaleska22@gmail.com>`). Com Gmail: ative a verificação em duas etapas, crie uma **Senha de app** em myaccount.google.com/apppasswords e use `smtp.gmail.com` + essa senha. (Brevo, Resend e outros SMTP também servem.)
3. Redeploy e, em `/admin/google`, clique em **Enviar convite de teste para mim**.
Observação: o Google só adiciona sozinho se a cliente estiver com **Configurações do Google Agenda > Configurações de eventos > Adicionar convites automaticamente** em "Sim" (padrão). Caso contrário, aparece o cartão "Sim/Não" no e-mail. O convite vai para o e-mail da conta da cliente, por isso o login com Google ou e-mail é obrigatório para agendar.

### 7) E-mails bonitos do Supabase (confirmação, senha, link de acesso)
Supabase > **Authentication > Emails** (Templates): para cada modelo, cole o conteúdo do arquivo correspondente de `supabase/email-templates/` e o assunto de `assuntos.txt`. Para o remetente aparecer como "Valeska Rocha" (e não "Supabase"), configure também **Authentication > SMTP Settings** com o mesmo SMTP do passo 6.
Em **Authentication > URL Configuration** deixe **Site URL** = endereço do site e em **Redirect URLs** adicione: `https://SEUSITE/**`, `http://localhost:3000/**` e `http://localhost:5173/**`. Assim o link do e-mail abre a página `/confirmado` (com o mesmo visual do site e o botão **Voltar ao site**) tanto no site quanto no localhost.

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
Projeto `valeska-cilios` (ref `lgyiqhvlutazociwmbhy`, região São Paulo) com o schema aplicado. As chaves públicas VITE estão no seu `.env` local (o `.env.example` traz só os nomes).
Na Vercel cadastre `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL` e a secreta `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API > service_role).

## Como os horários funcionam
Cada serviço ocupa o tempo da sua duração (Admin > Serviços). O site oferece o primeiro horário na abertura e segue de duração em duração; ao lado de qualquer atendimento já marcado, libera o horário logo depois. Ex.: cílios de 1h marcado às 9h -> o próximo cliente só pode às 10h. Serviço de 2h bloqueia 2h. Pausas (almoço), dias bloqueados e compromissos do Google Agenda também são respeitados. Em Admin > Horários e regras dá para trocar para grade fixa e definir folga entre clientes.

## Agenda sem Google Cloud (assinatura .ics)
Não precisa de API, conta de serviço nem JSON. Em `/admin/google` copie o link da assinatura e adicione no Google Agenda (**Outras agendas > Por URL**) ou no iPhone (**Adicionar calendário assinado**). Os agendamentos do site aparecem sozinhos (somente leitura). Observação: o Google demora algumas horas para atualizar agendas assinadas; iPhone/Outlook são rápidos. O link é secreto (derivado da `SUPABASE_SERVICE_ROLE_KEY`; para fixar um valor use `CALENDAR_FEED_TOKEN`).

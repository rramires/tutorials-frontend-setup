# HANDOFF — Frontend Setup Tutorial

Break-glass state for cold resume (any model/tool). Harness memory mirrors this as a cache.

## Resume prompt (copy-paste into a fresh session)

> Retomando o tutorial frontend (repo `01_setup`, branch `master`). **Partes 1–9 completas,
> commitadas e pushadas** — tutorial multi-parte no mesmo repo: **README.md** (Tailwind) →
> **README_2_shadcn.md** → **README_3_msw.md** (mock-first MSW) → **README_4_vitest.md** →
> **README_5_playwright.md** (e2e) → **README_6_backend.md** (auth real: JWT em memória + refresh
> cookie httpOnly + silent refresh + AuthContext + ProtectedRoute) → **README_7_email_password.md**
> (verificação de email + reset de senha) → **README_8_gyms.md** (academias + **sidebar** +
> **guard por role** `RoleRoute`/`Forbidden`) → **README_9_check_ins.md** (check-ins: bater ponto
> no `GymCard` via hook `use-check-in`; página `/check-ins` com histórico + badge validated/pending
> + **Validate só ADMIN** = ação gateada por papel; **Home virou dashboard** com card total + bar
> chart recharts; **⭐ demo do gate de email** no smoke). Eu executo **manualmente**, passo a passo,
> e te mando os resultados pra conferir contra os arquivos reais.
>
> **Próxima e ÚLTIMA missão: escrever a Parte 10 — edição + permissões (RBAC completo).**
> **Self-service de conta:** `PATCH /auth/me {username}` · **troca de email** `POST /auth/me/email
> {email}`→204 (429 cooldown) + `POST /auth/me/email/confirm {code}`→204 + `GET
> /users/confirm-email-change?token`→204 (duas portas, igual P7 — reusa `input-otp` + landing).
> **Área admin** (atrás do `RoleRoute allow={['ADMIN']}` da P8): `GET /users` ?page →`{users:
> PublicUser[]}` (20/pág) · `PATCH /users/:id` `{username?,email?,role?,is_verified?}` (≥1 campo;
> trocar email→is_verified=false; rebaixar o próprio role p/ MEMBER→400; email+is_verified:true
> juntos→400) · `PATCH /gyms/:id`. `PublicUser={id,username,email,role,is_verified,created_at,
> password_changed_at}` (nunca `password_hash`). Front: **`pages/account/*`** (self) +
> **`pages/admin/*`** (governar) — **NÃO** aninhar admin sob account; ambos no sidebar por papel.
> Mesmo pipeline mock-first → MSW → unit → e2e → real, **com dry-run completo + smoke real**.
> **Planejar o layout COMIGO antes de escrever** (uma pergunta por vez, PT, sem caixinhas).
>
> **Backend = `~/_Dev/samples/solid_api_sample`** (Fastify+Prisma+MySQL, :3333). **Dar `git pull`
> no `master`** — já inclui os fixes que o smoke da P9 forçou: (1) erros de domínio do check-in em
> **4xx** (não 500); (2) **CORS `methods` explícito** `['GET','HEAD','POST','PUT','PATCH','DELETE']`
> (o default do `@fastify/cors` v11 é só `GET,HEAD,POST` → bloqueava PATCH; a P10 é toda
> PATCH/PUT, depende disso). `APP_URL=http://localhost:3001`. Admin de teste = **seed** (`pnpm
> seeddb`, idempotente; credenciais = `ADMIN_USERNAME`/`ADMIN_PASSWORD` do `.env` do backend; role
> ADMIN + is_verified). `pnpm showdb` = Studio :5555. username regex `/^[a-zA-Z0-9_]+$/`.
>
> Convenções (siga à risca): **terso** (caveman, full); UI no código = **inglês**, prosa = **PT**;
> shadcn-first; "Crie a pasta X" leva ` ```sh mkdir `; criar arquivo = **"Vá na pasta X e crie
> `nome`"** (bareword); **Presentation Model** (lógica→`use-x-pm.ts`, formatação/transformação
> também é PM — view só renderiza; `.tsx` que divide pasta vira subpasta view+PM); forms shadcn
> **Card** + `noValidate`; validação **espelha o backend**; toast de erro = `data.message` em 4xx,
> genérico em 5xx; dados de smoke 1-por-linha em backticks. **Nunca pushe** (o usuário pusha,
> incl. `--force-with-lease`); commits **por seção** com **`git add src`** (+ `package.json
> pnpm-lock.yaml` se instalar dep; `test` se a seção tem spec e2e), só quando eu pedir; README de
> cada parte num commit `docs:` próprio no fim. `pnpm lint` + `pnpm test:run` verdes antes de
> commit; conferir contra o arquivo real.

## Current state

- **Branch:** `master` — **sincronizado com `origin/master`** (ahead 0 / behind 0).
- **HEAD:** `ef302ba` (2026-06-21) docs: add part 9 tutorial. Stack P9 (6 commits): feat check-ins
  api+mocks → feat check-in from gym card → feat check-ins history page → feat home dashboard →
  test cover check-ins+dashboard → docs.
- **Working tree:** limpo. `pnpm test:run` = **17/17** · `pnpm e2e` = **15/15** · lint/build verdes.
- **Ambiente:** WSL, pnpm 11.5.2. Portas: dev=**3001**, dev:test=**5001**, backend=**3333**,
  prisma-studio=5555, preview=4173. `pnpm killapp` = faxina de portas.

## Next / backlog

- **Parte 10 (a escrever — ÚLTIMA):** edição + permissões (self-service conta + troca de email +
  área admin atrás do `RoleRoute`). Próximo passo = **planejar o layout com o usuário** (account vs
  admin, navegação, telas de troca de email reusando P7), depois dry-run completo, depois escrever.
- Dívida conhecida: `coverage/` ficou dentro do commit `039ba28` (P4). Decisão: deixar assim.

## Working rules (guardrails)

Não há `CLAUDE.md` no repo — doutrina vive na memória do harness + neste HANDOFF. Invioláveis:
**nunca pushar** (o usuário pusha) · **não commitar sem aprovação** · `pnpm lint`/`pnpm test:run`
verdes antes de commit · conferir contra o arquivo real antes de cravar · `git add src` por seção
(README só no `docs:` final; + lockfile se instalar dep) · tutorial novo = **dry-run completo** +
**smoke real** (pega o que o dry-run não pega: P8 `Decimal`-string, P9 CORS-sem-PATCH) ·
**planejar o layout com o usuário antes de escrever**.

## Deeper memory (Claude Code — mesma máquina)

`~/.claude/projects/-home-user--Dev-tutorials-front-01-setup/memory/` (`MEMORY.md` = índice).
Notáveis: `project_next_mission` (missão P10 ativa, inventário de rotas P10, aprendizados P7/P8/P9
incl. CORS), `project_readme_status`, `project_frontend_first_methodology`, `reference_backend_sample`,
`feedback_presentation_model` (regra da pasta-PM + formatação na PM), `feedback_mkdir_folders`,
`feedback_file_create_phrasing`, `feedback_ui_text_english`, `feedback_react19_types`,
`feedback_tailwind_v4`, `feedback_scope`.

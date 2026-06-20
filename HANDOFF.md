# HANDOFF — Frontend Setup Tutorial

Break-glass state for cold resume (any model/tool). Harness memory mirrors this as a cache.

## Resume prompt (copy-paste into a fresh session)

> Retomando o tutorial frontend (repo `01_setup`, branch `master`). **Partes 1–8 completas,
> commitadas e pushadas** — tutorial multi-parte no mesmo repo: **README.md** (Tailwind) →
> **README_2_shadcn.md** (shadcn/ui) → **README_3_msw.md** (mock-first MSW) → **README_4_vitest.md**
> (unit) → **README_5_playwright.md** (e2e) → **README_6_backend.md** (backend real: auth JWT em
> memória + refresh cookie httpOnly + silent refresh + AuthContext + ProtectedRoute) →
> **README_7_email_password.md** (verificação de email + reset de senha, duas portas cada) →
> **README_8_gyms.md** (academias + **nasceu o sidebar** shadcn + **guard por role** `RoleRoute`/
> `Forbidden`; página `/gyms` search+nearby geoloc; `/gyms/new` ADMIN; mock ganhou admin). Eu
> executo **manualmente**, passo a passo, e te mando os resultados pra conferir contra os arquivos
> reais.
>
> **Próxima missão: escrever a Parte 9 — check-ins.** Rotas: `POST /gyms/:gymId/check-ins
> {latitude,longitude}` →201 (gateado por email-verificado se a flag estiver ligada) · `GET
> /check-ins/history ?page` →`{checkIns}` · `GET /check-ins/metrics` →`{checkInsCount}` · `PATCH
> /check-ins/:checkInId/validate` = **ADMIN** →200. CheckIn=`{id,created_at,validated_at|null,
> user_id,gym_id}`. **Estrela da parte = demo do gate de email:** flag `REQUIRE_EMAIL_VERIFICATION=
> false` → check-in sem verificar passa → flipa `true` + reinicia backend → `403` → verifica email
> (fluxo da P7) → passa. **+ a Home (hoje vazia, só "Home Page!") vira um dashboard pessoal LEVE**
> (decisão do usuário, 2026-06-20): só com o backend atual, **SEM all-time chart e SEM mexer no
> backend** — card "Total check-ins" (`metrics`) + mini-gráfico "Recent activity" agrupando os
> `created_at` da **página 1** do history por dia + saudação/estado (verified/role do `/auth/me`).
> NÃO dá sem backend: série all-time (precisaria endpoint agregado) e nome de academia na lista
> (history só traz `gym_id`; não há `GET /gyms/:id` público). Gráfico: shadcn `chart` (recharts) OU
> barras CSS — **decidir no planejamento, com o usuário, ANTES de escrever**. Mesmo pipeline
> mock-first → MSW → unit → e2e → real, **com dry-run completo** (mas o smoke pega o que o dry-run
> não pega — ex.: na P8 o `Decimal` do Prisma vem como **string** no JSON real). Depois vem só a
> **P10** (edição/RBAC: self-service `PATCH /auth/me` + troca de email `POST /auth/me/email`(+`/
> confirm`+`GET /users/confirm-email-change`); admin `GET /users`/`PATCH /users/:id`/`PATCH
> /gyms/:id`; front `pages/account/*` + `pages/admin/*` atrás do `RoleRoute`). Detalhe completo +
> inventário de rotas + aprendizados P7/P8 na memória `project_next_mission`.
>
> **Backend = `~/_Dev/samples/solid_api_sample`** (`master @ 613e324`, Fastify+Prisma+MySQL, :3333).
> `APP_URL=http://localhost:3001`; `REQUIRE_EMAIL_VERIFICATION` gateia só `POST /gyms/:gymId/
> check-ins`. `GET /auth/me` → `{id,username,is_verified,role}`. Backend tem `pnpm killapp` e
> `pnpm showdb` (Prisma Studio :5555, `--browser none` → abrir `localhost:5555`). Primeiro admin
> nasce via Studio (role→ADMIN) + relogar. username regex `/^[a-zA-Z0-9_]+$/` (sem ponto).
>
> Convenções (siga à risca): responda **terso** (caveman, full); UI no código = **inglês**, prosa =
> **PT**; shadcn-first; "Crie a pasta X" leva bloco ` ```sh mkdir `; criar arquivo = **"Vá na pasta
> X e crie `nome`"** (bareword); **Presentation Model** (lógica→`use-x-pm.ts`, `.tsx` só marcação) —
> se o `.tsx` divide a pasta com outros, o par view+PM vira subpasta de mesmo prefixo; forms shadcn
> **Card** + `noValidate`; validação **espelha o backend**; dados de smoke 1-por-linha em backticks.
> **Nunca pushe** (o usuário pusha, inclusive `--force-with-lease`); commits **por seção** com
> **`git add src`** (+ `package.json pnpm-lock.yaml` se a seção instalar dep), só quando eu pedir;
> README de cada parte num commit `docs:` próprio no fim. `pnpm lint` + `pnpm test:run` verdes antes
> de commit; conferir contra o arquivo real. **Planejar o layout COMIGO antes de escrever.**

## Current state

- **Branch:** `master` — sincronizado com `origin/master` (push do usuário, inclui `--force-with-lease`).
- **HEAD:** `b6e8ab4` (2026-06-20) docs: add part 8 tutorial. Stack da P8 (8 commits): feat sidebar
  shell → feat gyms api+mocks → feat gyms page → style status pages → feat create-gym+role guard →
  test → fix coerce coords → docs.
- **Working tree:** limpo. `pnpm test:run` = **11/11** (unit) · `pnpm e2e` = **11/11** · `pnpm lint`/`pnpm build` verdes.
- **Ambiente:** WSL, pnpm 11.5.2. Portas: `pnpm dev`=**3001**, `dev:test`=**5001**, backend=**3333**,
  prisma-studio=5555, preview=4173. `pnpm killapp` = faxina de portas/procs presos.

## Next / backlog

- **Parte 9 (a escrever):** check-ins (`POST /gyms/:gymId/check-ins` · history · metrics · `PATCH
  …/validate` ADMIN) + **demo do gate de email** + **Home vira dashboard pessoal leve** (só backend
  atual, sem all-time, sem mexer no backend). Próximo passo concreto = planejar com o usuário (layout
  do dashboard + shadcn `chart` vs barras CSS), depois dry-run completo, depois escrever.
- **Parte 10 (última):** edição + permissões (self-service conta/troca de email + área admin atrás do
  `RoleRoute`). Aqui entra a troca de email (`POST /auth/me/email` etc.) que o usuário perguntou.
- Ver resume prompt + memória `project_next_mission` (inventário de rotas P9/P10, shapes, aprendizados
  P7/P8).
- Dívida conhecida: `coverage/` ficou dentro do commit `039ba28` (P4). Decisão: deixar assim.

## Working rules (guardrails)

Não há `CLAUDE.md` no repo — doutrina vive na memória do harness + neste HANDOFF. Invioláveis: **nunca
pushar** (o usuário pusha) · **não commitar sem aprovação** · `pnpm lint`/`pnpm test:run` verdes antes
de commit · conferir contra o arquivo real antes de cravar · `git add src` por seção (README só no
`docs:` final; + lockfile se instalar dep) · tutorial novo = **dry-run completo** pra de-riscar +
**smoke real** (pega o que o dry-run não pega) · **planejar o layout com o usuário antes de escrever**.

## Deeper memory (Claude Code — mesma máquina)

`~/.claude/projects/-home-user--Dev-tutorials-front-01-setup/memory/` (`MEMORY.md` = índice). Notáveis:
`project_next_mission` (missão P9+ ativa, dashboard da Home, inventário de rotas, aprendizados P7/P8),
`project_readme_status` (P1–8 feitas), `project_frontend_first_methodology`, `reference_backend_sample`,
`feedback_presentation_model` (regra da pasta-PM), `feedback_mkdir_folders`, `feedback_file_create_phrasing`,
`feedback_ui_text_english`, `feedback_react19_types`, `feedback_tailwind_v4`, `feedback_scope`.

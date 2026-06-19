# HANDOFF — Frontend Setup Tutorial

Break-glass state for cold resume (any model/tool). Harness memory mirrors this as a cache.

## Resume prompt (copy-paste into a fresh session)

> Retomando o tutorial frontend (repo `01_setup`, branch `master`). **Partes 1–7 completas, commitadas e
> pushadas** — tutorial multi-parte no mesmo repo: **README.md** (Tailwind) → **README_2_shadcn.md** (shadcn/ui)
> → **README_3_msw.md** (mock-first MSW) → **README_4_vitest.md** (unit) → **README_5_playwright.md** (e2e) →
> **README_6_backend.md** (backend real: auth JWT em memória + refresh cookie httpOnly + silent refresh +
> AuthContext + ProtectedRoute) → **README_7_email_password.md** (verificação de email + reset de senha, duas
> portas cada: in-app + link). Eu executo **manualmente**, passo a passo, e te mando os resultados pra conferir
> contra os arquivos reais.
>
> **Próxima missão: escrever a Parte 8 — gyms.** Rotas: `GET /gyms/search ?query(≥3)&page`, `GET /gyms/nearby
> ?latitude&longitude` (front usa `navigator.geolocation.getCurrentPosition`; raio 10km, sem paginação),
> `POST /gyms` = **ADMIN** (`{title, description|null, phone|null, latitude, longitude}` → 201). **Aqui NASCE o
> sidebar** no `app-layout.tsx` (shadcn `sidebar`, à esquerda, itens por `role`; header vira faixa fina; o banner
> de verificação fica entre header e conteúdo). Primeiro item ADMIN (criar academia) → precisa do **guard por
> role** (`role==='ADMIN'`, vem do `/auth/me`). Mesmo pipeline mock-first → MSW → unit → e2e → real, **com dry-run
> completo** (re-aplicar feature+specs, validar lint/build/unit/e2e, reverter — pegou 2 bugs reais na P7).
> Depois vêm P9 (check-ins + demo do gate de email) e P10 (edição/RBAC: account + admin). Detalhe completo +
> inventário de rotas + aprendizados da P7 na memória `project_next_mission`.
>
> **Backend = `~/_Dev/samples/solid_api_sample`** (`master @ 613e324`, Fastify+Prisma+MySQL, :3333). `APP_URL=
> http://localhost:3001` no `.env` do backend; `REQUIRE_EMAIL_VERIFICATION=true` (gateia só `POST
> /gyms/:gymId/check-ins`). `GET /auth/me` → `{id,username,is_verified,role}`. Backend tem `pnpm killapp`.
>
> Convenções (siga à risca): responda **terso** (caveman, full); UI no código = **inglês**, prosa = **PT**;
> shadcn-first; "Crie a pasta X" leva bloco ` ```sh mkdir `; criar arquivo = **"Vá na pasta X e crie `nome`"**
> (bareword); **Presentation Model** (lógica→`use-x-pm.ts`, `.tsx` só marcação) — se o `.tsx` divide a pasta com
> outros, o par view+PM vira subpasta de mesmo prefixo; forms shadcn **Card** + `noValidate`; validação **espelha
> o backend**; dados de smoke 1-por-linha em backticks. **Nunca pushe** (o usuário pusha, inclusive
> `--force-with-lease`); commits **por seção** com **`git add src`** (+ `package.json pnpm-lock.yaml` se a seção
> instalar dep), só quando eu pedir; README de cada parte num commit `docs:` próprio no fim. `pnpm lint` +
> `pnpm test:run` verdes antes de commit; conferir contra o arquivo real.

## Current state

- **Branch:** `master` — sincronizado com `origin/master` (push do usuário, inclui `--force-with-lease`).
- **HEAD:** `d19c4ad` (2026-06-19) docs: add part 7 tutorial. Stack da P7 (8 commits): chore shadcn (input-otp+
  dialog) → feat me/role → feat forgot → feat reset-link → feat banner → feat verify-link → test → style
  banner-center → docs.
- **Working tree:** limpo. `pnpm test:run` = **8/8** (unit) · `pnpm e2e` = **8/8** · `pnpm lint`/`pnpm build` verdes.
- **Ambiente:** WSL, pnpm 11.5.2. Portas: `pnpm dev`=**3001**, `dev:test`=**5001**, backend=**3333**,
  prisma-studio=5555, preview=4173. `pnpm killapp` = faxina de portas/procs presos (no front e no backend).

## Next / backlog

- **Parte 8 (a escrever):** gyms (search · nearby geoloc · criar academia ADMIN) + **nasce o sidebar** + guard por
  role. Depois P9 (check-ins + demo do gate de email) e P10 (edição/RBAC). Ver resume prompt + memória
  `project_next_mission` (inventário de rotas das 3 partes, shapes, aprendizados da P7). Próximo passo concreto =
  planejar o sidebar (layout) com o usuário, depois escrever a P8 com dry-run.
- Dívida conhecida: `coverage/` ficou dentro do commit `039ba28` (P4). Decisão: deixar assim.

## Working rules (guardrails)

Não há `CLAUDE.md` no repo — doutrina vive na memória do harness + neste HANDOFF. Invioláveis: **nunca pushar**
(o usuário pusha) · **não commitar sem aprovação** · `pnpm lint`/`pnpm test:run` verdes antes de commit ·
conferir contra o arquivo real antes de cravar · `git add src` por seção (README só no `docs:` final; + lockfile
se instalar dep) · tutorial novo = **dry-run completo** pra de-riscar.

## Deeper memory (Claude Code — mesma máquina)

`~/.claude/projects/-home-user--Dev-tutorials-front-01-setup/memory/` (`MEMORY.md` = índice). Notáveis:
`project_next_mission` (missão P8+ ativa, inventário de rotas, aprendizados P7), `project_readme_status` (P1–7
feitas), `project_frontend_first_methodology`, `reference_backend_sample`, `feedback_presentation_model` (regra
da pasta-PM), `feedback_mkdir_folders`, `feedback_file_create_phrasing`, `feedback_ui_text_english`,
`feedback_react19_types`, `feedback_tailwind_v4`, `feedback_scope`.

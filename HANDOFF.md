# HANDOFF — Frontend Setup Tutorial

Break-glass state for cold resume (any model/tool). Harness memory mirrors this as a cache.

## Resume prompt (copy-paste into a fresh session)

> Retomando o tutorial frontend (repo `01_setup`, branch `master`). **Partes 1–6 completas, commitadas
> e pushadas** — tutorial multi-parte no mesmo repo: **README.md** (Tailwind) → **README_2_shadcn.md**
> (shadcn/ui) → **README_3_msw.md** (mock-first MSW) → **README_4_vitest.md** (unit) → **README_5_playwright.md**
> (e2e) → **README_6_backend.md** (backend real: auth JWT em memória + refresh cookie httpOnly + silent
> refresh + AuthContext `loading|authed|guest` + ProtectedRoute + MSW estendido + layouts com cara de app +
> smoke manual; 9 seções). Eu executo **manualmente**, passo a passo, e te mando os resultados pra conferir
> contra os arquivos reais.
>
> **Nova missão: finalizar a app como exemplo Gympass-style completo, escrevendo a(s) Parte(s) 7+.** Três
> passos: (1) **verificar rotas backend não cobertas** — recon JÁ FEITA (ver memória `project_next_mission`),
> falta confirmar os shapes (Zod body/response) controller a controller; (2) **analisar o que escrever + como
> encaixar no layout atual** (header `Gympass Sample App` ganha nav Gyms/Check-ins/Admin, banner de verificação
> de email, telas novas); (3) **escrever Parte(s) 7+** no mesmo pipeline mock-first → MSW → unit → e2e → real.
>
> **Backend = `~/_Dev/samples/solid_api_sample`** (Fastify+Prisma+MySQL, :3333), versão estendida do Ignite
> "API SOLID". **Falta cobrir no front:** verificação de email (`/users/verify-email` link, `/send-verification`,
> `/resend-verification`, `/verify-email/otp` — **gateia o check-in**); reset de senha (`/users/forgot-password`,
> `/users/reset-password` — link/OTP **impresso no console do backend** em dev); gyms (`/gyms/search`,
> `/gyms/nearby` geoloc, `POST /gyms` = **ADMIN**); check-ins (`POST /gyms/:gymId/check-ins` exige **email
> verificado**, `/check-ins/history`, `/check-ins/metrics`, `PATCH /check-ins/:id/validate` = **ADMIN**).
> **Gaps técnicos:** `/auth/me` hoje só devolve `{id,username}` — pra RBAC/admin + banner de verificação o front
> precisa de `role`+`is_verified` (checar `profile-controller`; talvez estender `get-profile.ts`+`AuthContext`);
> RBAC no front (guard por role); `navigator.geolocation` pro nearby; tratar 429 (rate-limit). **Hipótese de
> split (decidir no passo 2):** P7 = email verif + reset senha; P8 = gyms (+criar academia admin); P9 = check-ins
> (+history/metrics +validar admin). Pode ser 2–3 tutorials. Detalhe completo na memória `project_next_mission`.
>
> Convenções (siga à risca): responda **terso** (caveman, full); UI visível no código = **inglês**, prosa = **PT**;
> "Crie a pasta X" leva bloco ` ```sh mkdir `; criar arquivo = **"Vá na pasta X e crie `nome`"** (bareword);
> **Presentation Model** (lógica→`use-x-pm.ts`, `.tsx` só marcação) — **se o `.tsx` divide a pasta com outros,
> o par view+PM vira subpasta de mesmo prefixo** (ex: `_layouts/app-layout/`); forms shadcn **Card** + `noValidate`;
> validação **espelha o backend**. **Nunca pushe** (o usuário pusha, inclusive `--force`); commits **por seção**
> com **`git add src`** (não `git add .`, pra não varrer o README), só quando eu pedir; o README de cada parte
> vai num commit `docs:` próprio no fim. `pnpm lint` + `pnpm test:run` verdes antes de commit; conferir contra o
> arquivo real. Tutorial novo = **dry-run** (implementar/validar/reverter) pra de-riscar antes de escrever.

## Current state

- **Branch:** `master` — sincronizado com `origin/master` (push do usuário, inclui `--force` quando reescreve).
- **HEAD:** `661a9f0` (2026-06-19) docs: add part 6 tutorial (real backend integration).
  Stack da Parte 6 (7 commits de código + docs): store → endpoints → silent-refresh → msw → auth-provider →
  layout-chrome → docs. A §8 (smoke manual) entrou via reset+recommit do `docs:` (force-push).
- **Working tree:** limpo. `pnpm test:run` = 7/7 (unit) · `pnpm e2e` = 4/4 · `pnpm lint`/`pnpm build` verdes.
- **Ambiente:** WSL, pnpm 11.5.2. Portas: `pnpm dev`=**3001**, `dev:test`=**5001**, backend=**3333**, preview=4173.
  `pnpm killapp` = faxina de portas/procs presos.

## Next / backlog

- **Parte(s) 7+ (a escrever — missão definida, recon de rotas feita):** cobrir email-verif, reset-senha, gyms,
  check-ins + RBAC admin; finalizar a app. Ver resume prompt + memória `project_next_mission` (inventário de
  rotas, gaps técnicos, hipótese de split P7/P8/P9). Próximo passo concreto = confirmar request/response shapes
  dos controllers do backend, depois planejar o encaixe no layout, depois escrever (dry-run por parte).
- Dívida conhecida: `coverage/` ficou dentro do commit `039ba28` (P4). Decisão: deixar assim.

## Working rules (guardrails)

Não há `CLAUDE.md` no repo — doutrina vive na memória do harness + neste HANDOFF. Invioláveis: **nunca pushar**
(o usuário pusha) · **não commitar sem aprovação** · `pnpm lint`/`pnpm test:run` verdes antes de commit ·
conferir contra o arquivo real antes de cravar · `git add src` por seção (README só no `docs:` final).

## Deeper memory (Claude Code — mesma máquina)

`~/.claude/projects/-home-user--Dev-tutorials-front-01-setup/memory/` (`MEMORY.md` = índice). Notáveis:
`project_next_mission` (a missão P7+), `project_readme_status` (P1–6 feitas), `project_frontend_first_methodology`,
`reference_backend_sample`, `feedback_presentation_model` (inclui regra da pasta-PM), `feedback_mkdir_folders`,
`feedback_file_create_phrasing`, `feedback_ui_text_english`, `feedback_react19_types`, `feedback_tailwind_v4`,
`feedback_scope`.

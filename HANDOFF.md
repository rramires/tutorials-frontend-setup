# HANDOFF — Frontend Setup Tutorial

Break-glass state for cold resume (any model/tool). Harness memory mirrors this as a cache.

## Resume prompt (copy-paste into a fresh session)

> Retomando o tutorial de setup frontend (repo `01_setup`, branch `master`, sincronizado com origin).
> Tutorial multi-parte no mesmo repo: **README.md** = setup só **Tailwind**; **README_2_shadcn.md** =
> migração pra **shadcn/ui**; **README_3_msw.md** = **mock-first** (API mockada); **README_4_vitest.md** =
> **testes unitários** (Vitest + Testing Library); **README_5_playwright.md** = **testes e2e** (Playwright
> contra o MSW). Eu executo **manualmente**, passo a passo, e te mando os resultados pra você conferir
> contra os arquivos reais.
>
> **Partes 1-5 estão completas, commitadas e pushadas.** A Parte 5 entregou: `playwright.config.ts`
> (`testDir './test'`, `baseURL`+`webServer: pnpm dev:test` porta **5001**, só chromium, `trace:'on-first-retry'`),
> Vitest **escopado** em `src/` (`vite.config.ts` `test.include:['src/**/*.spec.{ts,tsx}']`) pra não rodar os
> e2e, helper `test/e2e-utils.ts` `waitForUIInspection` (250ms, gated `PLAYWRIGHT_SLOW_UI`), specs
> `test/sign-in.spec.ts` + `test/register.spec.ts` (4 testes, `getByLabel`/`getByRole`, asserções web-first
> `toBeVisible`/`toHaveURL`, `goto` **puro** sem `networkidle`), scripts `e2e`/`e2e:ui`/`pree2e`/`killapp`.
> Gotchas travados: **tsconfig split** — Playwright é Node-land, então `playwright.config.ts`+`test/e2e-utils.ts`+
> `test/*.spec.ts` vão no `tsconfig.node.json` e são **excluídos** do `tsconfig.app.json` (senão `pnpm build`
> quebra: `process` não existe); `test-results/`+`playwright-report/` no `.gitignore` E `globalIgnores` eslint;
> `getByLabel('Password',{exact:true})` no register. **Lentidão da 1ª run (~2.3m) = Vite `optimizeDeps` frio,
> NÃO networkidle** (depois ~13s; fluxo rápido = deixar `pnpm dev:test` aberto e o `reuseExistingServer` reusa).
>
> **Próxima fase = Parte 6 (`README_6_backend.md`), recon FEITA + plano APROVADO, ainda NÃO escrita — é o
> que você vai escrever.** Backend real (`~/_Dev/samples/solid_api_sample`, `pnpm dev` :3333, precisa MySQL).
> Decisões travadas: access token **em memória** (não localStorage; durabilidade = refresh cookie httpOnly,
> anti-XSS) · **refresh robusto** (401→`PATCH /auth/refresh`→retry) · **escopo completo**. Arquitetura =
> token em memória + cookie httpOnly + **silent refresh** (boot + 401) + `AuthContext` (`loading|authed|guest`).
> Contrato: `POST /auth/login`→`{token}`+cookie refresh; `POST /users`→`{user}` (sem token); `GET /auth/me`→
> `{user:{id,username}}`; `PATCH /auth/refresh`→`{token}` (rotação **single-use** → dedupe refresh concorrente);
> `POST /auth/logout`→204. **7 seções:** (1) subir backend+sanity (`.env.local` já aponta :3333, MSW só em
> test → `pnpm dev` já bate na API real) (2) `src/lib/auth-store.ts` token em var de módulo (3) APIs
> refresh/get-profile/sign-out + request-interceptor Bearer (4) response-interceptor 401→single-flight
> refresh→retry (excluir `/auth/refresh` do interceptor) + boot-refresh (5) `AuthProvider`+`ProtectedRoute`
> (loading→spinner) Home protegida mostra `user.username` (6) login guarda token + logout (7) docs.
> **CRÍTICO:** Home protegido chama `/auth/me`+`/auth/refresh` no boot → **estender os handlers MSW**
> (`/auth/me`,`/auth/refresh`,`/auth/logout`) senão o **e2e do P5 quebra**. **Dry-run** contra MSW estendido
> (não precisa MySQL); smoke no backend real = usuário. Detalhe completo na memória `project_readme_status`.
> Ordem geral = mocks(P3)→unit(P4)→e2e(P5)→real(P6).
>
> Convenções (siga à risca): responda **terso** (caveman, full); UI visível no código = **inglês**,
> prosa = **PT**; toda "Crie a pasta X" leva bloco ` ```sh mkdir `; passo de criar arquivo = **"Vá na pasta
> X e crie `nome`"** (nome do arquivo bareword, sem path); **Presentation Model** (lógica→`use-x-pm.ts`);
> forms shadcn **Card** + `noValidate`; validação **espelha o backend** `~/_Dev/samples/solid_api_sample`
> (controllers = fonte da verdade; só olhar quando eu pedir). **Nunca pushe** (eu pusho, inclusive `--force`);
> commits **escopados por seção**, só quando eu pedir; o README de cada parte vai num commit `docs:` próprio.
> `pnpm lint` + `pnpm test:run` verdes antes de commit; conferir contra o arquivo real antes de cravar.
> Tutorial novo = vale **dry-run** (instalar/configurar/rodar) pra de-riscar antes — foi assim que P4/P5
> pegaram bugs (build sem tsconfig split, eslint no coverage) antes de eu executar.

## Current state

- **Branch:** `master` — **sincronizado com `origin/master`** (push feito).
- **HEAD:** `9cfde5a` (2026-06-18) docs: add part 5 tutorial (e2e tests with playwright).
  Stack da Parte 5 (6 commits): `9cfde5a` docs README_5 · `faf9066` register e2e (+ scripts `pree2e`/`killapp`) ·
  `db51e09` sign-in e2e · `a2e38fe` e2e helper · `60c652d` configure playwright · `f33820c` add playwright.
- **Working tree:** limpo. `pnpm test:run` = 7/7 (unit) · `pnpm e2e` = 4/4 (1ª ~2.3m, depois ~13s) ·
  `pnpm lint` verde · `pnpm build` passa.
- **Ambiente:** WSL. pnpm **11.5.2** (aprovação de build em `pnpm-workspace.yaml` `allowBuilds:{msw:true}`).
  Playwright **1.61.0** + chromium baixado (`~/.cache/ms-playwright`). `pnpm killapp` = faxina de portas/procs
  presos (3001/5001/4173 + playwright). Rodar e2e em loop no shell pode acumular zumbis/OOM — use `killapp`.

## Next / backlog

- **Parte 6 (a escrever — plano APROVADO):** `README_6_backend.md` — backend real, auth JWT em memória +
  refresh cookie + AuthContext + ProtectedRoute + MSW estendido (ver resume prompt + memória
  `project_readme_status` p/ as 7 seções, contrato e gotchas). Recon já feita; próximo passo = **dry-run**
  (front contra MSW estendido) e escrever. Não precisa reanalisar — só executar o plano.
- Dívida conhecida: `coverage/` ficou dentro do commit `039ba28` (destrackada em `e7c70e8`). Decisão do
  usuário: **deixar assim** (não reescrever histórico).

## Working rules (guardrails)

Não há `CLAUDE.md` no repo — doutrina vive na memória do harness + neste HANDOFF. Invioláveis:
**nunca pushar** (o usuário pusha) · **não commitar sem aprovação** · `pnpm lint`/`pnpm test:run` verdes
antes de commit · conferir contra o arquivo real antes de cravar (birth time `stat -c %w` / reproduzir).

## Deeper memory (Claude Code — mesma máquina)

`~/.claude/projects/-home-user--Dev-tutorials-front-01-setup/memory/` (`MEMORY.md` = índice). Notáveis:
`project_readme_status`, `project_frontend_first_methodology`, `reference_backend_sample`,
`feedback_ui_text_english`, `feedback_mkdir_folders`, `feedback_file_create_phrasing`,
`feedback_presentation_model`, `reference_shadcn_init_button`, `feedback_tailwind_v4`,
`feedback_react19_types`, `feedback_scope`.

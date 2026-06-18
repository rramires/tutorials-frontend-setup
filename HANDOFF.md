# HANDOFF — Frontend Setup Tutorial

Break-glass state for cold resume (any model/tool). Harness memory mirrors this as a cache.

## Resume prompt (copy-paste into a fresh session)

> Retomando o tutorial de setup frontend (repo `01_setup`, branch `master`, sincronizado com origin).
> Tutorial multi-parte no mesmo repo: **README.md** = setup só **Tailwind**; **README_2_shadcn.md** =
> migração pra **shadcn/ui**; **README_3_msw.md** = **mock-first** (API mockada); **README_4_vitest.md** =
> **testes unitários** (Vitest + Testing Library). Eu executo **manualmente**, passo a passo, e te mando
> os resultados pra você conferir contra os arquivos reais.
>
> **Partes 1, 2, 3 e 4 estão completas, commitadas e pushadas.** A Parte 4 entregou: Vitest configurado
> dentro da `vite.config.ts` (happy-dom + `globals` + `test/setup.ts` com jest-dom), helper
> `test/utils.tsx` `renderWithProviders` (QueryClient novo `retry:false` + `MemoryRouter`), specs de
> `PageTitle` e de validação dos forms sign-in/register (`src/**/*.spec.tsx`), e **coverage** v8
> (`pnpm test:coverage`). Unit testa **só validação** (falha antes da rede, sem MSW); caminho feliz com
> rede fica pra P5. Gotchas travados: `tsconfig.app.json` `include: ["src","test"]` (senão `pnpm build`
> quebra por falta dos tipos do jest-dom); `coverage` no `.gitignore` **e** no `globalIgnores` do eslint.
>
> **Próxima fase = Parte 5 (`README_5_playwright.md`), ainda NÃO escrita.** Plano travado: **Playwright e2e**
> — `pnpm add -D @playwright/test`, `playwright.config.ts` com `webServer: pnpm dev:test` na porta **5001**,
> `baseURL`, specs e2e em `test/*.spec.ts` (`getByLabel`/`getByRole`, assert toast + navegação ponta a ponta
> **contra o MSW**), `test/utils.ts` com `waitForUIInspection` gated por `PLAYWRIGHT_SLOW_UI`. Espelhar o
> setup do `~/_Dev/courses/pizzashop_web`. Depois vem a **Parte 6** (`README_6_backend.md`: backend real —
> apontar `.env.local`, guardar `token`, rotas protegidas). Ordem geral = mocks(P3)→unit(P4)→e2e(P5)→real(P6).
>
> Convenções (siga à risca): responda **terso** (caveman, full); UI visível no código = **inglês**,
> prosa = **PT**; toda "Crie a pasta X" leva bloco ` ```sh mkdir `; passo de criar arquivo = **"Vá na pasta
> X e crie `nome`"** (nome do arquivo bareword, sem path, pra copiar limpo); **Presentation Model**
> (lógica→`use-x-pm.ts`); forms shadcn **Card** + `noValidate`; validação **espelha o backend**
> `~/_Dev/samples/solid_api_sample` (controllers = fonte da verdade; só olhar quando eu pedir).
> Tamanho de cada README ~500-900 linhas. **Nunca pushe** (eu pusho, inclusive `--force`); commits
> **escopados por seção**, só quando eu pedir; o README de cada parte vai num commit `docs:` próprio.
> `pnpm lint` verde + `pnpm test:run` verde antes de commit; conferir contra o arquivo real antes de cravar.
> Quando eu mandar criar um tutorial novo, vale fazer **dry-run** (instalar/configurar/rodar) pra de-riscar
> antes — foi assim que P4 pegou bugs (build sem `include`, eslint no coverage) antes de eu executar.

## Current state

- **Branch:** `master` — **sincronizado com `origin/master`** (push feito).
- **HEAD:** `e7c70e8` (2026-06-17) chore: untrack coverage report.
  Stack da Parte 4 (8 commits): `e7c70e8` untrack coverage · `6e6455b` docs README_4 · `039ba28` coverage v8 ·
  `d276741` register spec · `d81703a` sign-in spec · `2397387` render helper · `4a36fa0` page-title spec ·
  `f6b17f6` configure vitest · `b408596` add vitest+testing-library.
- **Working tree:** limpo. `pnpm test:run` = 7/7 verde · `pnpm lint` verde · `pnpm build` passa.
- **Detalhe de ambiente:** pnpm **11.5.2** — aprovação de build script fica em `pnpm-workspace.yaml`
  (`allowBuilds: { msw: true }`). P5 instala browsers do Playwright (`npx playwright install`) — passo à
  parte, fora do pnpm; pode pedir libs do sistema.

## Next / backlog

- **Parte 5 (a escrever):** `README_5_playwright.md` — Playwright e2e contra o MSW (ver resume prompt).
- **Parte 6 (futuro):** backend real (`.env.local` → API de verdade, token, rotas protegidas).
- Dívida conhecida: a pasta `coverage/` ficou dentro do commit `039ba28` no histórico (destrackada em
  `e7c70e8`). Decisão do usuário: **deixar assim** (não reescrever histórico).

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

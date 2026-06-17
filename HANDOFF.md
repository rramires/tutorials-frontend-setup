# HANDOFF — Frontend Setup Tutorial

Break-glass state for cold resume (any model/tool). Harness memory mirrors this as a cache.

## Resume prompt (copy-paste into a fresh session)

> Retomando o tutorial de setup frontend (repo `01_setup`, branch `master`, sincronizado com origin).
> Tutorial multi-parte no mesmo repo: **README.md** = setup só **Tailwind**; **README_2_shadcn.md** =
> migração pra **shadcn/ui**; **README_3_msw.md** = **mock-first** (API mockada). Eu executo
> **manualmente**, passo a passo, e te mando os resultados pra você conferir contra os arquivos reais.
>
> **Partes 1, 2 e 3 estão completas, commitadas e pushadas.** A Parte 3 entregou: `src/env.ts` (Zod),
> `.env.local`(dev)/`.env.test`(mock), camada axios (`src/lib/api.ts` + `src/api/*`), **React Query** +
> **sonner**, forms conectados (`useMutation` + toast + navigate, sem mais `console.log`), e **MSW**
> (`src/api/mocks/`, `enableMSW` gated em `MODE==='test'`, script `dev:test` na porta **5001**).
> Mock rules dos testes: senha `Password1!` autentica; username `admin` → 409.
>
> **Próxima fase = Parte 4 (`README_4_playwright.md`), ainda NÃO escrita.** Plano travado:
> primeiro **Vitest unit** (happy-dom + @testing-library + `test/setup.ts` + 1 spec de componente),
> depois **Playwright e2e** (config com `webServer: pnpm dev:test` na porta 5001, `baseURL`,
> `getByLabel`/`getByRole`, assert toast + navegação, `test/utils.ts` com `PLAYWRIGHT_SLOW_UI`).
> Espelhar o setup do `~/_Dev/courses/pizzashop_web`. Depois vem a **Parte 5** (backend real:
> apontar `.env.local`, guardar `token`, rotas protegidas). Ordem geral = mocks(P3)→testes(P4)→real(P5).
>
> Convenções (siga à risca): responda **terso** (caveman, full); UI visível no código = **inglês**,
> prosa = **PT**; toda "Crie a pasta X" leva bloco ` ```sh mkdir `; **Presentation Model**
> (lógica→`use-x-pm.ts`); forms shadcn **Card** + `noValidate`; validação **espelha o backend**
> `~/_Dev/samples/solid_api_sample` (controllers = fonte da verdade; só olhar quando eu pedir).
> Tamanho de cada README ~600-900 linhas. **Nunca pushe** (eu pusho); commits **escopados por seção**,
> só quando eu pedir; o README de cada parte vai num commit `docs:` próprio (fora dos `feat:`).
> `pnpm lint` verde antes de commit; conferir contra o arquivo real antes de cravar.

## Current state

- **Branch:** `master` — **sincronizado com `origin/master`** (push feito).
- **HEAD:** `ea1c13a` (2026-06-17) docs: add part 3 tutorial (API mocking with MSW).
  Stack da Parte 3: `4ad2159` MSW · `3cba08f` forms · `4b1af1f` providers · `9ea95dc` axios · `0bf5c68` env.
- **Working tree:** limpo. `pnpm lint` verde.
- **Detalhe de ambiente:** pnpm **11.5.2** — aprovação de build script fica em `pnpm-workspace.yaml`
  (`allowBuilds: { msw: true }`), **não** no `package.json`. Usar `pnpm approve-builds` é o jeito à prova
  de versão (P4 instala browsers do Playwright — pode pedir aprovação parecida).

## Next / backlog

- **Parte 4 (a escrever):** `README_4_playwright.md` — Vitest unit + Playwright e2e (ver resume prompt).
- **Parte 5 (futuro):** backend real (`.env.local` → API de verdade, token, rotas protegidas).
- Decisão antiga em aberto: commitar `.env` direto vs gitignored+`.env.example` (policy é pública/não-secreta).

## Working rules (guardrails)

Não há `CLAUDE.md` no repo — doutrina vive na memória do harness + neste HANDOFF. Invioláveis:
**nunca pushar** (o usuário pusha) · **não commitar sem aprovação** · `pnpm lint` verde antes de commit ·
conferir contra o arquivo real antes de cravar (birth time `stat -c %w` / reproduzir).

## Deeper memory (Claude Code — mesma máquina)

`~/.claude/projects/-home-user--Dev-tutorials-front-01-setup/memory/` (`MEMORY.md` = índice). Notáveis:
`project_readme_status`, `project_frontend_first_methodology`, `reference_backend_sample`,
`feedback_ui_text_english`, `feedback_mkdir_folders`, `feedback_presentation_model`,
`reference_shadcn_init_button`, `feedback_tailwind_v4`, `feedback_react19_types`, `feedback_scope`.

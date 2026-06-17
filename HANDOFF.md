# HANDOFF — Frontend Setup Tutorial

Break-glass state for cold resume (any model/tool). Harness memory mirrors this as a cache.

## Resume prompt (copy-paste into a fresh session)

> Retomando o tutorial de setup frontend (repo `01_setup`, branch `master`, sincronizado com origin).
> Tutorial em 2 partes no mesmo repo: **README.md** = setup só **Tailwind** (entregável standalone);
> **README_2_shadcn.md** = migração pra **shadcn/ui**. Eu executo **manualmente**, passo a passo, e te
> mando os resultados pra você conferir contra os arquivos reais.
>
> **Parte 2 está completa, commitada e pushada:** shadcn init, tema claro/escuro, layouts→tokens, e a
> seção de forms — sign-in/register com shadcn **Card** + React Hook Form + Zod + **Presentation Model**,
> política de senha via **env var do Vite** (`.env` + `src/vite-env.d.ts`), `<form noValidate>`, validação
> **espelhando o backend**. Forms hoje só fazem `console.log(data)` (sem API conectada).
>
> **Próxima fase provável:** um **3º tutorial (README_3) sobre MSW** neste repo (mock de API + testes).
> Aí entram `.env.local` (URL do backend dev, gitignored) + `.env.test` (mock `'/'`, delay off) — padrão
> Vite do `~/_Dev/courses/pizzashop_web`. **Decisão de env em aberto:** committar `.env` (policy compartilhada)
> direto vs manter gitignored + `.env.example`.
>
> Convenções (siga à risca): responda **terso** (caveman, full); UI visível no código = **inglês**, prosa = **PT**;
> toda "Crie a pasta X" leva bloco ` ```sh mkdir `; **Presentation Model** (lógica→`use-x-pm.ts`); React 19
> `SubmitEvent` (não `FormEvent`); Tailwind v4 `@custom-variant`; forms usam shadcn **Card** + `noValidate`.
> Validação **espelha o backend** `~/_Dev/samples/solid_api_sample` (controllers = fonte da verdade; só olhar
> quando eu pedir). **Nunca pushe** (eu pusho); commits **escopados por seção**, só quando eu pedir; confirme
> antes de qualquer coisa irreversível.

## Current state

- **Branch:** `master` — **sincronizado com `origin/master`** (push feito).
- **HEAD:** `2880078` (2026-06-17) docs: revise part 2 tutorial (shadcn forms) and align part 1.
  Stack: `a6db7e4` forms · `a7d3fee` layouts→tokens · `863c4bc` tema · `5becb7d` shadcn init.
  (Histórico foi reescrito antes — mode-toggle EN foldado no commit do tema — e já pushado.)
- **Uncommitted:** só `HANDOFF.md` + `AGENTS.md` (este checkpoint).
- `pnpm lint` limpo. Forms validados no browser (regex reprova `password`, aceita `Password1!`).

## Next / backlog

- **Parte 3 (futuro):** tutorial de **MSW** (mock + testes) → introduz `.env.local` + `.env.test`.
- **Decisão de env em aberto:** `.env` commit direto vs gitignored+`.env.example` (a policy é compartilhada/não-secreta).
- Conectar os forms a um backend real (hoje só `console.log`).

## Working rules (guardrails)

Não há `CLAUDE.md` no repo — doutrina vive na memória do harness + neste HANDOFF. Invioláveis:
**nunca pushar** (o usuário pusha) · **não commitar sem aprovação** · `pnpm lint` verde antes de commit ·
conferir contra o arquivo real antes de cravar (birth time `stat -c %w` / reproduzir).

## Deeper memory (Claude Code — mesma máquina)

`~/.claude/projects/-home-user--Dev-tutorials-front-01-setup/memory/` (`MEMORY.md` = índice). Notáveis:
`project_readme_status`, `reference_backend_sample`, `feedback_ui_text_english`, `feedback_mkdir_folders`,
`feedback_presentation_model`, `reference_shadcn_init_button`, `feedback_tailwind_v4`, `feedback_react19_types`,
`feedback_scope`.

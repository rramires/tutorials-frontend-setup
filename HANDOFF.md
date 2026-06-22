# HANDOFF — Frontend Setup Tutorial

Break-glass state for cold resume (qualquer modelo/ferramenta). A memória do harness espelha isto.

## Status: ✅ TUTORIAL COMPLETO (Partes 1–10)

Tutorial frontend multi-parte (mesmo repo), executado **manualmente** pelo usuário, **mock-first**,
prosa pt-BR, app Gympass-style. **Todas as 10 partes escritas, executadas e commitadas.** Não há
próxima parte.

## Resume prompt (cola numa sessão nova, se for continuar/derivar)

> Tutorial frontend (`01_setup`, branch `master`) está **COMPLETO** — Partes 1–10 todas escritas,
> executadas e commitadas: **TUTORIAL_01_setup.md** (Tailwind) → **README_2_shadcn** → **README_3_msw**
> (mock-first MSW) → **README_4_vitest** → **README_5_playwright** → **README_6_backend** (auth
> real) → **README_7_email_password** (verif-email + reset, 2 portas) → **README_8_gyms** (sidebar
> + `RoleRoute`) → **README_9_check_ins** (dashboard recharts + ⭐ gate de email) →
> **README_10_edit_permissions** (self-service de conta + área admin RBAC; Account = ghost
> icon-button `UserRoundPen` no **rodapé** do sidebar). HEAD `b01e354`. **Não existe Parte 11.**
> Se for continuar, é melhoria/projeto derivado — leia este HANDOFF + a memória
> (`project_readme_status` = índice das 10 partes; `project_next_mission` = inventário de rotas do
> backend + aprendizados P7–P10). Doutrina: terso; UI no código = inglês, prosa = PT; shadcn-first;
> **Presentation Model** (lógica/formatação no `use-x-pm`); **nunca pushar** (o usuário pusha);
> `git add src` por seção (README no `docs:` final); tutorial novo = dry-run completo + smoke real;
> planejar layout COM o usuário antes de escrever.

## Current state

- **Branch:** `master`. **HEAD:** `b01e354` (2026-06-22) docs: add part 10 tutorial.
- **Stack da P10 (4 commits):** `fix: seed user-edit form (values/dirtyFields, key+defaultValue
  role) + read-only self role` → `feat: move Account to the sidebar footer` → `test: cover account
  + admin` → `docs: add part 10`.
- **Working tree limpo.** Gates: `pnpm test:run` = **20/20** · `pnpm e2e` = **21/21** · lint/build
  verdes.
- **Pendente do usuário:** `git push` (o usuário sempre pusha). Smoke da P10 validado à mão
  (account self-service, admin RBAC, edição de gym). O user-edit teve **4 bugs** achados só no uso
  real (RHF Controller+async, `dirtyFields`-vs-`useWatch`, Radix Select stale na navegação entre
  usuários, self-role como Badge) — todos corrigidos; detalhes em `project_next_mission`.
- **Ambiente:** WSL, pnpm 11.5.2. Portas: dev=**3001**, dev:test=**5001**, backend=**3333**,
  prisma-studio=5555. `pnpm killapp` = faxina de portas.

## Working rules (guardrails)

Não há `CLAUDE.md` no repo — doutrina vive na memória do harness + neste HANDOFF. Invioláveis:
**nunca pushar** (o usuário pusha, incl. `--force-with-lease`) · **não commitar sem aprovação** ·
`pnpm lint` + `pnpm test:run` verdes antes de commit · `git add src` por seção (README no `docs:`
final; + lockfile se instalar dep) · tutorial novo = **dry-run completo + smoke real** · **planejar
o layout com o usuário antes de escrever**.

## Deeper memory (Claude Code — mesma máquina)

`~/.claude/projects/-home-user--Dev-tutorials-front-01-setup/memory/` (`MEMORY.md` = índice).
Notáveis: `project_readme_status` (índice das 10 partes, todas done), `project_next_mission`
(inventário de rotas do backend + aprendizados P7–P10, incl. os 4 bugs de RHF/Radix da P10),
`project_frontend_first_methodology`, `reference_backend_sample`, `feedback_presentation_model`
(regra da pasta-PM), `feedback_mkdir_folders`, `feedback_file_create_phrasing`,
`feedback_ui_text_english`, `feedback_react19_types`, `feedback_tailwind_v4`, `feedback_scope`.

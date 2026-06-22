# HANDOFF — Frontend Setup Tutorial

Break-glass state para resume frio (qualquer modelo/ferramenta). A memória do harness
espelha isto; a **doutrina** vive em `CLAUDE.md` (este HANDOFF só aponta).

## Status: ✅ TUTORIAL COMPLETO (Partes 1–10) + entregue como sample p/ monorepo

App frontend Gympass-style, **mock-first**, executada manualmente. As 10 partes estão
escritas/executadas/commitadas. Agora também documentada nível-projeto e copiada para o
monorepo. **Sem trabalho em aberto neste repo.**

## Resume prompt (cola numa sessão nova, se for derivar/continuar)

> Leia este `HANDOFF.md` + o `CLAUDE.md` (doutrina) e continue a partir de "Estado atual".
> Confirme antes de qualquer ação irreversível. **Nunca pushe** (o usuário pusha). Pergunte
> UMA coisa por vez, em pt-BR, sem caixas de múltipla escolha. Caveman mode (terse;
> código/commits/segurança normais).
>
> Estado: tutorial **COMPLETO** (P1–P10) — os guias são `TUTORIAL_01_setup.md` …
> `TUTORIAL_10_edit_permissions.md` (renomeados de `README_*`). As docs nível-projeto
> (`README`/`PROJECT` EN+PT + `CLAUDE.md`) já existem, no estilo do backend
> `solid_api_sample`. O projeto+docs+`.env*` foram **copiados** para
> `~/_Dev/samples/monorepo_sample/web/` (irmão do `api/` = backend). **Não existe Parte 11** —
> qualquer coisa a mais é melhoria/derivado. Se for mexer no monorepo, faça isso **lá**
> (raiz `monorepo_sample`), não aqui.

## Estado atual

- **Branch / HEAD:** `master` @ `4655436` (2026-06-22) "docs: add project README + PROJECT
  (EN/PT) + CLAUDE". Árvore limpa.
- **Últimos 2 commits (este trabalho):** `58450c4` (rename READMEs → `TUTORIAL_NN_*` + fix
  cross-refs) → `4655436` (docs nível-projeto + `CLAUDE.md`). **Ambos unpushed** —
  `origin/master` está em `6a169ac`; push é do usuário.
- **Entregue ao monorepo:** `~/_Dev/samples/monorepo_sample/web/` recebeu cópia completa
  (`src` idêntico, `test`, `public`, configs, 17 `.md`, **todos os `.env*`**), **sem**
  `.git`/`node_modules`/`dist`/`coverage`/artefatos. Links relativos das docs
  `../solid_api_sample` reescritos → `../api` **só na cópia**. A sessão do monorepo fará
  `pnpm install` + os 1ºs commits e assume o `web/` daí em diante.
- **Doutrina agora IN-REPO:** `CLAUDE.md` (processo: branch/commit por fase, gates, padrões
  front, UI inglês/prosa PT, docs nas 4 línguas, nunca pushar).
- **Gates (quando rodados):** `pnpm lint` · `pnpm build` · `pnpm test:run` (20/20) ·
  `pnpm e2e` (21/21) verdes. Ports: dev=3001, mock/e2e=5001, backend=3333.

## Working rules (guardrails)

Doutrina completa em **`CLAUDE.md`** (fonte única). Invioláveis inline como cinto de
segurança: **nunca pushar** (o usuário pusha, incl. `--force-with-lease`) · **não commitar
sem aprovação** · gate verde antes de commit · `git add src` por seção (docs no `docs:`
próprio) · planejar layout COM o usuário antes de escrever (1 pergunta por vez, pt-BR, sem
caixas) · UI no código = inglês, prosa = PT.

## Deeper memory (Claude Code — mesma máquina)

`~/.claude/projects/-home-user--Dev-tutorials-front-01-setup/memory/` (`MEMORY.md` = índice).
Notáveis: `project_readme_status` (índice das 10 partes + nota da entrega ao monorepo),
`project_next_mission` (inventário de rotas backend + aprendizados P7–P10 + handoff monorepo),
`project_frontend_first_methodology`, `reference_backend_sample`, `feedback_presentation_model`
(pasta-por-par), `feedback_tailwind_v4`, `feedback_react19_types`, `feedback_ui_text_english`.

# AGENTS

<!-- checkpoint:pointer (managed) -->
**Doctrine / working rules** live in **[CLAUDE.md](./CLAUDE.md)** (branching, gates, frontend
patterns, docs-in-both-languages). **Resume / collaboration state** lives in
**[HANDOFF.md](./HANDOFF.md)** — read both first. State source of truth = HANDOFF; doctrine
source of truth = CLAUDE.md.

Project-level docs (backend-style): `README.md`/`README-pt-BR.md` (practical) +
`PROJECT.md`/`PROJECT-pt-BR.md` (architecture reference). The project + docs + `.env*` were
copied to `~/_Dev/samples/monorepo_sample/web/` — further monorepo work happens **there**.

This is a multi-part frontend setup tutorial: `TUTORIAL_01_setup.md` (Tailwind-only) → `TUTORIAL_02_shadcn.md`
(shadcn/ui) → `TUTORIAL_03_msw.md` (mock-first API with MSW) → `TUTORIAL_04_vitest.md` (unit tests with
Vitest) → `TUTORIAL_05_playwright.md` (e2e tests with Playwright, against MSW) → `TUTORIAL_06_backend.md`
(real backend auth) → `TUTORIAL_07_email_password.md` (email verification + password reset, two doors
each) → `TUTORIAL_08_gyms.md` (gyms search/nearby + create-gym ADMIN; the **sidebar** and the
**role guard** `RoleRoute`/`Forbidden` were born here) → `TUTORIAL_09_check_ins.md` (check-ins: check
in from the gym card, `/check-ins` history with ADMIN **Validate**, the empty Home became a
**dashboard** with a recharts activity chart, and the **email-gate demo** in the smoke) →
`TUTORIAL_10_edit_permissions.md` (account self-service incl. **email change**, and the **admin
area** `GET/PATCH /users` + `PATCH /gyms/:id` behind `RoleRoute`; Account lives as an icon button
in the **sidebar footer**). **✅ Tutorial COMPLETE — all 10 parts done & committed** (HEAD
`4655436`; tutorial guides renamed `README_*` → `TUTORIAL_NN_*`). **There is no Part 11.**
Anything further is an enhancement / derived project. The user executes manually, step by
step; plan each layout with the user before writing; **never push** (the user pushes). See
CLAUDE.md (doctrine) + HANDOFF.md (state) + the `project_readme_status` /
`project_next_mission` memory.
<!-- /checkpoint:pointer -->

# AGENTS

<!-- checkpoint:pointer (managed) -->
Resume / collaboration state lives in **[HANDOFF.md](./HANDOFF.md)** — read it first
(resume prompt + working agreement + current state). It is the portable source of truth.

This is a multi-part frontend setup tutorial: `README.md` (Tailwind-only) → `README_2_shadcn.md`
(shadcn/ui) → `README_3_msw.md` (mock-first API with MSW) → `README_4_vitest.md` (unit tests with
Vitest) → `README_5_playwright.md` (e2e tests with Playwright, against MSW) → `README_6_backend.md`
(real backend auth) → `README_7_email_password.md` (email verification + password reset, two doors
each) → `README_8_gyms.md` (gyms search/nearby + create-gym ADMIN; the **sidebar** and the
**role guard** `RoleRoute`/`Forbidden` were born here) → `README_9_check_ins.md` (check-ins: check
in from the gym card, `/check-ins` history with ADMIN **Validate**, the empty Home became a
**dashboard** with a recharts activity chart, and the **email-gate demo** in the smoke) →
`README_10_edit_permissions.md` (account self-service incl. **email change**, and the **admin
area** `GET/PATCH /users` + `PATCH /gyms/:id` behind `RoleRoute`; Account lives as an icon button
in the **sidebar footer**). **✅ Tutorial COMPLETE — all 10 parts done & committed** (HEAD
`b01e354`). **There is no Part 11.** Anything further is an enhancement / derived project. The user
executes manually, step by step; plan each layout with the user before writing; **never push** (the
user pushes). See HANDOFF.md + the `project_readme_status` / `project_next_mission` memory.
<!-- /checkpoint:pointer -->

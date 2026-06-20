# AGENTS

<!-- checkpoint:pointer (managed) -->
Resume / collaboration state lives in **[HANDOFF.md](./HANDOFF.md)** — read it first
(resume prompt + working agreement + current state). It is the portable source of truth.

This is a multi-part frontend setup tutorial: `README.md` (Tailwind-only) → `README_2_shadcn.md`
(shadcn/ui) → `README_3_msw.md` (mock-first API with MSW) → `README_4_vitest.md` (unit tests with
Vitest) → `README_5_playwright.md` (e2e tests with Playwright, against MSW) → `README_6_backend.md`
(real backend auth) → `README_7_email_password.md` (email verification + password reset, two doors
each) → `README_8_gyms.md` (gyms search/nearby + create-gym ADMIN; the **sidebar** and the
**role guard** `RoleRoute`/`Forbidden` were born here). **Parts 1–8 done.** Next: **Part 9** —
check-ins (`POST /gyms/:gymId/check-ins`, history, metrics, ADMIN validate) + the **email-gate demo**
(flag off → check-in works → flip on + restart → 403 → verify → works) + the empty **Home becomes a
light personal dashboard** (total check-ins + recent-activity mini chart, current backend only, no
all-time chart). Then **Part 10** (account self-service incl. email change + admin RBAC). See
HANDOFF.md resume prompt + the `project_next_mission` memory. The user executes it manually, step by
step; plan each layout with the user before writing.
<!-- /checkpoint:pointer -->

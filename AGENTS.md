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
**dashboard** with a recharts activity chart, and the **email-gate demo** in the smoke). **Parts
1–9 done, committed, pushed** (HEAD `ef302ba`). Next and **last: Part 10** — edit + permissions
(account self-service incl. **email change** `POST /auth/me/email` + confirm, and the **admin area**
`GET/PATCH /users`, `PATCH /gyms/:id`, all behind `RoleRoute`). The P9 smoke forced two backend
fixes now in `master`: check-in domain errors return **4xx** (not 500), and **CORS `methods`** now
allows PATCH/PUT/DELETE (Part 10 depends on this). See HANDOFF.md resume prompt + the
`project_next_mission` memory. The user executes it manually, step by step; plan each layout with
the user before writing.
<!-- /checkpoint:pointer -->

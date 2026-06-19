# AGENTS

<!-- checkpoint:pointer (managed) -->
Resume / collaboration state lives in **[HANDOFF.md](./HANDOFF.md)** — read it first
(resume prompt + working agreement + current state). It is the portable source of truth.

This is a multi-part frontend setup tutorial: `README.md` (Tailwind-only) → `README_2_shadcn.md`
(shadcn/ui) → `README_3_msw.md` (mock-first API with MSW) → `README_4_vitest.md` (unit tests with
Vitest) → `README_5_playwright.md` (e2e tests with Playwright, against MSW) → `README_6_backend.md`
(real backend auth) → `README_7_email_password.md` (email verification + password reset, two doors
each: in-app + link). **Parts 1–7 done.** Next: **Part 8** — gyms (search / nearby via geolocation /
create-gym ADMIN) and the **sidebar is born** in `app-layout` (role-gated items). Then P9 (check-ins)
and P10 (account editing + admin RBAC). See HANDOFF.md resume prompt + the `project_next_mission`
memory. The user executes it manually, step by step.
<!-- /checkpoint:pointer -->

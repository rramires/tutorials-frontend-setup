# CLAUDE.md — How to work on this repo

Instructions for AI assistants (and humans) contributing to this frontend.
Architecture lives in [PROJECT.md](PROJECT.md) / [PROJECT-pt-BR.md](PROJECT-pt-BR.md);
this file is about **process**.

## Before you start — approval & planning

- **Do not execute, edit, or commit anything until the user explicitly says
  so.** Discuss first; act only on an explicit go-ahead.
- **Plan the layout/approach _with_ the user before writing.** Ask **one
  question at a time**, in pt-BR, **no multiple-choice boxes** — a short
  conversational question. Resolve every open doubt before touching code.
- This started as a hand-executed tutorial; that collaborative, step-by-step
  rhythm is the default — propose, get the go-ahead, then act.

## Golden workflow (every change) — local, no PR

This is a sample/reference project: keep it simple. Work on a **local branch**,
commit per phase, and let the user own the merge and the push.

1. **Local branch per task**, off `master`. **Never commit code directly to
   `master`** — always branch first. Branches stay local until the user pushes.
    - **Exception — docs-only changes** (`README*`, `PROJECT*`, `CLAUDE.md`,
      `TUTORIAL_*`, with **no code**) may be committed straight to `master`.
2. **Commit per phase / per section** — one coherent step per commit, created
   **right after its gate passes**. Stage narrowly: `git add src` (plus
   `package.json`/lockfile when a dependency was installed, plus the spec file
   when you added an e2e test). Conventional Commits. Never batch unrelated work;
   never leave a finished phase uncommitted.
3. **Gate before every commit** (must be green):
    ```sh
    pnpm lint && pnpm build && pnpm test:run
    ```
    Changes that touch a user flow / route also run the e2e suite:
    ```sh
    pnpm e2e
    ```
4. **When the task is done, STOP and wait for the user.** The user tests the
   branch in the browser and authorizes the merge; only then merge locally
   (`git checkout master && git merge <branch>`).
    - **Only the user pushes.** Never run `git push` (not even
      `--force-with-lease`). After the user pushes and confirms, delete the local
      branch.

## Commit messages

Conventional Commits matching the change: `feat(account): …`, `fix(forms): …`,
`test: …`, `docs: …`, `chore: …`. The README/PROJECT docs get their **own**
`docs:` commit, separate from code. End every commit with:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Frontend patterns (must follow — details in PROJECT.md)

- **Presentation Model:** a component with logic is a pair — `x.tsx` (pure view)
  and `use-x-pm.ts` (state/data/formatting). Views carry no logic; trivial
  components stay single-file. Each pair lives in **its own same-named folder**
  (the `use-` prefix would otherwise sort the PM away from its view) — mandatory
  when an area holds more than one main component with a PM.
- **Context = 3 files:** `x-context.ts` + `x-provider.tsx` + `x-hooks.ts`. Use it
  for session/UI state (auth, theme, title) — **not** for server state.
- **Server state = TanStack Query** (`useQuery`/`useMutation` + invalidation),
  never hand-rolled fetch-in-effect for server data.
- **Component cascade:** shadcn/ui → Radix primitive + Tailwind → custom
  (Tailwind + `tailwind-variants`/`tailwind-merge`, see `ui-sample/`) → custom
  CSS in `global.css`. Never skip straight to custom CSS.
- **Mobile-first:** author Tailwind mobile-first; use `useIsMobile()` for
  responsive branches.
- **Tailwind v4:** config is **in CSS** (`global.css`) — there is **no**
  `tailwind.config.js`. The `dark:` variant needs
  `@custom-variant dark (&:is(.dark *))`. Packages are v4+ (`@tailwindcss/vite`,
  `tailwind-merge` v3, `tailwind-variants` v3).
- **React 19 typing:** use `React.SubmitEvent` (the old `FormEvent` is
  deprecated).
- **Zod 4:** the project is on `zod@^4` — the schema syntax differs from v3
  (some APIs / error-customization moved or were deprecated). Write v4 syntax and
  port deprecations when adapting older snippets.
- **Mock fidelity:** every `src/api/*.ts` has a matching
  `src/api/mocks/*-mock.ts` that mirrors the backend **verbatim** (status codes,
  `message` strings, pagination). Add/adjust both together; mind handler ordering
  in `mocks/index.ts` (static routes before dynamic `:param` ones).
- **Env:** every new `VITE_*` var goes to `.env.example` (with a comment) **and**
  to the Zod schema in `src/env.ts`. `VITE_*` is **public** (inlined into the
  bundle) — never a secret.

## UI text vs. prose language

- **User-visible text in the code is English** (labels, buttons, toasts, page
  titles, placeholders).
- **Tutorial/explanatory prose is pt-BR** (the `TUTORIAL_*` guides, and your
  conversation with the user). Don't mix the two: an English button in a
  Portuguese sentence is correct, a Portuguese label in the UI is not.

## Tests

- **Unit/component:** Vitest + Testing Library (happy-dom), specs **next to the
  code** (`src/**/*.spec.{ts,tsx}`); use `renderWithProviders` (`test/utils.tsx`).
- **E2E:** Playwright (Chromium) in `test/*.spec.ts`, auto-booting `pnpm dev:test`
  (MSW mock) on `:5001`.
- **Assert the seeded value of controlled fields** (Radix `Select`/`Switch`,
  `input-otp`), not just their presence. happy-dom + Playwright auto-wait can
  hide cold-load seeding bugs — finish risky form work with a **manual browser
  smoke** (see PROJECT.md §6 / §9.3 and `TUTORIAL_10`).

## Docs — always both languages

A doc change is incomplete until it lands in **all four** files:
`README.md` + `README-pt-BR.md`, `PROJECT.md` + `PROJECT-pt-BR.md` (and
`CLAUDE.md` when process changes). Keep them coherent (routes/pages table, env
table, folder tree, features). `PROJECT*.md` = architecture reference;
`README*.md` = setup + usage + smoke. **Finish every task with a docs review:**
re-read README + PROJECT (both languages) and confirm they still match the code
you touched — renamed/moved files and new routes are the usual source of drift.

## New features / flows — final manual verification

Beyond green gates, exercise the change **in the browser**:

```sh
pnpm dev:test    # mock mode, http://localhost:5001 — deterministic walkthrough
pnpm dev         # real-API mode, needs solid_api_sample on :3333 (+ seeded admin)
```

A route-/form-touching change is only "done" after a manual smoke in both modes
(at least mock), watching loading/empty/error states and controlled-field cold
loads.

## Architecture (quick reminder)

Views never call Axios; PMs never build JSX; wire shapes (snake_case) never leak
past `src/api` (mapped to camelCase models there). Build against the MSW mock
first — the real API is wired last. The access token is in memory only; the
httpOnly refresh cookie owns durability. Full details in `PROJECT.md`.

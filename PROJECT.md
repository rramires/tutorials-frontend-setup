# PROJECT.md — Frontend Architecture Reference

> Architecture reference for this example frontend. Serves as a **blueprint**
> for starting new, larger React apps that reuse the same structure, patterns
> (Presentation Model, Context, mock-first) and conventions. Written to be
> understood by both **humans** and **AIs** that will replicate the pattern.

> 🇧🇷 Versão em português: [PROJECT-pt-BR.md](PROJECT-pt-BR.md)

---

## 1. Overview

A "GymPass-style" single-page app (gyms, check-ins, account & admin) and the
**client** for the [`solid_api_sample`](../solid_api_sample) API. The domain is
secondary — what matters is the **replicable architecture**: a mock-first
workflow, a strict view/logic split (Presentation Model), Context for
cross-cutting state, and a typed data layer over a real REST API.

### Stack

| Concern         | Technology                                                           | Version |
| --------------- | -------------------------------------------------------------------- | ------- |
| UI library      | React                                                                | 19.2    |
| Language        | TypeScript                                                           | 6.0     |
| Build / dev     | Vite + `@vitejs/plugin-react`                                        | 8 / 6   |
| Styling         | Tailwind CSS (`@tailwindcss/vite`)                                   | 4.3     |
| Components      | shadcn/ui (style `radix-nova`) over `radix-ui`                       | 4 / 1.5 |
| Icons           | lucide-react                                                         | 1.18    |
| Routing         | React Router                                                         | 7.17    |
| Server state    | TanStack Query (`@tanstack/react-query`)                             | 5.10    |
| Forms           | React Hook Form + `@hookform/resolvers`                              | 7.79    |
| Validation      | Zod (**v4** — syntax differs from v3)                                | 4.4     |
| HTTP            | Axios                                                                | 1.18    |
| Toasts          | sonner                                                               | 2.0     |
| Charts          | Recharts                                                             | 3.8     |
| OTP input       | input-otp                                                            | 1.4     |
| Class utilities | clsx · tailwind-merge · tailwind-variants · class-variance-authority | —       |
| Font            | `@fontsource-variable/geist`                                         | 5.2     |
| API mocking     | MSW (`msw/browser`)                                                  | 2.14    |
| Unit tests      | Vitest + Testing Library + happy-dom                                 | 4 / 16  |
| E2E tests       | Playwright (Chromium)                                                | 1.61    |
| Lint / format   | ESLint 10 (flat) + Prettier 3.8 + simple-import-sort                 | —       |
| Package manager | pnpm                                                                 | 11.5    |

---

## 2. Architectural Principles

### 2.1 Mock-first (frontend-first)

Every screen is built and tested **before** the real backend is involved. For
each API endpoint there is:

- a thin client function in `src/api/<name>.ts` (the Axios call + DTO→model
  mapping), and
- an MSW handler in `src/api/mocks/<name>-mock.ts` that mirrors the backend
  **verbatim** — same status codes, same `message` strings, same pagination.

**The mock is the contract.** The UI, the unit suite and the e2e suite all run
green against the mock; swapping in the real API is just changing the Vite mode
(`VITE_API_URL`). When the backend ships, the mock is the spec it must satisfy.

### 2.2 Presentation Model (view / logic split)

Any component with logic is a **pair**:

- `x.tsx` — the **view**: pure JSX, props in, markup out. No `useState`, no data
  fetching, no formatting.
- `use-x-pm.ts` — the **Presentation Model**: all state, data (Query/Mutation),
  validation, derived/formatted values, event handlers. Returns a flat object
  the view spreads (`const pm = useXPM()`).

Trivial, logic-free components stay single-file. The split keeps views trivially
readable and the logic unit-testable in isolation. See `sign-in.tsx` +
`use-sign-in-pm.ts` for the canonical example.

**Folder per pair.** Because every PM is prefixed `use-`, a flat directory sorts
`use-x-pm.ts` alphabetically **away** from its `x.tsx`. So a component that has a
PM lives in **its own folder named after it** (`sign-in/sign-in.tsx` +
`sign-in/use-sign-in-pm.ts`), keeping the view and its model adjacent. This is
mandatory whenever an area holds **more than one** main component with a PM —
give each its own same-named folder, instead of letting all the `use-…-pm.ts`
files drift to the top of a shared directory, far from the views they belong to.

### 2.3 Context for cross-cutting state — the 3-file pattern

Global state that many screens read (auth, theme, page title) uses React
Context, split into **three files** so a provider component and its consumer
hook never share a module (keeps React Fast Refresh happy and the boundaries
clean):

- `x-context.ts` — `createContext` + the value/type definitions (no component).
- `x-provider.tsx` — the provider component: state, effects, the methods.
- `x-hooks.ts` — the `useX()` consumer (`useContext`).

Applied to `components/auth/`, `components/theme/`, `components/title/`. Server
state does **not** go here — that is TanStack Query's job (§4). Context holds
only session/UI state.

### 2.4 Component hierarchy (the cascade)

When a UI piece is needed, descend this ladder — never skip straight to custom
CSS (from `TUTORIAL_02_shadcn.md`):

1. First try a **shadcn/ui** component.
2. If it doesn't exist, use a **[Radix UI](https://www.radix-ui.com/primitives)**
   primitive and style it.
3. If Radix doesn't have it either, build it with **Tailwind**
   (+ `tailwind-merge` / `tailwind-variants`, as in `components/ui-sample/`).
4. As a last resort, custom CSS in **`global.css`**.

> shadcn/ui **is** Radix + Tailwind — its components are Radix primitives,
> pre-styled. So the cascade is just stepping down one level in the same stack.

### 2.5 Mobile-first

Tailwind utilities are authored mobile-first (unprefixed = small screens,
`sm:`/`md:`/`lg:` add up). `useIsMobile()` (`hooks/use-mobile.ts`, a
`useSyncExternalStore` over a `matchMedia` query, breakpoint 768px) drives
responsive behavior — e.g. the sidebar renders as a slide-over **Sheet** on
mobile and a fixed rail on desktop.

### 2.6 Dependency direction

```
pages / components (views)
        │  use
        ▼
   use-*-pm.ts (Presentation Models)         components/{auth,theme,title} (Context)
        │  call                                        │
        ▼                                              ▼
   src/api/*.ts (typed client)  ──────────────►  lib/api.ts (Axios + interceptors)
        │  (in test mode)                              │
        ▼                                              ▼
   src/api/mocks/* (MSW handlers)                 real backend (VITE_API_URL)
```

Views never call Axios directly; PMs never build JSX. The `src/api` layer is the
only place that knows wire shapes (snake_case) and maps them to app models
(camelCase).

---

## 3. Folder Structure

```
src/
├── main.tsx                 # entry: enableMSW().then(render(<App/>))
├── app.tsx                  # provider stack: Theme → Title → Query → Auth → Router + Toaster
├── routes.tsx               # React Router tree (Protected → AppLayout → RoleRoute)
├── env.ts                   # Zod-validated import.meta.env (fail-fast)
├── global.css               # Tailwind v4 entry + theme tokens + @custom-variant dark
├── api/
│   ├── <name>.ts            # one function per endpoint (Axios call + DTO→model map)
│   └── mocks/
│       ├── <name>-mock.ts   # MSW handler mirroring the backend route
│       ├── *-data.ts        # mutable in-memory mock state (users, gyms, check-ins)
│       ├── verified-state.ts# shared mock flag (email verification)
│       └── index.ts         # setupWorker(...handlers) + enableMSW() (test mode only)
├── components/
│   ├── auth/                # AuthContext/Provider/hooks · ProtectedRoute · RoleRoute · Forbidden · verify-email-banner/
│   ├── theme/               # ThemeContext/Provider/hooks · mode-toggle
│   ├── title/               # TitleContext/Provider · page-title (per-page document.title)
│   ├── app-sidebar/         # app-sidebar.tsx (view) + use-app-sidebar-pm.ts
│   ├── ui/                  # shadcn/ui components (generated; do not hand-edit casually)
│   └── ui-sample/           # cascade tier-3 reference: custom Tailwind + tailwind-variants
├── hooks/
│   ├── use-mobile.ts        # useIsMobile (matchMedia)
│   └── use-check-in.ts      # shared check-in mutation (geo + POST + invalidate)
├── lib/
│   ├── api.ts               # Axios instance + interceptors (token attach, 401 single-flight refresh)
│   ├── auth-store.ts        # in-memory access token (get/set/clear)
│   ├── react-query.ts       # the QueryClient singleton
│   ├── geolocation.ts       # getCurrentPosition wrapper (browser Geolocation API)
│   ├── check-in-activity.ts # derive the dashboard chart series from history
│   └── utils.ts             # cn() (clsx + tailwind-merge)
└── pages/
    ├── _layouts/            # app-layout/ · auth-layout · register-layout
    ├── app/                 # authed area: home/ (dashboard) · gyms/ · check-ins/ · account/ · new-gym/ · admin/users/(+user-edit/)
    ├── auth/                # sign-in/ · forgot-password/ · reset-password/ · verify-email/ · confirm-email-change/
    ├── register/
    ├── e404.tsx · error.tsx
```

### Naming conventions

- **View + PM pair:** `x.tsx` (view) + `use-x-pm.ts` (logic). Spec: `x.spec.tsx`
  next to them.
- **Context:** `x-context.ts` + `x-provider.tsx` + `x-hooks.ts`.
- **API client:** `src/api/<verb-noun>.ts` exporting `<verbNoun>()` (e.g.
  `get-profile.ts` → `getProfile`). Its mock: `src/api/mocks/<verb-noun>-mock.ts`
  exporting `<verbNoun>Mock`.
- **Shared data hook:** `src/hooks/use-x.ts` (not page-bound; reusable action).
- **Imports** are auto-sorted (`simple-import-sort`); the `@/` alias = `src/`.

---

## 4. Data & Request Flow

### 4.1 The Axios instance (`lib/api.ts`)

A single `api` instance with `baseURL = VITE_API_URL` and
`withCredentials: true` (sends/receives the refresh cookie). Interceptors:

1. **(dev only) artificial delay** — when `VITE_ENABLE_API_DELAY`, a 1–3 s delay
   per request to exercise loading states.
2. **token attach** — reads the in-memory access token (`auth-store`) and sets
   `Authorization: Bearer <token>`.
3. **401 refresh-and-replay** (response interceptor) — on a `401` (except on the
   auth routes themselves), it calls `PATCH /auth/refresh` **once**, stores the
   new token and replays the original request. Concurrent 401s share **one**
   refresh promise (single-flight) because the refresh cookie is single-use; if
   refresh fails, the token is cleared and the app redirects to `/sign-in`.

### 4.2 The typed client (`src/api/*.ts`)

One function per endpoint. It owns the **wire shape** and maps it to the app
model — e.g. `getProfile()` calls `GET /auth/me` and maps
`{ is_verified, … }` (snake_case DTO) → `{ isVerified, … }` (camelCase model).
Request bodies are typed (`SignInBody`, `UpdateUserBody`, …) and shared with the
matching mock so the mock can't drift from the client.

### 4.3 Server state — TanStack Query

- **Reads:** `useQuery({ queryKey, queryFn, enabled })`. Query keys are arrays
  namespaced by resource (`['gyms','nearby',coords]`, `['check-ins', …]`).
  `enabled` gates dependent fetches (e.g. nearby gyms wait for geolocation).
- **Writes:** `useMutation({ mutationFn })`; on success the relevant keys are
  **invalidated** so dependent screens refetch (e.g. a check-in invalidates
  `['check-ins']`, refreshing both the history and the dashboard).
- One `QueryClient` (`lib/react-query.ts`) provided at the app root. Tests build
  a throwaway no-retry client per render.
- **Local UI state** (form values, a wizard step, a search box) stays in
  `useState` inside the PM — Query is for **server** state only.

### 4.4 Error handling

PMs catch mutation errors and surface the backend's message via sonner:
`(isAxiosError(err) && err.response?.data?.message) || '<generic fallback>'`.
4xx responses carry a human `message` (mirrored by the mocks); 5xx falls back to
the generic string.

---

## 5. Auth & RBAC

### 5.1 Token model (anti-XSS)

- The **access token lives in memory only** (`lib/auth-store.ts`) — never in
  `localStorage`/`sessionStorage`. A page reload loses it on purpose.
- **Durability is the API's httpOnly refresh cookie**, which JavaScript cannot
  read. On boot the app calls `PATCH /auth/refresh` to mint a fresh access token
  from the cookie.

### 5.2 Silent boot & session lifecycle (`auth-provider.tsx`)

`AuthProvider` holds `{ status: 'loading'|'authed'|'guest', user }`:

- **boot:** try `refresh()` → `getProfile()`; success → `authed`; any failure →
  `guest` (silent, no error toast — a guest is normal).
- **signIn(token):** store token, load profile, go `authed`.
- **signOut():** call the API, then clear token + user → `guest`.
- **reloadUser():** refetch `/auth/me` to pick up server changes (e.g.
  `is_verified` flips to true after verifying — the banner clears with no
  re-login).

`useAuth()` (`auth-hooks.ts`) exposes this to any component.

### 5.3 Route guards

- **`ProtectedRoute`** (wraps the whole app area): `loading` → spinner;
  `guest` → `<Navigate to="/sign-in">`; `authed` → `<Outlet/>`.
- **`RoleRoute allow={[...]}`** (sits **inside** `ProtectedRoute`, so the user is
  already authed): renders the child route only if `user.role` is allowed;
  otherwise renders **`Forbidden` in place** — the surrounding `AppLayout`
  (sidebar/header) stays put, so it reads as "you can't see this panel," not a
  full-page error. The role comes from `useAuth()` (fresh from `/auth/me`),
  never from a decoded token.

### 5.4 Email-verification gate (UI side)

`GET /auth/me` returns `isVerified`. While `false`, `verify-email-banner`
prompts the user and the check-in action is blocked (or the `403` is handled).
After the user verifies (link/OTP), `reloadUser()` refetches `/auth/me` and the
banner clears — no re-login, mirroring the backend's fresh-from-DB read.

---

## 6. Forms

- **React Hook Form + Zod 4.** The Zod schema lives in the PM; `zodResolver` wires
  it to `useForm`. The view renders fields via `pm.register(...)` (or a
  `Controller` for controlled inputs like Radix `Select`/`Switch` and `input-otp`)
  and shows `pm.errors.<field>.message`.
    > **Zod is v4+** (`zod@^4`) — the schema syntax changed from v3 (e.g. some
    > APIs/error-customization moved or were deprecated). Write v4 syntax; when
    > copying snippets from older examples, port the deprecations.
- **Submit:** `handleSubmit(onSubmit)`; `onSubmit` runs the mutation, toasts
  success/error, navigates.
- **React 19 typing:** use `React.SubmitEvent` (not the deprecated `FormEvent`).

### Async-seeded forms — known gotchas (admin user-edit)

A form whose defaults arrive from an async fetch (the admin user-edit page) hit
real bugs that **only a manual browser smoke caught** — happy-dom renders Radix
values eagerly and Playwright's auto-wait waits transient bugs out. Preserve
these fixes when replicating (`TUTORIAL_10` has the full write-up):

1. **Seed via the `values` prop**, not `reset()` in a `useEffect` — `reset` leaves
   `Controller`-bound fields stale.
2. **Detect "field changed" with `dirtyFields.x`**, not `useWatch` — `useWatch`
   lags one render and false-positives, clobbering the seeded value.
3. **A controlled Radix `Select` goes stale across cross-user SPA navigation**
   (the `useForm` instance persists). Fix: `key={user.id}` (remount per user) +
   `defaultValue={field.value}` (uncontrolled seed), not a controlled `value`.
4. **A disabled Radix `Select` doesn't render its value** → for the self-edit
   read-only case, show a Badge instead of a disabled Select.

---

## 7. API Mocking (MSW)

- **Browser worker** (`msw/browser`), registered in `src/api/mocks/index.ts`:
  `setupWorker(...handlers)`; `enableMSW()` starts it **only when
  `MODE === 'test'`** (`pnpm dev:test` and Playwright). In real `dev`/`build`,
  the worker is dormant and Axios hits `VITE_API_URL`.
- **Handler ordering matters.** Static routes must be registered before dynamic
  ones that would shadow them — e.g. `GET /users/verify-email` and
  `/users/confirm-email-change` are registered **before** `GET /users/:userId`,
  or the `:userId` param handler swallows them.
- **Mock state** lives in `*-data.ts` modules (`users`, `gyms`, `check-ins`) as
  **mutable arrays**, so an edit in one screen is visible in the next request —
  the mock behaves like a tiny stateful backend. Helpers mirror the backend's
  guards (`requireAdmin` → 401/403).
- **Fidelity rule:** a handler must reproduce the backend's **exact** status
  codes and `message` strings (e.g. `"E-mail already exists."`,
  `"You cannot change your own role."`). The mock is the contract the e2e suite
  asserts against, so drift here is a real bug.
- `onUnhandledRequest: 'bypass'` — unmocked requests pass through (e.g. static
  assets).

---

## 8. Styling & Components

- **Tailwind CSS v4**, configured **in CSS** (`global.css`), no
  `tailwind.config.js`. The entry imports Tailwind, `tw-animate-css`,
  `shadcn/tailwind.css` and the Geist font, declares
  `@custom-variant dark (&:is(.dark *))` (the v4 way to wire the `dark:` variant
  to a `.dark` class), and maps design tokens under `@theme inline`.
- **Theme** (`components/theme/`): `ThemeProvider` toggles `.dark` on `<html>`
  and persists the choice (`localStorage`, key `vite-ui-theme`); `mode-toggle`
  is the switcher. Tokens are CSS variables, so light/dark is one class flip.
- **shadcn/ui** (`components.json`: style `radix-nova`, base color `neutral`, CSS
  variables) generates components into `components/ui/`. Treat them as owned
  source you may tweak, but prefer regenerating over hand-editing structure.
- **`cn()`** (`lib/utils.ts`) = `clsx` + `tailwind-merge` for conditional,
  conflict-free class merging. Custom variant-driven components use
  `tailwind-variants` (`tv`) — see `components/ui-sample/button.tsx` (cascade
  tier 3).

---

## 9. Tests

### 9.1 Unit / component (Vitest)

- Runner: Vitest + **happy-dom**, globals on, `setupFiles: test/setup.ts`
  (`@testing-library/jest-dom`). Glob: `src/**/*.spec.{ts,tsx}` — specs sit
  **next to the code**.
- `renderWithProviders` (`test/utils.tsx`) wraps the unit in a `MemoryRouter`
  (with an optional `route`) and a no-retry `QueryClient`.
- What's tested: PM logic, guard behavior (`role-route.spec`), page rendering and
  form rules (`*.spec.tsx`), pure lib functions (`check-in-activity.spec`).
- Coverage via `@vitest/coverage-v8` (`pnpm test:coverage`).

### 9.2 End-to-end (Playwright)

- Chromium project; specs in `test/*.spec.ts`; `baseURL: http://localhost:5001`.
- `webServer` auto-boots `pnpm dev:test` (MSW active in mode `test`) and reuses a
  running one locally. So **e2e runs entirely against the deterministic mock** —
  no backend, no network flakiness.
- `pree2e` frees port 5001 first; `pnpm e2e:ui` runs headed/slow-mo.

### 9.3 The blind spot (why manual smoke still matters)

happy-dom renders Radix `Select`/`Switch` values eagerly (no lazy portal), and
Playwright's auto-wait can wait out a transient navigation bug. Bugs in the
**cold-load seeded value** of controlled fields can pass both suites and only
appear in a **real browser**. Lesson: assert the **seeded value** of controlled
fields, and smoke-test cross-entity navigation by hand. See §6 and `TUTORIAL_10`.

---

## 10. Build & Tooling

- **Vite 8** (`vite.config.ts`): React plugin + Tailwind plugin; `@` → `src`
  alias; dev server on **3001**; the `test` block configures Vitest (happy-dom,
  coverage). `pnpm build` = `tsc -b` (type-check) then `vite build`.
- **TypeScript 6**, project references (`tsconfig.json` → `app`/`node`).
- **ESLint 10** flat config + `typescript-eslint`, `react-hooks`,
  `react-refresh`, `simple-import-sort`, `eslint-config-prettier`.
- **Prettier 3.8** (+ `prettier-plugin-curly`, `prettier-plugin-tailwindcss`);
  `pnpm check` / `pnpm format`.
- **Ports:** dev `3001`, mock/e2e `5001`, preview `4173`. `pnpm killapp` frees
  them.

---

## 11. Replicating a feature (step by step)

To add a screen backed by a new endpoint (e.g. "plans"):

1. **API client:** `src/api/get-plans.ts` — type the response, call `api.get`,
   map DTO → model.
2. **Mock:** `src/api/mocks/get-plans-mock.ts` mirroring the backend route
   (status codes + messages); add mock state in a `*-data.ts` if it mutates;
   register the handler in `mocks/index.ts` (mind ordering vs. dynamic routes).
3. **PM:** `src/pages/app/plans/use-plans-pm.ts` — `useQuery`/`useMutation`,
   derived values, handlers, any Zod form schema.
4. **View:** `src/pages/app/plans/plans.tsx` — pure markup consuming `pm`. Use
   the component cascade (§2.4); add a `PageTitle`.
5. **Route:** add it to `routes.tsx` under the right guard (`ProtectedRoute`,
   and `RoleRoute` if admin-only); add a sidebar entry if needed.
6. **Tests:** `plans.spec.tsx` (unit, `renderWithProviders`) and a
   `test/plans.spec.ts` e2e flow against the mock.
7. **Verify:** `pnpm lint && pnpm build && pnpm test:run && pnpm e2e`, then a
   manual browser smoke (§9.3).

> **Cross-cutting state?** If many screens need it, add a Context with the
> 3-file pattern (§2.3) — not a prop drilled through the tree, and not Query
> (Query is server state). If it's a reusable action, make a `src/hooks/use-x.ts`
> like `use-check-in`.

**Golden rule:** views never call Axios; PMs never build JSX; wire shapes never
leak past `src/api`. Build against the mock first; the real API is wired last.

---

## 12. Key Strengths (preserve these patterns)

- Mock-first: the UI and full test suite are green before the backend exists; the
  mock mirrors the contract verbatim.
- Strict view/logic split (Presentation Model) → readable views, testable logic.
- Context (3-file) for session/UI state; TanStack Query for server state — never
  mixed.
- Access token in memory only (anti-XSS); durability via the httpOnly refresh
  cookie; single-flight 401 refresh-and-replay.
- RBAC read fresh from `/auth/me`; `Forbidden` rendered in place, not trusted
  from a token.
- Typed `src/api` layer is the single place wire shapes (snake_case) map to app
  models (camelCase).
- Tailwind v4 (CSS-config) + shadcn cascade + token-based theming (one-class
  dark mode).
- Env validated on boot (fail-fast); two run modes from one codebase via Vite
  mode.
- Unit (happy-dom) + e2e (Playwright vs. MSW) suites — plus the documented
  manual-smoke discipline for controlled-field cold-load bugs.

# PROJECT.md — Arquitetura de Referência (Frontend)

> Documento de referência da arquitetura deste frontend-exemplo. Serve como
> **blueprint** para iniciar apps React maiores que reutilizam a mesma estrutura,
> os mesmos padrões (Presentation Model, Context, mock-first) e as mesmas
> convenções. Escrito para ser entendido tanto por **humanos** quanto por **IAs**
> que vão replicar o padrão.

> 🇺🇸 English version: [PROJECT.md](PROJECT.md)

---

## 1. Visão geral

Uma single-page app "estilo GymPass" (academias, check-ins, conta e admin) e o
**cliente** da API [`solid_api_sample`](../solid_api_sample). O domínio é
secundário — o que importa é a **arquitetura replicável**: um fluxo mock-first,
uma separação estrita view/lógica (Presentation Model), Context para estado
transversal e uma camada de dados tipada sobre uma API REST real.

### Stack

| Aspecto                | Tecnologia                                                           | Versão  |
| ---------------------- | -------------------------------------------------------------------- | ------- |
| Biblioteca de UI       | React                                                                | 19.2    |
| Linguagem              | TypeScript                                                           | 6.0     |
| Build / dev            | Vite + `@vitejs/plugin-react`                                        | 8 / 6   |
| Estilo                 | Tailwind CSS (`@tailwindcss/vite`)                                   | 4.3     |
| Componentes            | shadcn/ui (estilo `radix-nova`) sobre `radix-ui`                     | 4 / 1.5 |
| Ícones                 | lucide-react                                                         | 1.18    |
| Roteamento             | React Router                                                         | 7.17    |
| Estado de servidor     | TanStack Query (`@tanstack/react-query`)                             | 5.10    |
| Formulários            | React Hook Form + `@hookform/resolvers`                              | 7.79    |
| Validação              | Zod (**v4** — sintaxe difere da v3)                                  | 4.4     |
| HTTP                   | Axios                                                                | 1.18    |
| Toasts                 | sonner                                                               | 2.0     |
| Gráficos               | Recharts                                                             | 3.8     |
| Input de OTP           | input-otp                                                            | 1.4     |
| Utilitários de classe  | clsx · tailwind-merge · tailwind-variants · class-variance-authority | —       |
| Fonte                  | `@fontsource-variable/geist`                                         | 5.2     |
| Mock de API            | MSW (`msw/browser`)                                                  | 2.14    |
| Testes unitários       | Vitest + Testing Library + happy-dom                                 | 4 / 16  |
| Testes E2E             | Playwright (Chromium)                                                | 1.61    |
| Lint / format          | ESLint 10 (flat) + Prettier 3.8 + simple-import-sort                 | —       |
| Gerenciador de pacotes | pnpm                                                                 | 11.5    |

---

## 2. Princípios de arquitetura

### 2.1 Mock-first (frontend-first)

Toda tela é construída e testada **antes** de envolver o backend real. Para cada
endpoint da API existe:

- uma função fina de cliente em `src/api/<nome>.ts` (a chamada Axios + mapeamento
  DTO→modelo), e
- um handler MSW em `src/api/mocks/<nome>-mock.ts` que espelha o backend
  **fielmente** — mesmos status codes, mesmas strings de `message`, mesma
  paginação.

**O mock é o contrato.** A UI, a suíte unit e a suíte e2e rodam todas verdes
contra o mock; trocar pela API real é só mudar o mode do Vite (`VITE_API_URL`).
Quando o backend é entregue, o mock é a especificação que ele deve satisfazer.

### 2.2 Presentation Model (separação view / lógica)

Todo componente com lógica é um **par**:

- `x.tsx` — a **view**: JSX puro, props entram, markup sai. Sem `useState`, sem
  busca de dados, sem formatação.
- `use-x-pm.ts` — o **Presentation Model**: todo o estado, dados (Query/Mutation),
  validação, valores derivados/formatados, handlers de evento. Retorna um objeto
  plano que a view espalha (`const pm = useXPM()`).

Componentes triviais, sem lógica, permanecem em arquivo único. A separação deixa
as views trivialmente legíveis e a lógica testável isoladamente. Veja
`sign-in.tsx` + `use-sign-in-pm.ts` como exemplo canônico.

**Uma pasta por par.** Como todo PM tem o prefixo `use-`, um diretório plano
ordena o `use-x-pm.ts` alfabeticamente **longe** do seu `x.tsx`. Por isso um
componente que tem PM vive em **uma pasta própria com o nome dele**
(`sign-in/sign-in.tsx` + `sign-in/use-sign-in-pm.ts`), mantendo a view e seu
model adjacentes. Isso é obrigatório sempre que uma área tem **mais de um**
componente principal com PM — dê a cada um sua própria pasta de mesmo nome, em
vez de deixar todos os `use-…-pm.ts` migrarem para o topo de um diretório
compartilhado, longe das views a que pertencem.

### 2.3 Context para estado transversal — o padrão de 3 arquivos

Estado global que muitas telas leem (auth, tema, título da página) usa React
Context, dividido em **três arquivos** para que um componente provider e seu hook
consumidor nunca compartilhem um módulo (mantém o React Fast Refresh feliz e os
limites limpos):

- `x-context.ts` — `createContext` + definições de valor/tipo (sem componente).
- `x-provider.tsx` — o componente provider: estado, efeitos, os métodos.
- `x-hooks.ts` — o consumidor `useX()` (`useContext`).

Aplicado a `components/auth/`, `components/theme/`, `components/title/`. Estado de
servidor **não** vai aqui — esse é o trabalho do TanStack Query (§4). O Context
guarda só estado de sessão/UI.

### 2.4 Hierarquia de componentes (a cascata)

Quando uma peça de UI é necessária, desça esta escada — nunca pule direto para
CSS customizado (do `TUTORIAL_02_shadcn.md`):

1. Primeiro tente um componente do **shadcn/ui**.
2. Se não existir, use um primitivo do
   **[Radix UI](https://www.radix-ui.com/primitives)** e estilize.
3. Se o Radix também não tiver, construa com **Tailwind**
   (+ `tailwind-merge` / `tailwind-variants`, como em `components/ui-sample/`).
4. Em último caso, CSS customizado no **`global.css`**.

> shadcn/ui **é** Radix + Tailwind — seus componentes são primitivos do Radix já
> estilizados. Então a cascata é só descer um nível na mesma stack.

### 2.5 Mobile-first

Os utilitários Tailwind são escritos mobile-first (sem prefixo = telas pequenas,
`sm:`/`md:`/`lg:` somam). `useIsMobile()` (`hooks/use-mobile.ts`, um
`useSyncExternalStore` sobre uma query `matchMedia`, breakpoint 768px) dirige o
comportamento responsivo — ex.: a sidebar renderiza como um **Sheet** deslizante
no mobile e um rail fixo no desktop.

### 2.6 Direção das dependências

```
páginas / componentes (views)
        │  usam
        ▼
   use-*-pm.ts (Presentation Models)         components/{auth,theme,title} (Context)
        │  chamam                                       │
        ▼                                               ▼
   src/api/*.ts (cliente tipado)  ──────────────►  lib/api.ts (Axios + interceptors)
        │  (no modo test)                               │
        ▼                                               ▼
   src/api/mocks/* (handlers MSW)                  backend real (VITE_API_URL)
```

Views nunca chamam o Axios direto; PMs nunca constroem JSX. A camada `src/api` é o
único lugar que conhece os formatos de fio (snake_case) e os mapeia para os
modelos da app (camelCase).

---

## 3. Estrutura de pastas

```
src/
├── main.tsx                 # entrada: enableMSW().then(render(<App/>))
├── app.tsx                  # pilha de providers: Theme → Title → Query → Auth → Router + Toaster
├── routes.tsx               # árvore do React Router (Protected → AppLayout → RoleRoute)
├── env.ts                   # import.meta.env validado por Zod (fail-fast)
├── global.css               # entrada do Tailwind v4 + tokens de tema + @custom-variant dark
├── api/
│   ├── <nome>.ts            # uma função por endpoint (chamada Axios + map DTO→modelo)
│   └── mocks/
│       ├── <nome>-mock.ts   # handler MSW espelhando a rota do backend
│       ├── *-data.ts        # estado mutável do mock em memória (users, gyms, check-ins)
│       ├── verified-state.ts# flag compartilhada do mock (verificação de e-mail)
│       └── index.ts         # setupWorker(...handlers) + enableMSW() (só no modo test)
├── components/
│   ├── auth/                # AuthContext/Provider/hooks · ProtectedRoute · RoleRoute · Forbidden · verify-email-banner/
│   ├── theme/               # ThemeContext/Provider/hooks · mode-toggle
│   ├── title/               # TitleContext/Provider · page-title (document.title por página)
│   ├── app-sidebar/         # app-sidebar.tsx (view) + use-app-sidebar-pm.ts
│   ├── ui/                  # componentes shadcn/ui (gerados; não edite à mão sem necessidade)
│   └── ui-sample/           # referência do tier 3 da cascata: Tailwind custom + tailwind-variants
├── hooks/
│   ├── use-mobile.ts        # useIsMobile (matchMedia)
│   └── use-check-in.ts      # mutation de check-in compartilhada (geo + POST + invalidate)
├── lib/
│   ├── api.ts               # instância Axios + interceptors (anexa token, refresh single-flight no 401)
│   ├── auth-store.ts        # access token em memória (get/set/clear)
│   ├── react-query.ts       # o singleton QueryClient
│   ├── geolocation.ts       # wrapper getCurrentPosition (Geolocation API do navegador)
│   ├── check-in-activity.ts # deriva a série do gráfico do dashboard a partir do histórico
│   └── utils.ts             # cn() (clsx + tailwind-merge)
└── pages/
    ├── _layouts/            # app-layout/ · auth-layout · register-layout
    ├── app/                 # área autenticada: home/ (dashboard) · gyms/ · check-ins/ · account/ · new-gym/ · admin/users/(+user-edit/)
    ├── auth/                # sign-in/ · forgot-password/ · reset-password/ · verify-email/ · confirm-email-change/
    ├── register/
    ├── e404.tsx · error.tsx
```

### Convenções de nomenclatura

- **Par view + PM:** `x.tsx` (view) + `use-x-pm.ts` (lógica). Spec: `x.spec.tsx`
  ao lado.
- **Context:** `x-context.ts` + `x-provider.tsx` + `x-hooks.ts`.
- **Cliente de API:** `src/api/<verbo-substantivo>.ts` exportando
  `<verboSubstantivo>()` (ex.: `get-profile.ts` → `getProfile`). Seu mock:
  `src/api/mocks/<verbo-substantivo>-mock.ts` exportando `<verboSubstantivo>Mock`.
- **Hook de dados compartilhado:** `src/hooks/use-x.ts` (não preso a uma página;
  ação reutilizável).
- **Imports** são auto-ordenados (`simple-import-sort`); o alias `@/` = `src/`.

---

## 4. Fluxo de dados & requisição

### 4.1 A instância Axios (`lib/api.ts`)

Uma única instância `api` com `baseURL = VITE_API_URL` e `withCredentials: true`
(envia/recebe o cookie de refresh). Interceptors:

1. **(só em dev) delay artificial** — quando `VITE_ENABLE_API_DELAY`, um delay de
   1–3 s por requisição para exercitar os estados de loading.
2. **anexar token** — lê o access token em memória (`auth-store`) e seta
   `Authorization: Bearer <token>`.
3. **refresh-and-replay no 401** (interceptor de resposta) — num `401` (exceto nas
   próprias rotas de auth), chama `PATCH /auth/refresh` **uma vez**, guarda o novo
   token e refaz a requisição original. 401s concorrentes compartilham **uma**
   promise de refresh (single-flight) porque o cookie de refresh é de uso único;
   se o refresh falha, o token é limpo e a app redireciona para `/sign-in`.

### 4.2 O cliente tipado (`src/api/*.ts`)

Uma função por endpoint. Ela é dona do **formato de fio** e o mapeia para o modelo
da app — ex.: `getProfile()` chama `GET /auth/me` e mapeia
`{ is_verified, … }` (DTO snake_case) → `{ isVerified, … }` (modelo camelCase). Os
corpos de requisição são tipados (`SignInBody`, `UpdateUserBody`, …) e
compartilhados com o mock correspondente para que o mock não desvie do cliente.

### 4.3 Estado de servidor — TanStack Query

- **Leituras:** `useQuery({ queryKey, queryFn, enabled })`. As query keys são
  arrays com namespace por recurso (`['gyms','nearby',coords]`, `['check-ins', …]`).
  `enabled` controla buscas dependentes (ex.: academias próximas esperam a
  geolocalização).
- **Escritas:** `useMutation({ mutationFn })`; no sucesso as keys relevantes são
  **invalidadas** para as telas dependentes refazerem a busca (ex.: um check-in
  invalida `['check-ins']`, atualizando o histórico e o dashboard).
- Um `QueryClient` (`lib/react-query.ts`) provido na raiz da app. Os testes criam
  um client descartável sem retry por render.
- **Estado de UI local** (valores de formulário, um passo de wizard, uma caixa de
  busca) fica em `useState` dentro do PM — Query é só para estado de **servidor**.

### 4.4 Tratamento de erros

PMs capturam erros de mutation e exibem a mensagem do backend via sonner:
`(isAxiosError(err) && err.response?.data?.message) || '<fallback genérico>'`.
Respostas 4xx carregam uma `message` humana (espelhada pelos mocks); 5xx cai no
fallback genérico.

---

## 5. Auth & RBAC

### 5.1 Modelo de token (anti-XSS)

- O **access token vive só em memória** (`lib/auth-store.ts`) — nunca em
  `localStorage`/`sessionStorage`. Um reload da página o perde de propósito.
- **A durabilidade é o cookie httpOnly de refresh** da API, que o JavaScript não
  consegue ler. No boot a app chama `PATCH /auth/refresh` para cunhar um access
  token novo a partir do cookie.

### 5.2 Boot silencioso & ciclo de vida da sessão (`auth-provider.tsx`)

`AuthProvider` mantém `{ status: 'loading'|'authed'|'guest', user }`:

- **boot:** tenta `refresh()` → `getProfile()`; sucesso → `authed`; qualquer falha
  → `guest` (silencioso, sem toast de erro — ser visitante é normal).
- **signIn(token):** guarda o token, carrega o perfil, vai para `authed`.
- **signOut():** chama a API, depois limpa token + user → `guest`.
- **reloadUser():** refaz `/auth/me` para captar mudanças no servidor (ex.:
  `is_verified` vira true após verificar — o banner some sem novo login).

`useAuth()` (`auth-hooks.ts`) expõe isso a qualquer componente.

### 5.3 Guardas de rota

- **`ProtectedRoute`** (envolve toda a área da app): `loading` → spinner;
  `guest` → `<Navigate to="/sign-in">`; `authed` → `<Outlet/>`.
- **`RoleRoute allow={[...]}`** (fica **dentro** do `ProtectedRoute`, então o
  usuário já está autenticado): renderiza a rota filha só se `user.role` for
  permitido; senão renderiza **`Forbidden` no lugar** — o `AppLayout` ao redor
  (sidebar/header) permanece, então lê-se como "você não pode ver este painel",
  não um erro de página inteira. O papel vem de `useAuth()` (fresco de
  `/auth/me`), nunca de um token decodificado.

### 5.4 Gate de verificação de e-mail (lado da UI)

`GET /auth/me` retorna `isVerified`. Enquanto `false`, o `verify-email-banner`
avisa o usuário e a ação de check-in fica bloqueada (ou o `403` é tratado). Após o
usuário verificar (link/OTP), `reloadUser()` refaz `/auth/me` e o banner some —
sem novo login, espelhando a leitura fresca-do-banco do backend.

---

## 6. Formulários

- **React Hook Form + Zod 4.** O schema Zod vive no PM; `zodResolver` o conecta ao
  `useForm`. A view renderiza os campos via `pm.register(...)` (ou um `Controller`
  para inputs controlados como `Select`/`Switch` do Radix e `input-otp`) e mostra
  `pm.errors.<campo>.message`.
    > **Zod é v4+** (`zod@^4`) — a sintaxe dos schemas mudou em relação à v3 (ex.:
    > algumas APIs/customização de erro mudaram ou foram depreciadas). Escreva
    > sintaxe v4; ao copiar trechos de exemplos antigos, porte as depreciações.
- **Submit:** `handleSubmit(onSubmit)`; `onSubmit` roda a mutation, dá toast de
  sucesso/erro, navega.
- **Tipagem React 19:** use `React.SubmitEvent` (não o `FormEvent` depreciado).

### Formulários semeados de forma assíncrona — gotchas conhecidos (user-edit do admin)

Um formulário cujos defaults chegam de uma busca assíncrona (a página de edição de
usuário do admin) acertou bugs reais que **só um smoke manual no navegador
pegou** — happy-dom renderiza valores Radix de forma ávida e o auto-wait do
Playwright espera os bugs transitórios passarem. Preserve estas correções ao
replicar (o `TUTORIAL_10` tem o relato completo):

1. **Semeie pela prop `values`**, não com `reset()` num `useEffect` — `reset`
   deixa campos ligados a `Controller` desatualizados.
2. **Detecte "campo mudou" com `dirtyFields.x`**, não com `useWatch` — `useWatch`
   atrasa um render e dá falso-positivo, sobrescrevendo o valor semeado.
3. **Um `Select` Radix controlado fica desatualizado na navegação SPA entre
   usuários** (a instância `useForm` persiste). Correção: `key={user.id}`
   (remonta por usuário) + `defaultValue={field.value}` (semeadura não
   controlada), não um `value` controlado.
4. **Um `Select` Radix desabilitado não renderiza o valor** → para o caso de
   auto-edição somente-leitura, mostre um Badge em vez de um Select desabilitado.

---

## 7. Mock de API (MSW)

- **Worker de navegador** (`msw/browser`), registrado em `src/api/mocks/index.ts`:
  `setupWorker(...handlers)`; `enableMSW()` o inicia **somente quando
  `MODE === 'test'`** (`pnpm dev:test` e Playwright). Em `dev`/`build` real, o
  worker fica dormente e o Axios bate em `VITE_API_URL`.
- **A ordem dos handlers importa.** Rotas estáticas devem ser registradas antes
  das dinâmicas que as sombreariam — ex.: `GET /users/verify-email` e
  `/users/confirm-email-change` são registradas **antes** de `GET /users/:userId`,
  ou o handler do parâmetro `:userId` as engole.
- **Estado do mock** vive em módulos `*-data.ts` (`users`, `gyms`, `check-ins`)
  como **arrays mutáveis**, então uma edição numa tela é visível na próxima
  requisição — o mock se comporta como um backend stateful minúsculo. Helpers
  espelham as guardas do backend (`requireAdmin` → 401/403).
- **Regra de fidelidade:** um handler deve reproduzir os status codes e strings de
  `message` **exatos** do backend (ex.: `"E-mail already exists."`,
  `"You cannot change your own role."`). O mock é o contrato contra o qual a suíte
  e2e afere, então desvio aqui é bug real.
- `onUnhandledRequest: 'bypass'` — requisições não mockadas passam direto (ex.:
  assets estáticos).

---

## 8. Estilo & componentes

- **Tailwind CSS v4**, configurado **em CSS** (`global.css`), sem
  `tailwind.config.js`. A entrada importa o Tailwind, `tw-animate-css`,
  `shadcn/tailwind.css` e a fonte Geist, declara
  `@custom-variant dark (&:is(.dark *))` (o jeito v4 de ligar a variante `dark:` a
  uma classe `.dark`) e mapeia os tokens de design sob `@theme inline`.
- **Tema** (`components/theme/`): `ThemeProvider` alterna `.dark` no `<html>` e
  persiste a escolha (`localStorage`, key `vite-ui-theme`); `mode-toggle` é o
  alternador. Os tokens são variáveis CSS, então claro/escuro é uma troca de
  classe.
- **shadcn/ui** (`components.json`: estilo `radix-nova`, cor base `neutral`,
  variáveis CSS) gera componentes em `components/ui/`. Trate-os como código
  próprio que você pode ajustar, mas prefira regenerar a editar a estrutura à mão.
- **`cn()`** (`lib/utils.ts`) = `clsx` + `tailwind-merge` para merge de classes
  condicional e sem conflito. Componentes dirigidos por variantes usam
  `tailwind-variants` (`tv`) — veja `components/ui-sample/button.tsx` (tier 3 da
  cascata).

---

## 9. Testes

### 9.1 Unitário / componente (Vitest)

- Runner: Vitest + **happy-dom**, globals ligados, `setupFiles: test/setup.ts`
  (`@testing-library/jest-dom`). Glob: `src/**/*.spec.{ts,tsx}` — specs ficam **ao
  lado do código**.
- `renderWithProviders` (`test/utils.tsx`) envolve a unidade num `MemoryRouter`
  (com `route` opcional) e um `QueryClient` sem retry.
- O que é testado: lógica de PM, comportamento das guardas (`role-route.spec`),
  render de página e regras de formulário (`*.spec.tsx`), funções puras de lib
  (`check-in-activity.spec`).
- Cobertura via `@vitest/coverage-v8` (`pnpm test:coverage`).

### 9.2 Ponta-a-ponta (Playwright)

- Projeto Chromium; specs em `test/*.spec.ts`; `baseURL: http://localhost:5001`.
- O `webServer` sobe `pnpm dev:test` (MSW ativo no mode `test`) sozinho e reaproveita
  um já rodando localmente. Então o **e2e roda inteiramente contra o mock
  determinístico** — sem backend, sem flakiness de rede.
- `pree2e` libera a porta 5001 antes; `pnpm e2e:ui` roda headed/câmera-lenta.

### 9.3 O ponto cego (por que o smoke manual ainda importa)

happy-dom renderiza os valores de `Select`/`Switch` Radix de forma ávida (sem
portal lazy), e o auto-wait do Playwright pode esperar um bug transitório de
navegação passar. Bugs no **valor semeado em cold-load** de campos controlados
podem passar nas duas suítes e só aparecer num **navegador real**. Lição: afira o
**valor semeado** dos campos controlados e faça smoke da navegação entre entidades
na mão. Veja §6 e o `TUTORIAL_10`.

---

## 10. Build & tooling

- **Vite 8** (`vite.config.ts`): plugin do React + plugin do Tailwind; alias `@` →
  `src`; dev server na **3001**; o bloco `test` configura o Vitest (happy-dom,
  cobertura). `pnpm build` = `tsc -b` (type-check) depois `vite build`.
- **TypeScript 6**, project references (`tsconfig.json` → `app`/`node`).
- **ESLint 10** flat config + `typescript-eslint`, `react-hooks`,
  `react-refresh`, `simple-import-sort`, `eslint-config-prettier`.
- **Prettier 3.8** (+ `prettier-plugin-curly`, `prettier-plugin-tailwindcss`);
  `pnpm check` / `pnpm format`.
- **Portas:** dev `3001`, mock/e2e `5001`, preview `4173`. `pnpm killapp` as
  libera.

---

## 11. Replicando uma funcionalidade (passo a passo)

Para adicionar uma tela apoiada por um novo endpoint (ex.: "plans"):

1. **Cliente de API:** `src/api/get-plans.ts` — tipe a resposta, chame `api.get`,
   mapeie DTO → modelo.
2. **Mock:** `src/api/mocks/get-plans-mock.ts` espelhando a rota do backend (status
   codes + mensagens); adicione estado de mock num `*-data.ts` se ele mutar;
   registre o handler em `mocks/index.ts` (atente à ordem vs. rotas dinâmicas).
3. **PM:** `src/pages/app/plans/use-plans-pm.ts` — `useQuery`/`useMutation`,
   valores derivados, handlers, qualquer schema Zod de formulário.
4. **View:** `src/pages/app/plans/plans.tsx` — markup puro consumindo `pm`. Use a
   cascata de componentes (§2.4); adicione um `PageTitle`.
5. **Rota:** adicione em `routes.tsx` sob a guarda certa (`ProtectedRoute`, e
   `RoleRoute` se for só de admin); adicione uma entrada na sidebar se preciso.
6. **Testes:** `plans.spec.tsx` (unit, `renderWithProviders`) e um fluxo e2e
   `test/plans.spec.ts` contra o mock.
7. **Verifique:** `pnpm lint && pnpm build && pnpm test:run && pnpm e2e`, depois um
   smoke manual no navegador (§9.3).

> **Estado transversal?** Se muitas telas precisam dele, adicione um Context com o
> padrão de 3 arquivos (§2.3) — não uma prop arrastada pela árvore, e não Query
> (Query é estado de servidor). Se for uma ação reutilizável, faça um
> `src/hooks/use-x.ts` como o `use-check-in`.

**Regra de ouro:** views nunca chamam o Axios; PMs nunca constroem JSX; formatos
de fio nunca vazam além de `src/api`. Construa contra o mock primeiro; a API real
é ligada por último.

---

## 12. Pontos fortes (preserve estes padrões)

- Mock-first: a UI e a suíte de testes inteira ficam verdes antes do backend
  existir; o mock espelha o contrato fielmente.
- Separação estrita view/lógica (Presentation Model) → views legíveis, lógica
  testável.
- Context (3 arquivos) para estado de sessão/UI; TanStack Query para estado de
  servidor — nunca misturados.
- Access token só em memória (anti-XSS); durabilidade via o cookie httpOnly de
  refresh; refresh single-flight com replay no 401.
- RBAC lido fresco de `/auth/me`; `Forbidden` renderizado no lugar, não confiado
  de um token.
- A camada tipada `src/api` é o único lugar onde formatos de fio (snake_case)
  mapeiam para modelos da app (camelCase).
- Tailwind v4 (config em CSS) + cascata shadcn + tematização por tokens (dark mode
  numa classe).
- Env validado no boot (fail-fast); dois modos de execução de um só código via
  mode do Vite.
- Suítes unit (happy-dom) + e2e (Playwright vs. MSW) — mais a disciplina
  documentada de smoke manual para bugs de cold-load em campos controlados.

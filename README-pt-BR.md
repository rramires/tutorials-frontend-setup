# web — Frontend estilo GymPass

Aplicação single-page em React + TypeScript para o domínio estilo GymPass
(academias, check-ins, conta e admin). É o **cliente** da API
[`solid_api_sample`](../solid_api_sample) (Fastify/Prisma), construído
**mock-first**: cada tela é entregue contra um mock MSW que espelha o contrato
real da API, então a UI fica pronta e testada antes do backend ser ligado.

> 🇺🇸 English version: [README.md](README.md)

## Arquitetura

Para a referência completa de arquitetura (estrutura de pastas, os padrões
Presentation Model e Context, mobile-first, o método mock-first, fluxo de dados,
auth/RBAC, formulários, testes) consulte:

- [PROJECT.md](PROJECT.md) — English
- [PROJECT-pt-BR.md](PROJECT-pt-BR.md) — Português

Para **como trabalhar neste repositório** (branches, commits, gates, regras de
docs) veja [CLAUDE.md](CLAUDE.md).

**Stack:** React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · shadcn/ui
(Radix) · React Router 7 · TanStack Query 5 · React Hook Form + Zod 4 · MSW ·
Vitest · Playwright

> **Construído como tutorial.** Esta app foi montada passo a passo em dez guias —
> `TUTORIAL_01_setup.md` … `TUTORIAL_10_edit_permissions.md`. Eles são o "porquê"
> narrativo por trás de cada padrão documentado aqui; leia-os para o raciocínio,
> leia o `PROJECT.md` para a fotografia do estado atual.

## Funcionalidades

- **Mock-first / frontend-first** — cada endpoint tem um handler MSW em
  `src/api/mocks/` que espelha o backend **fielmente** (status codes, mensagens
  de erro, paginação). O mock **é o contrato**: a UI é construída e a suíte
  inteira fica verde antes de precisar da API real.
- **Dois modos de execução, um código** — `pnpm dev:test` roda contra o mock MSW
  no navegador (determinístico, sem backend); `pnpm dev` fala com a API real em
  `VITE_API_URL`. A chave é o **mode** do Vite (`test` liga o worker); nada mais
  muda.
- **Auth com boot silencioso** — o access token vive **só em memória** (anti-XSS);
  a durabilidade vem do **cookie httpOnly de refresh** da API. No carregamento a
  app faz refresh silencioso e restaura a sessão; um interceptor de 401
  (single-flight) faz refresh-and-replay de forma transparente.
- **RBAC na UI** — `ProtectedRoute` protege a área autenticada; `RoleRoute`
  protege as telas de admin e renderiza `Forbidden` **no lugar** (o layout
  permanece). O papel é lido fresco de `GET /auth/me`, nunca confiado de um token
  velho.
- **Gate de verificação de e-mail** — um usuário não verificado vê um banner e a
  ação de check-in fica bloqueada; ao verificar, o banner some sem novo login
  (`reloadUser` refaz `/auth/me`).
- **Self-service de conta** — edite seu próprio username; troque seu e-mail por um
  fluxo de confirmação (OTP **ou** link), espelhando o pattern A do backend (o
  endereço comprovado permanece até o novo ser confirmado).
- **Área admin** — tabela de usuários paginada, página dedicada de edição de
  usuário (username/email/role/`is_verified` com as regras do backend) e edição
  de academia a partir do card (Dialog).
- **Academias & check-ins** — academias próximas por geolocalização + busca por
  nome; check-in a partir do card; histórico de check-ins com **Validate** para
  ADMIN; a home é um **dashboard** com gráfico de atividade em Recharts.
- **Presentation Model** — toda tela com lógica é um par: `x.tsx` (view pura) +
  `use-x-pm.ts` (estado, dados, formatação). As views não carregam lógica. Cada
  par vive em **sua própria pasta de mesmo nome**, pra o PM (prefixo `use-`)
  ficar ao lado da view em vez de ser ordenado pra longe dela.
- **Mobile-first** — utilitários Tailwind mobile-first; a sidebar vira um Sheet
  em telas pequenas (`useIsMobile`).
- **Env tipado e validado** — `src/env.ts` faz parse de `import.meta.env` com Zod
  e **falha rápido** em má configuração, igual ao backend.
- **Testado** — specs unit/componente com Vitest + Testing Library (happy-dom) ao
  lado do código, e uma suíte e2e Playwright dirigindo o navegador real contra o
  mock MSW.

## Setup

```sh
pnpm install

# Modo mock — sem backend (mock MSW determinístico):
pnpm dev:test            # → http://localhost:5001

# Modo API real — precisa do solid_api_sample rodando na :3333:
cp .env.local.example .env.local   # ajuste VITE_API_URL (padrão http://localhost:3333)
pnpm dev                 # → http://localhost:3001
```

**Login de demonstração (modo mock):** qualquer email/username com a senha
`Password1!`. Entre como **`admin`** para receber um token de admin e alcançar as
telas protegidas por papel (New gym, Users); qualquer outro identificador é um
membro comum.

No modo API real, registre-se pela UI (ou entre como o ADMIN do seed — veja as
envs `ADMIN_*` do `solid_api_sample`). O CORS da API precisa liberar esta origem
e o método `PATCH` (por isso o backend define `methods` explicitamente).

## Scripts

| Comando              | Descrição                                                   |
| -------------------- | ----------------------------------------------------------- |
| `pnpm dev`           | Dev server contra a API **real** (`http://localhost:3001`)  |
| `pnpm dev:test`      | Dev server em modo **mock**, MSW ativo (`:5001`)            |
| `pnpm build`         | Type-check (`tsc -b`) + build de produção (Vite)            |
| `pnpm preview`       | Servir o build de produção localmente                       |
| `pnpm test`          | Testes unit/componente (Vitest, watch)                      |
| `pnpm test:run`      | Testes unit/componente uma vez (modo CI)                    |
| `pnpm test:coverage` | Testes unit + relatório de cobertura V8                     |
| `pnpm e2e`           | Suíte e2e Playwright (sobe `dev:test` na `:5001` sozinha)   |
| `pnpm e2e:ui`        | Playwright em modo UI (câmera lenta)                        |
| `pnpm lint`          | ESLint (flat config)                                        |
| `pnpm lint:fix`      | ESLint com `--fix`                                          |
| `pnpm check`         | Prettier check (`src`)                                      |
| `pnpm format`        | Prettier write (`src`)                                      |
| `pnpm killapp`       | Libera as portas 3001/5001/4173 + mata processos Playwright |

## Variáveis de ambiente

`import.meta.env` é validado por Zod em `src/env.ts` — a app **lança erro no
boot** se uma variável faltar ou estiver malformada. Todas as vars da app têm
prefixo `VITE_` e portanto são **embutidas no bundle do cliente** — são
**públicas**. Nunca coloque segredo aqui.

Arquivos (o Vite carrega por mode; arquivos posteriores vencem):

| Arquivo              | Commitado | Carregado em          | Propósito                                         |
| -------------------- | :-------: | --------------------- | ------------------------------------------------- |
| `.env`               |    ✅     | todos os modes        | Vars de UX da política de senha (espelham a API)  |
| `.env.example`       |    ✅     | —                     | Template do `.env`                                |
| `.env.test`          |    ✅     | `--mode test`         | Modo mock: `VITE_API_URL=/`, sem delay artificial |
| `.env.local`         |    ❌     | `dev`/`build` (local) | Config local da API real (`VITE_API_URL`, delay)  |
| `.env.local.example` |    ✅     | —                     | Template do `.env.local`                          |

| Variável                   | Obrigatória | Exemplo / padrão                     | Descrição                                                                  |
| -------------------------- | ----------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `VITE_API_URL`             | sim         | `http://localhost:3333` · `/` (mock) | Base URL que o Axios usa. `/` no modo test (o MSW intercepta tudo).        |
| `VITE_ENABLE_API_DELAY`    | não         | `true` (dev) · `false` (test)        | Injeta delay artificial de 1–3 s por requisição para exercitar loadings.   |
| `VITE_PASSWORD_MIN_LENGTH` | sim         | `8`                                  | Tamanho mínimo de senha no registro/reset (espelha `PASSWORD_MIN_LENGTH`). |
| `VITE_PASSWORD_PATTERN`    | sim         | `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)…$`  | Regex de complexidade de senha (espelha `PASSWORD_PATTERN`).               |
| `VITE_PASSWORD_MESSAGE`    | sim         | "Must include upper- and lowercase…" | Mensagem exibida quando a senha falha na regex de complexidade.            |

> As vars de política de senha são **validação de UX no frontend apenas** — a API
> revalida no servidor. Mantenha-as em sincronia com o `.env` do backend para que
> cliente e servidor concordem sobre o que é uma senha válida.

## Rotas da app (páginas)

`src/routes.tsx` monta a árvore com o React Router. A área autenticada fica atrás
de `ProtectedRoute` (redireciona visitantes para `/sign-in`) e usa `AppLayout`
(sidebar + header); telas de admin adicionam `RoleRoute allow={['ADMIN']}`.

| Caminho                       | Guarda            | Página             | Notas                                      |
| ----------------------------- | ----------------- | ------------------ | ------------------------------------------ |
| `/`                           | Protected         | Home               | Dashboard (métricas + gráfico Recharts)    |
| `/gyms`                       | Protected         | Gyms               | Próximas (geolocalização) + busca por nome |
| `/check-ins`                  | Protected         | CheckIns           | Histórico; ADMIN vê **Validate**           |
| `/account`                    | Protected         | Account            | Editar username · trocar e-mail (OTP/link) |
| `/gyms/new`                   | Protected + ADMIN | NewGym             | Criar academia                             |
| `/admin/users`                | Protected + ADMIN | AdminUsers         | Tabela de usuários paginada                |
| `/admin/users/:userId`        | Protected + ADMIN | UserEdit           | Editar username/email/role/`is_verified`   |
| `/sign-in`                    | público (auth)    | SignIn             |                                            |
| `/register`                   | público           | Register           |                                            |
| `/forgot-password`            | público (auth)    | ForgotPassword     |                                            |
| `/users/reset-password`       | público (auth)    | ResetPassword      | Token via `?token=` ou email + OTP         |
| `/users/verify-email`         | público (auth)    | VerifyEmail        | Landing do link (`?token=`) + OTP          |
| `/users/confirm-email-change` | público (auth)    | ConfirmEmailChange | Landing do link de troca de e-mail         |
| `*`                           | —                 | NotFound           | 404                                        |

O contrato da API que essas páginas consomem (rotas, papéis, formatos de erro)
está documentado no [README do `solid_api_sample`](../solid_api_sample/README.md).
O handler de mock de cada página em `src/api/mocks/` o espelha.

## Integração com o backend

- **Em dev (`pnpm dev`)** a app chama a API real em `VITE_API_URL`
  (padrão `http://localhost:3333`). Suba o `solid_api_sample` (`pnpm dev` +
  `pnpm seeddb`) antes.
- **CORS:** a API libera esta origem com `credentials:true` (necessário para o
  cookie de refresh) e lista `PATCH`/`PUT`/`DELETE` explicitamente — sem isso o
  preflight do navegador bloqueia todo `PATCH` (edições de conta/admin/academia).
- **Mapeamento de DTO:** as respostas da API são snake_case; a camada
  `src/api/*.ts` mapeia para os modelos camelCase da app (ex.: `is_verified` →
  `isVerified`). Campos Decimal (lat/long da academia) chegam como **strings** e
  são convertidos na camada de API.
- **Formato do auth:** o login retorna `{ token }` no corpo e seta o cookie
  httpOnly de refresh; `GET /auth/me` retorna `is_verified` e `role` frescos do
  banco, então o banner e a UI de RBAC reagem sem novo login.

## Testes

- **`pnpm test:run`** — Vitest + Testing Library (happy-dom). Specs de
  componente/PM/lib ficam **ao lado do código** (`src/**/*.spec.{ts,tsx}`). Um
  `renderWithProviders` compartilhado (`test/utils.tsx`) envolve a unidade num
  `MemoryRouter` + um `QueryClient` sem retry.
- **`pnpm e2e`** — Playwright (Chromium). Specs em `test/*.spec.ts`. A config sobe
  `pnpm dev:test` na `:5001` sozinha (MSW ativo), então o e2e roda contra o mock
  determinístico — sem backend, sem flakiness.

> **Ponto cego do mock.** happy-dom e o auto-wait do Playwright podem ambos
> esconder um bug real de cold-load em campos Radix controlados (um
> `Select`/`Switch` que semeia o valor de forma assíncrona). Alguns bugs só
> aparecem num **smoke manual no navegador** — veja o §Formulários do `PROJECT.md`
> e o callout do `TUTORIAL_10`.

## Verificação final

```sh
pnpm lint        # ESLint, sem erros
pnpm build       # type-check (tsc -b) + build de produção
pnpm test:run    # suíte unit/componente
pnpm e2e         # e2e Playwright (sobe o servidor de mock sozinho)
```

### Smoke manual (modo mock)

```sh
pnpm dev:test    # http://localhost:5001
```

1. Entre como `admin` / `Password1!` → cai no dashboard.
2. **Gyms** → permita a geolocalização → lista de próximas; busque por nome; faça
   check-in num card → toast + as métricas do dashboard atualizam.
3. **Check-ins** → o histórico mostra o check-in; como admin, **Validate** nele.
4. **Account** → renomeie seu username; inicie uma troca de e-mail → confirme com
   o OTP impresso pelo mock (ou a landing do link).
5. **Admin → Users** → abra um membro → mude role/`is_verified` → Save; confirme
   que a tabela reflete. Ao editar **você mesmo**, o papel vira um badge
   somente-leitura.
6. Entre como membro comum e confirme que `/admin/users` e `/gyms/new` renderizam
   **Forbidden** no lugar.

Para um smoke com **backend real**, rode `pnpm dev` contra o `solid_api_sample` e
percorra o mesmo fluxo (registre-se antes; verifique o e-mail pelo link/OTP
impresso no log do servidor da API).

## Licença

Distribuído sob a [Licença MIT](LICENSE).

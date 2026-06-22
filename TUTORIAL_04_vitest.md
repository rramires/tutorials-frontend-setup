# Tutorial Frontend Setup — Parte 4: testes unitários com Vitest

Continuação da Parte 3 (**TUTORIAL_03_msw.md**). Pré-requisito: o projeto até o final da Parte 3 — camada de API (axios), React Query, sonner, os formulários **sign-in** e **register** conectados (`useMutation` + toast + navigate) e o **MSW** mockando a API.

Agora que o app funciona com os mocks, vamos blindar os comportamentos com **testes automatizados**. Esta parte cobre os **testes unitários/de componente** com **Vitest** + **Testing Library** (DOM virtual via **happy-dom**). Os testes **end-to-end** (navegador real, Playwright) ficam pra **Parte 5**.

- **Vitest** como runner (reaproveita a config do Vite — zero setup duplicado)
- **Testing Library** (`@testing-library/react` + `user-event`) pra renderizar e interagir como um usuário
- **happy-dom** como DOM virtual (mais leve e rápido que jsdom)
- Um **helper de render** com os providers do app (React Query + Router)
- Specs de **componente** (`PageTitle`) e de **validação de formulário** (sign-in e register)
- **Cobertura** de código com o provider **v8**

**Onde isto entra no fluxo (mock-first):**

```
telas (P2) → MSW deixa clicável (P3) → testes garantem que não quebra (P4 unit, P5 e2e) → backend real (P6)
```

> **Unit x e2e — a fronteira.** Aqui testamos **a lógica da UI isolada**: a validação do Zod dispara antes de qualquer chamada de rede, então **nenhum teste desta parte toca a API**. O caminho feliz (preencher certo → request → toast → navegação) usa rede de verdade contra o MSW, e isso é trabalho da **Parte 5 (Playwright)**.

**O que vamos testar:**

| Spec                   | Arquivo                                    | Verifica                                   |
| ---------------------- | ------------------------------------------ | ------------------------------------------ |
| `PageTitle`            | `src/components/title/page-title.spec.tsx` | template aplicado / título padrão          |
| `SignIn` (validação)   | `src/pages/auth/sign-in/sign-in.spec.tsx`  | erros do Zod ao submeter inválido          |
| `Register` (validação) | `src/pages/register/register.spec.tsx`     | username/email/senha/confirmação inválidos |

---

### 1 - Instalando o Vitest e a Testing Library

- O **Vitest** lê a mesma `vite.config.ts` do projeto (mesmos plugins, mesmo alias `@`), então não há config duplicada. A **Testing Library** renderiza componentes num DOM virtual e oferece queries acessíveis (`getByRole`, `getByLabelText`), e o **`user-event`** simula interações reais (digitar, clicar).

1 - Instale as dependências de teste (todas em `devDependencies`):

```sh
pnpm add -D vitest happy-dom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
```

> **Pra que cada uma.** `vitest` = runner; `happy-dom` = DOM virtual; `@testing-library/react` = `render`/queries; `@testing-library/dom` = engine de queries (peer); `@testing-library/jest-dom` = matchers extras (`toBeInTheDocument`, `toHaveClass`…); `@testing-library/user-event` = interações de usuário.

2 - Crie a pasta dos arquivos de apoio de teste (setup, helpers — e, na Parte 5, os specs e2e):

```sh
mkdir test
```

> **Nota (pnpm 11).** Se aparecer um aviso `Ignored build scripts`, rode `pnpm approve-builds` e aprove. Nenhuma dessas libs costuma pedir build — mas o aviso é version-proof.

3 - Comite como:

```sh
git add .
git commit -m "chore: add vitest and testing-library"
git push
```

---

### 2 - Configurando o Vitest

- A config do Vitest vive **dentro da própria `vite.config.ts`**, numa chave `test`. Pra isso, troque o import do `defineConfig` de `vite` para **`vitest/config`** (é um superset — aceita a mesma config do Vite **mais** a chave `test`).

1 - Edite a **`vite.config.ts`**: troque a linha do import e adicione o bloco `test`.

```ts
import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vitest.dev/config/
export default defineConfig({
	server: {
		port: 3001,
	},
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./test/setup.ts'],
	},
})
```

> **O que cada opção faz.** `globals: true` deixa `describe`/`it`/`expect` disponíveis sem importar (estilo Jest); `environment: 'happy-dom'` dá um `document`/`window` virtual pra renderizar React; `setupFiles` roda um arquivo **antes de cada suíte** (vamos plugar os matchers ali).

2 - Vá na pasta test e crie **`setup.ts`** registrando os matchers do jest-dom no `expect` do Vitest:

```ts
import '@testing-library/jest-dom/vitest'
```

3 - Dois ajustes na **`tsconfig.app.json`**. Primeiro, o TypeScript precisa conhecer os globais (`describe`, `expect`…) — adicione **`vitest/globals`** aos `types`:

```json
"types": ["vite/client", "vitest/globals"],
```

Segundo, inclua a pasta **`test`** no `include` (hoje só tem `src`):

```json
"include": ["src", "test"]
```

> **Por que incluir `test`?** O `test/setup.ts` faz o _augmentation_ dos matchers do jest-dom no `expect` do Vitest. Se a pasta `test` ficar fora do `include`, esse augmentation não chega ao `tsc` — e o `pnpm build` (`tsc -b`) **quebra** com `Property 'toBeInTheDocument' does not exist` nos specs. Incluindo `test`, o setup é visto pelo programa todo e os matchers ficam tipados. (O `vite build` continua empacotando só o que parte do `main.tsx`; specs nunca entram no bundle.)

4 - Adicione os scripts de teste na **`package.json`** (em `scripts`):

```json
"test": "vitest",
"test:run": "vitest run",
```

> **`vitest` x `vitest run`.** `pnpm test` roda em **watch** (re-executa ao salvar — ótimo no dia a dia). `pnpm test:run` roda **uma vez e sai** (pra CI).

> **E o ESLint?** Não precisa mexer. O `typescript-eslint` já **desliga o `no-undef`** (o próprio TS valida globais), então `describe`/`it`/`expect` não viram "não definido" — mesmo a gente usando `globals: true`.

5 - Confira que o setup está de pé. Crie um teste-fumaça temporário só pra ver o runner rodar:

```sh
echo "import { expect, it } from 'vitest'
it('sanity', () => { expect(1 + 1).toBe(2) })" > test/sanity.test.ts
pnpm test:run
```

Deve passar (`1 passed`). Apague o arquivo de fumaça:

```sh
rm test/sanity.test.ts
```

6 - Rode o `pnpm lint` (verde) e comite como:

```sh
git add .
git commit -m "chore: configure vitest"
git push
```

---

### 3 - Primeiro spec: o componente `PageTitle`

- Vamos do mais simples: o `PageTitle` recebe um `title` e resolve contra o template do `TitleProvider` (`'%s | App'`) — ou cai no título padrão quando não recebe `title`. É lógica pura de apresentação, perfeita pra um primeiro teste.

- O React 19 **promove** a tag `<title>` renderizada pro `<head>` do documento, então a gente verifica o resultado em **`document.title`**.

1 - Vá na pasta src/components/title e crie o arquivo **`page-title.spec.tsx`** (specs ficam ao lado do componente):

```tsx
import { render } from '@testing-library/react'

import { PageTitle } from './page-title'
import { TitleProvider } from './title-provider'

describe('PageTitle', () => {
	it('applies the template when a title is given', () => {
		render(
			<TitleProvider titleTemplate='%s | My App' defaultTitle='My App'>
				<PageTitle title='Sign in' />
			</TitleProvider>,
		)

		expect(document.title).toBe('Sign in | My App')
	})

	it('falls back to the default title when none is given', () => {
		render(
			<TitleProvider titleTemplate='%s | My App' defaultTitle='My App'>
				<PageTitle />
			</TitleProvider>,
		)

		expect(document.title).toBe('My App')
	})
})
```

> **Por que envolver no `TitleProvider`?** O `PageTitle` lê `titleTemplate`/`defaultTitle` do contexto. Renderizar com o provider real (em vez de forjar um valor) deixa o teste fiel ao app.

2 - Rode os testes:

```sh
pnpm test:run
```

Devem passar 2 testes. (Dica: `pnpm test` deixa em watch enquanto você mexe.)

3 - Comite como:

```sh
git add .
git commit -m "test: add page-title unit test"
git push
```

---

### 4 - Um helper de render com os providers

- Os formulários **dependem de contexto**: o Presentation Model usa `useMutation` (precisa do `QueryClientProvider`) e `useNavigate` (precisa de um Router). Sem isso, `render(<SignIn />)` quebra na hora. Em vez de repetir os providers em cada spec, criamos **um helper** `renderWithProviders`.

1 - Vá na pasta test e crie o arquivo **`utils.tsx`**:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { type ReactElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router'

interface RenderOptions {
	route?: string
}

export function renderWithProviders(
	ui: ReactElement,
	{ route = '/' }: RenderOptions = {},
) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	})

	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<MemoryRouter initialEntries={[route]}>
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			</MemoryRouter>
		)
	}

	return render(ui, { wrapper: Wrapper })
}
```

> **Detalhes que importam.**
>
> - **`QueryClient` novo a cada render** (não o singleton de `src/lib/react-query.ts`): garante que o cache de um teste não vaze pro próximo.
> - **`retry: false`**: por padrão o React Query re-tenta queries que falham, o que deixaria os testes lentos e instáveis.
> - **`MemoryRouter`** (de `react-router` v7) simula a navegação em memória; `route` define a URL inicial.

2 - Comite como:

```sh
git add .
git commit -m "test: add render helper with providers"
git push
```

---

### 5 - Testando a validação do formulário de sign-in

- Agora um teste mais perto do usuário: renderizar o `SignIn`, **submeter inválido** e conferir que as mensagens do Zod aparecem. Como a validação falha antes de qualquer request, **não há rede envolvida**.

1 - Vá na pasta src/pages/auth/sign-in e crie **`sign-in.spec.tsx`**:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../../../../test/utils'
import { SignIn } from './sign-in'

describe('SignIn form', () => {
	it('shows validation errors when submitting empty', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SignIn />, { route: '/sign-in' })

		await user.click(screen.getByRole('button', { name: /sign in/i }))

		expect(
			await screen.findByText('Enter your email or username.'),
		).toBeInTheDocument()
		expect(
			await screen.findByText('Password is required.'),
		).toBeInTheDocument()
	})

	it('validates only the password when the identifier is filled', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SignIn />, { route: '/sign-in' })

		await user.type(screen.getByLabelText('Email or username'), 'johndoe')
		await user.click(screen.getByRole('button', { name: /sign in/i }))

		expect(
			await screen.findByText('Password is required.'),
		).toBeInTheDocument()
		expect(
			screen.queryByText('Enter your email or username.'),
		).not.toBeInTheDocument()
	})
})
```

> **`findBy` x `getBy` x `queryBy`.**
>
> - **`findByText`** é assíncrono (espera o elemento aparecer) — ideal pro erro que surge **depois** do submit.
> - **`getByRole`/`getByLabelText`** são síncronos e **falham se não acharem** — pra coisas que já estão na tela.
> - **`queryByText`** retorna `null` em vez de falhar — o jeito de afirmar que algo **não** existe (`.not.toBeInTheDocument()`).

> **Queries acessíveis.** `getByRole('button', { name: /sign in/i })` acha o botão pelo papel + texto; `getByLabelText('Email or username')` acha o input pela `<Label>` associada (o `htmlFor`/`id` que ligamos na Parte 2). Testar pela acessibilidade aproxima o teste do usuário real.

2 - Rode:

```sh
pnpm test:run
```

3 - Comite como:

```sh
git add .
git commit -m "test: add sign-in form validation test"
git push
```

---

### 6 - Testando a validação do formulário de register

- O register tem mais regras: username (3–30, `[a-z0-9_]`), email, senha (mínimo + complexidade via **env var**) e confirmação. Vamos cobrir três casos: submit vazio, senhas que não batem e senha fraca.

> **Env no Vitest.** O Vitest roda em `mode: test`, então o Vite carrega `.env` **+** `.env.test` — as vars `VITE_PASSWORD_*` (que o `use-register-pm.ts` lê) ficam disponíveis, sem config extra.

1 - Vá na pasta src/pages/register e crie **`register.spec.tsx`**:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../../../test/utils'
import { Register } from './register'

describe('Register form', () => {
	it('shows validation errors when submitting empty', async () => {
		const user = userEvent.setup()
		renderWithProviders(<Register />, { route: '/register' })

		await user.click(screen.getByRole('button', { name: /sign up/i }))

		expect(
			await screen.findByText('Minimum of 3 characters.'),
		).toBeInTheDocument()
		expect(
			await screen.findByText('Enter a valid email.'),
		).toBeInTheDocument()
	})

	it('rejects mismatched passwords', async () => {
		const user = userEvent.setup()
		renderWithProviders(<Register />, { route: '/register' })

		await user.type(screen.getByLabelText('Username'), 'john_doe')
		await user.type(screen.getByLabelText('Email'), 'john@example.com')
		await user.type(screen.getByLabelText('Password'), 'Password1!')
		await user.type(screen.getByLabelText('Confirm password'), 'Password2!')
		await user.click(screen.getByRole('button', { name: /sign up/i }))

		expect(
			await screen.findByText('Passwords do not match.'),
		).toBeInTheDocument()
	})

	it('rejects a weak password', async () => {
		const user = userEvent.setup()
		renderWithProviders(<Register />, { route: '/register' })

		await user.type(screen.getByLabelText('Username'), 'john_doe')
		await user.type(screen.getByLabelText('Email'), 'john@example.com')
		await user.type(screen.getByLabelText('Password'), 'password')
		await user.type(screen.getByLabelText('Confirm password'), 'password')
		await user.click(screen.getByRole('button', { name: /sign up/i }))

		expect(
			await screen.findByText(
				'Must include upper- and lowercase, a number and a special character.',
			),
		).toBeInTheDocument()
	})
})
```

> **Por que `'password'` (e não `'weak'`) no teste de senha fraca?** O Zod valida na ordem: tamanho **mínimo** → máximo → **regex** de complexidade. `'weak'` tem 4 caracteres e pararia no erro de tamanho ("Minimum of 8 characters."). `'password'` tem 8 (passa no tamanho) mas é tudo minúsculo → cai **no regex**, que é o que queremos checar.

> **`getByLabelText('Password')` é exato.** Por padrão a query casa o texto **completo** da label, então `'Password'` não colide com `'Confirm password'` — cada um acha seu input.

2 - Rode tudo:

```sh
pnpm test:run
```

Devem passar todos os specs (PageTitle + SignIn + Register).

3 - Comite como:

```sh
git add .
git commit -m "test: add register form validation test"
git push
```

---

### 7 - Cobertura de código (coverage)

- A **cobertura** mostra quais linhas/branches os testes exercitam. O Vitest usa o provider **v8** (nativo do Node, sem instrumentar o código).

> **Atenção à versão.** O `@vitest/coverage-v8` precisa ter o **mesmo major** do `vitest`. Instalar sem fixar versão já resolve isso (o pnpm casa o range).

1 - Instale o provider:

```sh
pnpm add -D @vitest/coverage-v8
```

2 - Adicione a chave `coverage` ao bloco `test` da **`vite.config.ts`**:

```ts
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./test/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['src/**/*.spec.{ts,tsx}', 'src/main.tsx', 'src/vite-env.d.ts'],
		},
	},
```

> **As opções.** `reporter: ['text', 'html']` imprime uma tabela no terminal **e** gera um relatório navegável em `coverage/index.html`; `include`/`exclude` focam no código de produção (fora os próprios specs, o entrypoint e os tipos).

3 - Adicione o script de cobertura na **`package.json`**:

```json
"test:coverage": "vitest run --coverage",
```

4 - O relatório HTML não vai pro git. Adicione ao **`.gitignore`**:

```sh
coverage
```

5 - O relatório também é **código gerado** — o ESLint não deve lintá-lo (igual fizemos com o worker do MSW na Parte 3). Adicione `coverage` ao `globalIgnores` da **`eslint.config.js`**:

```js
globalIgnores(['dist', 'coverage', 'public/mockServiceWorker.js']),
```

> **Por quê.** O reporter `html` gera `coverage/*.js` (`prettify.js`, `sorter.js`…). Sem ignorar, `pnpm lint` passa a acusar avisos nesses arquivos e nunca mais fica limpo. O `.gitignore` tira do git; o `globalIgnores` tira do ESLint.

6 - Rode:

```sh
pnpm test:coverage
```

Você verá a tabela de cobertura no terminal. Abra `coverage/index.html` no navegador pra explorar linha a linha.

7 - Rode o `pnpm lint` (verde) e comite como:

```sh
git add .
git commit -m "chore: add test coverage with v8"
git push
```

---

## Resumo

Nesta parte você:

- Configurou o **Vitest** reusando a `vite.config.ts` (happy-dom + globais + setup do jest-dom)
- Criou um **helper `renderWithProviders`** (React Query + Router) pros componentes que dependem de contexto
- Escreveu specs de **componente** (`PageTitle`) e de **validação de formulário** (sign-in e register)
- Habilitou **cobertura** com o provider v8

Os testes garantem que a **lógica da UI** não regride. O que falta é validar o **fluxo completo no navegador** (preencher → submeter → toast → navegar) ponta a ponta.

**Próxima parte (Parte 5 — `TUTORIAL_05_playwright.md`):** testes **end-to-end com Playwright**, rodando o app de verdade contra o **MSW** (via `pnpm dev:test` na porta 5001), simulando o usuário do começo ao fim.

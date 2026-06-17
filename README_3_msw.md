# Tutorial Frontend Setup — Parte 3: API mockada com MSW

Continuação da Parte 2 (**README_2_shadcn.md**). Pré-requisito: o projeto até o final da Parte 2 — shadcn/ui, tema claro/escuro, layouts em tokens e os formulários **sign-in** e **register** com React Hook Form + Zod no padrão Presentation Model (hoje só fazem `console.log`).

Nesta parte vamos deixar o app **funcional sem backend**, no estilo **mock-first**: o cliente clica e usa as telas de verdade, e a gente valida o fluxo antes de existir uma API real.

- **Variáveis de ambiente validadas** com Zod (`src/env.ts`) + `.env.local` (dev) e `.env.test` (mock)
- **Cliente HTTP** (axios) e uma **camada de API** tipada, espelhando o backend de exemplo
- **React Query** (TanStack) para as chamadas (mutations)
- **Feedback** com **sonner** (toasts de sucesso/erro)
- **MSW** (Mock Service Worker) interceptando as chamadas e respondendo como o backend

**A ideia (mock-first):**

```
telas (Parte 2) → MSW deixa clicável/realista → validar o fluxo → só então mexer no backend real (Parte 5)
```

> **Por que isto importa.** As telas viram **mockups funcionais**: o cliente valida o que enxerga e clica, não um contrato de API. Mudar um mock custa minutos; mudar o backend custa migration. O backend só implementa o que já foi validado.

**O contrato que vamos espelhar** (do backend de exemplo `solid_api_sample`):

| Endpoint           | Body                            | Sucesso                    | Erro              |
| ------------------ | ------------------------------- | -------------------------- | ----------------- |
| `POST /auth/login` | `{ identifier, password }`      | `200 { token }` (+ cookie) | `401 { message }` |
| `POST /users`      | `{ username, email, password }` | `201 { user }`             | `409 { message }` |

> O mock vira o **contrato de fato**. Mantenha os tipos/respostas espelhando o backend — senão "passa no MSW, quebra no real".

---

### 1 - Variáveis de ambiente e validação (env.ts)

- Na Parte 2 já criamos um `.env` com a política de senha (`VITE_PASSWORD_*`). Agora precisamos de mais duas: a **URL da API** e um **liga/desliga de delay** (pra simular rede lenta). E vamos **centralizar e validar** tudo num único módulo com Zod, em vez de ler `import.meta.env` espalhado.

- A sacada do mock-first mora aqui: a URL da API muda **por modo**.

    - **`pnpm dev`** (modo `development`) → app fala com o **backend real** (`http://localhost:3333`).
    - **`pnpm dev:test`** (modo `test`) → MSW intercepta tudo, então a URL é só `/`.

1 - Siga o padrão do projeto (`.env.example` → `.env` da Parte 2): crie primeiro o **template comentado**, depois o arquivo real. Comece pelo **`.env.local.example`** (config de **dev**, vai pro git):

```sh
# Dev config (local backend). Copy to .env.local and adjust.
# NOTE: VITE_* vars are PUBLIC — never put secrets here.

# Base URL of the API the app talks to in `pnpm dev`.
VITE_API_URL=http://localhost:3333

# Artificial network delay on every request (UX testing). Off in test mode.
VITE_ENABLE_API_DELAY=true
```

2 - Copie pro **`.env.local`** real (config de dev usada de fato; gitignored, **não** vai pro git):

```sh
cp .env.local.example .env.local
```

3 - Crie o **`.env.test`** (config de **mock**, modo `test`). Esse **vai pro git** — é a config determinística que todo mundo usa nos testes —, então já leva os comentários (dispensa um `.env.test.example` à parte):

```sh
# Test/mock config — used by `pnpm dev:test` and Playwright (mode: test).
# Committed on purpose: the deterministic mock setup everyone shares.

# Relative root: MSW intercepts every request, no real server.
VITE_API_URL=/

# No artificial delay — fast, deterministic tests.
VITE_ENABLE_API_DELAY=false
```

> **Como o Vite escolhe.** Ele carrega `.env` (todos os modos) → `.env.local` (todos, gitignored) → `.env.[mode]` (só naquele modo, **maior prioridade**). No modo `test`, o `.env.test` sobrescreve a `VITE_API_URL` do `.env.local`. A política de senha fica no `.env` (vale em todos os modos).

4 - O **`.gitignore`** já cobre tudo certo (da Parte 2): `*.local` ignora o `.env.local`, e `.env` está listado. O **`.env.local.example`** e o **`.env.test`** **não** são ignorados — vão pro git. Confirme as linhas:

```sh
# (já existem) — .env e qualquer *.local ficam de fora
.env
.env.*.local
*.local
```

5 - Atualize o **`src/vite-env.d.ts`** com as duas vars novas (todo `VITE_*` chega como **string**):

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string
	readonly VITE_ENABLE_API_DELAY: string
	readonly VITE_PASSWORD_MIN_LENGTH: string
	readonly VITE_PASSWORD_PATTERN: string
	readonly VITE_PASSWORD_MESSAGE: string
}
interface ImportMeta {
	readonly env: ImportMetaEnv
}
```

6 - Crie **`env.ts`** em src — a **fonte única e validada** do ambiente. O Zod faz o parse no boot: se faltar uma var ou vier malformada, o app falha **cedo e com erro claro** (melhor que `undefined` vazando pelo código). E já converte os tipos (`string` → `number`/`boolean`).

```ts
import { z } from 'zod'

const envSchema = z.object({
	MODE: z.enum(['production', 'development', 'test']),
	VITE_API_URL: z.string(),
	VITE_ENABLE_API_DELAY: z.string().transform((value) => value === 'true'),
	VITE_PASSWORD_MIN_LENGTH: z.coerce.number(),
	VITE_PASSWORD_PATTERN: z.string(),
	VITE_PASSWORD_MESSAGE: z.string(),
})

export const env = envSchema.parse(import.meta.env)
```

- `MODE` é a var embutida do Vite (`development`/`test`/`production`) — vai gatilhar o MSW lá na frente.
- `VITE_ENABLE_API_DELAY` vira **boolean** de verdade (no `.env` é a string `"true"`/`"false"`).
- `VITE_PASSWORD_MIN_LENGTH` vira **number** (`z.coerce.number()`), então some o `Number(...)` manual.

7 - Refatore o **`src/pages/register/use-register-pm.ts`** pra ler do `env` validado em vez de `import.meta.env` cru. Troque só o topo do arquivo:

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { env } from '@/env'

const passwordMin = env.VITE_PASSWORD_MIN_LENGTH
const passwordPattern = new RegExp(env.VITE_PASSWORD_PATTERN)
const passwordMessage = env.VITE_PASSWORD_MESSAGE
```

- O resto do hook (`registerForm`, `useRegisterPM`) continua igual por enquanto — conectamos no backend mockado na seção 4.

8 - **Reinicie o `pnpm dev`** (o Vite só lê os `.env` no boot) e confira que nada quebrou: a validação do register continua funcionando.

9 - Comite como:

```sh
git add .
git commit -m "feat: add validated env config (env.ts)"
git push
```

---

### 2 - Cliente HTTP e camada de API

- Toda chamada vai passar por uma instância única do **axios** (com a `baseURL` do ambiente). E cada endpoint do backend vira uma **função tipada** numa pasta `api/` — assim os tipos do request/response ficam num lugar só (é o nosso pedaço do "contrato").

1 - Instale o axios:

```sh
pnpm add axios
```

2 - Na pasta **`src/lib`** crie o **`api.ts`** — a instância do axios:

```ts
import axios from 'axios'

import { env } from '@/env'

export const api = axios.create({
	baseURL: env.VITE_API_URL,
	withCredentials: true,
})

if (env.VITE_ENABLE_API_DELAY) {
	api.interceptors.request.use(async (config) => {
		await new Promise((resolve) =>
			setTimeout(resolve, 1000 + Math.round(Math.random() * 2000)),
		)

		return config
	})
}
```

- `baseURL` vem do `env`: `http://localhost:3333` no dev, `/` no modo test (MSW intercepta).
- `withCredentials: true` deixa o cookie de auth (que o backend manda no login) viajar nas requisições.
- O **interceptor de delay** só liga quando `VITE_ENABLE_API_DELAY` é `true` (dev) — atrasa cada request 1–3s pra você ver os estados de loading. No modo test fica desligado (testes rápidos).

3 - Crie a pasta **`src/api`** pras funções de cada endpoint:

```sh
mkdir src/api
```

Nela crie **`sign-in.ts`** (espelha `POST /auth/login`):

```ts
import { api } from '@/lib/api'

export interface SignInBody {
	identifier: string
	password: string
}

export interface SignInResponse {
	token: string
}

export async function signIn({ identifier, password }: SignInBody) {
	const response = await api.post<SignInResponse>('/auth/login', {
		identifier,
		password,
	})

	return response.data
}
```

4 - Crie em src/api também **`register.ts`** (espelha `POST /users`; a função se chama `registerAccount` pra não colidir com o `register` do React Hook Form):

```ts
import { api } from '@/lib/api'

export interface RegisterAccountBody {
	username: string
	email: string
	password: string
}

export async function registerAccount({
	username,
	email,
	password,
}: RegisterAccountBody) {
	await api.post('/users', { username, email, password })
}
```

- Repare: o form tem `confirmPassword`, mas a função **não** manda esse campo — só o que o backend espera (`username`, `email`, `password`).

5 - Comite como:

```sh
git add .
git commit -m "feat: add axios HTTP client and API layer"
git push
```

---

### 3 - Providers: React Query e Toaster

- As chamadas vão passar pelo **React Query** (TanStack): ele cuida de estados (`isPending`/`isError`), cache e retries sem a gente escrever isso à mão. E o **sonner** dá o feedback visual (toast de sucesso/erro) que o cliente — e depois o Playwright — enxergam.

1 - Instale o React Query:

```sh
pnpm add @tanstack/react-query
```

2 - Crie em src/lib **`react-query.ts`** com o client:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()
```

3 - Instale o **sonner** via shadcn (traz o componente `Toaster` pra dentro do projeto):

```sh
pnpm dlx shadcn@latest add sonner
```

4 - O `Toaster` gerado pelo shadcn assume a lib **`next-themes`** pra saber o tema atual — mas a gente **já tem** o nosso `ThemeProvider` (Parte 2).
Abra o **`src/components/ui/sonner.tsx`** e troque a fonte do tema pelo nosso hook:

```tsx
import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { useTheme } from '@/components/theme/theme-hooks'

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme } = useTheme()

	return (
		<Sonner
			theme={theme as ToasterProps['theme']}
			className='toaster group'
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)',
				} as React.CSSProperties
			}
			{...props}
		/>
	)
}

export { Toaster }
```

- A única mudança real é o `import { useTheme }`: sai o `next-themes`, entra o nosso `theme-hooks`. O resto é o que o shadcn gerou.
- Se o `shadcn add` tiver instalado o `next-themes` junto(confira no package.json), pode remover (não usamos): `pnpm remove next-themes`.

5 - Envolva o app com os dois providers no **`src/app.tsx`**  
O `QueryClientProvider` por dentro, e o `Toaster` montado junto do router:

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'

import { Toaster } from '@/components/ui/sonner'

import { ThemeProvider } from './components/theme/theme-provider'
import { TitleProvider } from './components/title/title-provider'
import { queryClient } from './lib/react-query'
import { router } from './routes'

export function App() {
	return (
		<ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
			<TitleProvider
				titleTemplate='%s | FrontEnd'
				defaultTitle='FrontEnd'
			>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
					<Toaster richColors />
				</QueryClientProvider>
			</TitleProvider>
		</ThemeProvider>
	)
}
```

- `richColors` deixa o sonner pintar sucesso (verde) e erro (vermelho) automaticamente.

6 - Comite como:

```sh
git add .
git commit -m "feat: add React Query and sonner providers"
git push
```

---

### 4 - Conectando os formulários

- Agora os hooks dos forms deixam de fazer `console.log` e passam a chamar a API via **`useMutation`**. No sucesso: toast verde + navega. No erro: toast vermelho com a mensagem que o backend (mockado) devolveu.

1 - Reescreva **`src/pages/auth/sign-in/use-sign-in-pm.ts`**:

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { signIn } from '@/api/sign-in'

const signInForm = z.object({
	identifier: z.string().min(1, 'Enter your email or username.'),
	password: z
		.string()
		.min(1, 'Password is required.')
		.max(72, 'Maximum of 72 characters.'),
})

type SignInForm = z.infer<typeof signInForm>

export function useSignInPM() {
	const navigate = useNavigate()

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignInForm>({
		resolver: zodResolver(signInForm),
	})

	const { mutateAsync: authenticate } = useMutation({
		mutationFn: signIn,
	})

	async function onSubmit(data: SignInForm) {
		try {
			await authenticate(data)
			toast.success('Signed in successfully.')
			navigate('/')
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not sign in.'
			toast.error(message)
		}
	}

	return {
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}
```

- O `handleSubmit` do RHF aguarda o `onSubmit` async, então o `isSubmitting` (que já desabilita o botão) cobre o tempo da requisição — não precisa do `isPending` da mutation.
- `isAxiosError` estreita o erro pra ler `response.data.message` (o `{ message }` que o backend devolve no 401).

2 - Reescreva **`src/pages/register/use-register-pm.ts`** (mantém a validação da Parte 2, agora lendo do `env`, e conecta a mutation):

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { registerAccount } from '@/api/register'
import { env } from '@/env'

const passwordMin = env.VITE_PASSWORD_MIN_LENGTH
const passwordPattern = new RegExp(env.VITE_PASSWORD_PATTERN)
const passwordMessage = env.VITE_PASSWORD_MESSAGE

const registerForm = z
	.object({
		username: z
			.string()
			.min(3, 'Minimum of 3 characters.')
			.max(30, 'Maximum of 30 characters.')
			.regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscore only.')
			.transform((s) => s.toLowerCase()),
		email: z.email('Enter a valid email.'),
		password: z
			.string()
			.min(passwordMin, `Minimum of ${passwordMin} characters.`)
			.max(72, 'Maximum of 72 characters.')
			.regex(passwordPattern, passwordMessage),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match.',
		path: ['confirmPassword'],
	})

type RegisterForm = z.infer<typeof registerForm>

export function useRegisterPM() {
	const navigate = useNavigate()

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterForm>({
		resolver: zodResolver(registerForm),
	})

	const { mutateAsync: createAccount } = useMutation({
		mutationFn: registerAccount,
	})

	async function onSubmit({ username, email, password }: RegisterForm) {
		try {
			await createAccount({ username, email, password })
			toast.success('Account created. You can sign in now.')
			navigate('/sign-in')
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not create account.'
			toast.error(message)
		}
	}

	return {
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}
```

- As telas (`sign-in.tsx`/`register.tsx`) **não mudam** — continuam consumindo `pm.register`, `pm.errors`, `pm.isSubmitting`, `pm.handleSubmit`.

> Nesse ponto o submit **ainda não funciona**: não há backend rodando e o MSW não está montado. Sem isso, em modo dev o axios bate em `localhost:3333` (nada lá) e cai no toast de erro. Resolvemos na próxima seção com os mocks.

3 - Comite como:

```sh
git add .
git commit -m "feat: connect forms with React Query mutations and toasts"
git push
```

---

### 5 - Mockando a API com MSW

- O **MSW** (Mock Service Worker) registra um **service worker** no navegador que intercepta as chamadas HTTP e responde com os nossos mocks — **sem tocar no código do app**. O axios faz uma request normal; o MSW responde no lugar do backend.
  [mswjs.io](https://mswjs.io/docs/integrations/browser)

1 - Instale o MSW (dev dependency):

```sh
pnpm add -D msw
```

> **`[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: msw`** — o pnpm (v10+) bloqueia scripts de pós-instalação de dependências por padrão (segurança). O do MSW é **inofensivo** (só mantém o `mockServiceWorker.js` em sync com a versão do pacote em `pnpm install` futuros) e **não** bloqueia o `msw init` abaixo. Pra aprovar, rode o interativo (jeito à prova de versão — ele escreve a chave certa pra tua versão do pnpm):
>
> ```sh
> pnpm approve-builds
> ```
>
> Marque `msw` (espaço) → Enter. Isso grava a aprovação no **`pnpm-workspace.yaml`** (vai pro git). No **pnpm 11** o arquivo fica assim:
>
> ```yaml
> allowBuilds:
>   msw: true
> ```
>
> Essa config saiu do `package.json` (lá o campo `pnpm` é ignorado e gera `The "pnpm" field in package.json is no longer read by pnpm`) e foi pro `pnpm-workspace.yaml`. O nome da chave variou por versão (`onlyBuiltDependencies` no pnpm 10, `allowBuilds` no 11) — por isso o `pnpm approve-builds` é mais seguro que escrever à mão.

2 - Gere o service worker na pasta `public/` (o `--save` registra o caminho no `package.json`):

```sh
pnpm dlx msw init public/ --save
```

- Isso cria o **`public/mockServiceWorker.js`** e adiciona ao `package.json`:

```json
{
	"msw": {
		"workerDirectory": ["public"]
	}
}
```

> Versione o `public/mockServiceWorker.js` (vai pro git). Ele é gerado, mas commitá-lo evita que cada clone/CI precise rodar o `msw init`.

O `mockServiceWorker.js` é um arquivo gerado e o `pnpm lint` acusa um aviso nele. Diga ao ESLint pra ignorá-lo: no **`eslint.config.js`**, acrescente o caminho ao `globalIgnores` (que já tinha `'dist'` da Parte 1):

```js
export default defineConfig([
	globalIgnores(['dist', 'public/mockServiceWorker.js']),
	// ... resto da config
])
```

3 - Crie a pasta dos mocks:

```sh
mkdir src/api/mocks
```

Nela crie **`sign-in-mock.ts`** (responde o `POST /auth/login`):

```ts
import { http, HttpResponse } from 'msw'

import type { SignInBody } from '../sign-in'

export const signInMock = http.post<never, SignInBody>(
	'/auth/login',
	async ({ request }) => {
		const { password } = await request.json()

		// Mock rule: the demo password authenticates any identifier.
		if (password === 'Password1!') {
			return HttpResponse.json({ token: 'mock-jwt-token' })
		}

		return HttpResponse.json(
			{ message: 'Invalid credentials.' },
			{ status: 401 },
		)
	},
)
```

4 - Crie nela também **`register-mock.ts`** (responde o `POST /users`):

```ts
import { http, HttpResponse } from 'msw'

import type { RegisterAccountBody } from '../register'

export const registerMock = http.post<never, RegisterAccountBody>(
	'/users',
	async ({ request }) => {
		const { username, email } = await request.json()

		// Mock rule: this username is already taken.
		if (username === 'admin') {
			return HttpResponse.json(
				{ message: 'User already exists.' },
				{ status: 409 },
			)
		}

		return HttpResponse.json(
			{ user: { id: 'mock-user-id', username, email, role: 'member' } },
			{ status: 201 },
		)
	},
)
```

- O genérico `http.post<never, SignInBody>` é `<Params, RequestBody>`: sem params de rota, body tipado pelo nosso contrato. As respostas espelham o backend (`{ token }` / `{ message }` / `{ user }`).

5 - Em src/api/mocks ainda, crie **`index.ts`** — junta os handlers no worker e expõe o `enableMSW` (que só liga no modo `test`):

```ts
import { setupWorker } from 'msw/browser'

import { env } from '@/env'

import { registerMock } from './register-mock'
import { signInMock } from './sign-in-mock'

export const worker = setupWorker(signInMock, registerMock)

export async function enableMSW() {
	if (env.MODE !== 'test') {
		return
	}

	await worker.start({
		onUnhandledRequest: 'bypass',
	})
}
```

- O **gate `env.MODE !== 'test'`** é o coração do mock-first: em `pnpm dev` (modo development) o `enableMSW` retorna logo e o app fala com o backend real; em `pnpm dev:test` (modo test) o worker sobe e mocka tudo.
- `onUnhandledRequest: 'bypass'` deixa o que não tem mock (assets, etc.) passar direto, sem encher o console de aviso.

6 - Suba o MSW **antes** de renderizar o React, no **`src/main.tsx`**. Como o `worker.start()` é assíncrono, a gente espera ele ficar pronto pra garantir que a primeira chamada já seja interceptada:

```tsx
import './global.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { enableMSW } from './api/mocks'
import { App } from './app.tsx'

enableMSW().then(() => {
	createRoot(document.getElementById('root')!).render(
		<StrictMode>
			<App />
		</StrictMode>,
	)
})
```

- No modo dev o `enableMSW` resolve na hora (não faz nada), então a renderização não muda. No modo test ele aguarda o worker.

7 - Adicione o script **`dev:test`** no **`package.json`** (sobe o Vite em modo `test`, numa porta dedicada — a Parte 4 com Playwright vai reusar essa porta):

```json
{
	"scripts": {
		"dev": "vite",
		"dev:test": "vite --mode test --port 5001",
		"build": "tsc -b && vite build",
		"lint": "eslint ."
	}
}
```

8 - Rode em modo mock e teste os fluxos:

```sh
pnpm dev:test
```

Abra **http://localhost:5001** (no console deve aparecer `[MSW] Mocking enabled.`). Sem delay no modo test — responde instantâneo. Use os valores abaixo (um por campo):

**Register** (`/register`) — **sucesso** → toast verde + vai pro sign-in:

- Username: `johndoe`
- Email: `john@example.com`
- Password: `Password1!`
- Confirm password: `Password1!`

**Register** — **username já existe** → toast vermelho "User already exists." (409 do mock):

- Username: `admin`
- Email: `john@example.com`
- Password: `Password1!`
- Confirm password: `Password1!`

**Sign-in** (`/sign-in`) — **sucesso** → toast verde + vai pra home:

- Email or username: `johndoe`
- Password: `Password1!`

**Sign-in** — **credenciais erradas** → toast vermelho "Invalid credentials." (401 do mock):

- Email or username: `johndoe`
- Password: `wrongpass`

> **Confira o gate:** rode `pnpm dev` (modo normal). O `[MSW]` **não** aparece e o submit tenta bater no backend real (`localhost:3333`) — como ele não está no ar ainda, cai no toast de erro. É o esperado: o backend real é a Parte 5.

9 - Comite como:

```sh
git add .
git commit -m "feat: mock the API with MSW"
git push
```

---

- Com isso o app está **funcional sem backend**: as telas viraram mockups clicáveis, validáveis pelo cliente, com os fluxos de sucesso e erro espelhando o contrato real.
- **Próximas partes:**
    - **Parte 4 — Testes:** unitários com Vitest + ponta-a-ponta com Playwright, rodando em cima desses mocks (`pnpm dev:test`).
    - **Parte 5 — Backend real:** apontar o `.env.local` pra API de verdade e tratar auth/erros reais (guardar o `token`, rotas protegidas).
esquece, não copiei o ! no final junto. 
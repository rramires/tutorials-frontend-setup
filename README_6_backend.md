# Tutorial Frontend Setup — Parte 6: integração com o backend real

Continuação da Parte 5 (**README_5_playwright.md**). Pré-requisito: o projeto até o final da Parte 5 — formulários **sign-in** e **register** conectados, o **MSW** mockando a API, testes **unitários** (Vitest) e **e2e** (Playwright). Até aqui tudo rodou contra o mock. Agora trocamos por um **backend de verdade**.

Nas partes anteriores o login "funcionava", mas o token devolvido era **jogado fora** — nenhuma rota era protegida, nenhuma request ia autenticada. Esta parte fecha o ciclo: guardar o token, mandá-lo em toda request, **renovar sozinho** quando expira e **proteger** as rotas que exigem sessão.

- **Token de acesso em memória** (não `localStorage`) — durabilidade vem do **cookie de refresh** `httpOnly`
- **Authorization: Bearer** automático em toda request (interceptor)
- **Silent refresh**: 401 → renova o token → repete a request, sem o usuário ver
- **AuthContext** com três estados (`loading | authed | guest`) + **ProtectedRoute**
- **MSW estendido** pra continuar fiel ao backend (unit e e2e seguem verdes)

**Onde isto entra no fluxo (mock-first):**

```
telas (P2) → MSW deixa clicável (P3) → testes garantem que não quebra (P4 unit, P5 e2e) → backend real (P6) ✅ você está aqui
```

> **A decisão de arquitetura (e o porquê).** O token de acesso fica numa **variável de módulo** (memória), não no `localStorage`. `localStorage` é legível por qualquer script — um XSS rouba o token. Em memória, ele some quando a aba fecha; a **sessão persiste** através de um **cookie `httpOnly`** (invisível ao JS) que o backend usa pra emitir um token novo. No boot, o app tenta um **refresh silencioso**: se o cookie é válido, recupera a sessão; se não, vira **guest**. É o padrão "access token curto em memória + refresh longo em cookie".

**Contrato do backend** (a fonte da verdade são os controllers do projeto da API):

| Rota                  | Entra                           | Sai (ok)                         | Erro              |
| --------------------- | ------------------------------- | -------------------------------- | ----------------- |
| `POST /auth/login`    | `{ identifier, password }`      | `200 { token }` + cookie refresh | `401 { message }` |
| `POST /users`         | `{ username, email, password }` | `201 { user }` (sem token)       | `409 { message }` |
| `GET /auth/me`        | _(Bearer)_                      | `200 { user: { id, username } }` | `401 { message }` |
| `PATCH /auth/refresh` | _(cookie)_                      | `200 { token }` (rotação)        | `401`             |
| `POST /auth/logout`   | _(cookie)_                      | `204`                            | —                 |

> **Rotação single-use.** Cada `PATCH /auth/refresh` **revoga o par antigo** e emite um novo. Isso tem uma consequência: se duas requests batem 401 ao mesmo tempo e cada uma chama refresh, a segunda invalida a primeira. Tratamos isso com **single-flight** (um refresh compartilhado) na seção 4.

---

### 1 - Subindo o backend real

- Até agora o `pnpm dev` só parecia falar com uma API — na verdade, fora do `--mode test`, ele **já aponta pro backend real** (a `.env.local` define `VITE_API_URL=http://localhost:3333` desde a Parte 3, e o MSW só liga em `MODE === 'test'`). Falta o backend estar **no ar**.

1 - Suba a API (siga o README do projeto do backend). Em resumo, ele precisa de **MySQL**, rodar as **migrations** e o **seed**, e sobe em **`http://localhost:3333`**. O CORS de desenvolvimento já libera origem qualquer **com credenciais** (necessário pro cookie de refresh).

2 - Com o backend no ar, rode o **frontend** em modo normal (sem `--mode test`, então **sem** MSW):

```sh
pnpm dev
```

> **Dica.** A `.env.local` vem com `VITE_ENABLE_API_DELAY=true` (atraso artificial de 1–3s, herdado da Parte 3 pra testar estados de carregamento). Contra o backend real você já tem latência de verdade — troque pra `VITE_ENABLE_API_DELAY=false` na `.env.local` pra uma experiência mais ágil (o boot faz um refresh, então o atraso aparece logo de cara).

3 - Sanidade: abra o app, vá em **register**, crie um usuário; depois **sign-in** com ele. Olhe a aba **Network** — as requests vão pra `localhost:3333` e voltam `200`. O login mostra o toast de sucesso e navega pra `/`.

> **Repare no problema.** O login "deu certo" na tela, mas: recarregue a página e nada lembra que você logou; nenhuma rota exige sessão; o token que o backend devolveu foi **descartado** (o `use-sign-in-pm` ignora o `{ token }`). É exatamente isso que as próximas seções resolvem. Nada a comitar aqui — foi só ligar o backend.

---

### 2 - Guardando o token (store em memória + Bearer)

- Primeiro a fundação: um lugar pra **guardar** o token e um interceptor que o **anexa** em toda request. Por ora é encanamento — vamos conectá-lo ao login na seção 6, quando o `AuthProvider` existir e houver uma única fonte de verdade pra sessão.

1 - Vá na pasta **`src/lib`** e crie **`auth-store.ts`**:

```ts
// In-memory access token. Lives only for the page session — durability comes
// from the httpOnly refresh cookie, not from localStorage (anti-XSS).
let accessToken: string | null = null

export function getToken() {
	return accessToken
}

export function setToken(token: string) {
	accessToken = token
}

export function clearToken() {
	accessToken = null
}
```

2 - Abra a **`src/lib/api.ts`** e adicione o import do store (logo abaixo do import do `env`):

```ts
import { env } from '@/env'
import { getToken } from '@/lib/auth-store'
```

3 - Na mesma **`src/lib/api.ts`**, adicione um **request interceptor** depois do bloco do `VITE_ENABLE_API_DELAY`:

```ts
// Attach the in-memory access token to every request.
api.interceptors.request.use((config) => {
	const token = getToken()

	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}

	return config
})
```

> **Por quê um interceptor.** Em vez de lembrar de passar o header em cada chamada, o interceptor injeta `Authorization: Bearer <token>` **uma vez**, pra todas. Enquanto não houver token (`getToken()` retorna `null`), ele simplesmente não adiciona nada — então o `/auth/login` e o `/auth/refresh` (que dependem do cookie, não do Bearer) não são afetados.

4 - Confira e comite. Nada de comportamento mudou ainda, mas tudo compila:

```sh
pnpm lint
pnpm test:run
pnpm build
```

```sh
git add src
git commit -m "feat: add in-memory access token store"
git push
```

---

### 3 - Os endpoints de sessão

- Três chamadas tipadas que o `AuthProvider` vai usar: **quem sou eu** (`/auth/me`), **renovar token** (`/auth/refresh`) e **sair** (`/auth/logout`). Seguem o mesmo padrão dos `sign-in.ts`/`register.ts` da Parte 3: uma função fina por endpoint, retornando só o que interessa.

1 - Vá na pasta **`src/api`** e crie **`get-profile.ts`**:

```ts
import { api } from '@/lib/api'

export interface GetProfileResponse {
	user: {
		id: string
		username: string
	}
}

export async function getProfile() {
	const response = await api.get<GetProfileResponse>('/auth/me')

	return response.data.user
}
```

2 - Vá na pasta **`src/api`** e crie **`refresh.ts`**:

```ts
import { api } from '@/lib/api'

export interface RefreshResponse {
	token: string
}

export async function refresh() {
	const response = await api.patch<RefreshResponse>('/auth/refresh')

	return response.data.token
}
```

3 - Vá na pasta **`src/api`** e crie **`sign-out.ts`**:

```ts
import { api } from '@/lib/api'

export async function signOut() {
	await api.post('/auth/logout')
}
```

> **`refresh` não manda nada no corpo.** O `PATCH /auth/refresh` lê o **cookie** `httpOnly` (enviado automático porque o axios está com `withCredentials: true` desde a Parte 3) e devolve um token novo. Igual o `logout`: o backend limpa o cookie a partir dele.

4 - Comite (ainda não há quem chame essas funções — entram na seção 6):

```sh
pnpm lint
pnpm build
```

```sh
git add src
git commit -m "feat: add auth session endpoints"
git push
```

---

### 4 - Silent refresh (renovar o token no 401)

- O token de acesso é curto (expira em horas). Quando expira, a próxima request volta **401**. Em vez de chutar o usuário pra fora, o app **renova** o token via cookie e **repete** a request — transparente. A peça delicada é o **single-flight**: se várias requests batem 401 juntas, todas compartilham **um** refresh (a rotação é single-use, dois refreshes se anulariam).

1 - Abra a **`src/lib/api.ts`** e atualize o topo: troque o import do `axios` (pra trazer os tipos) e amplie o import do store (`clearToken` e `setToken`):

```ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { env } from '@/env'
import { clearToken, getToken, setToken } from '@/lib/auth-store'
```

2 - Ainda na **`src/lib/api.ts`**, adicione no **final do arquivo** o single-flight e o response interceptor:

```ts
// Single-flight refresh: concurrent 401s share one refresh call (the cookie
// rotates single-use, so a second refresh would invalidate the first).
let refreshing: Promise<string> | null = null

function refreshAccessToken() {
	if (!refreshing) {
		refreshing = api
			.patch<{ token: string }>('/auth/refresh')
			.then((response) => {
				setToken(response.data.token)

				return response.data.token
			})
			.finally(() => {
				refreshing = null
			})
	}

	return refreshing
}

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean }

// On a 401, refresh the access token once and replay the original request.
api.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const original = error.config as RetriableRequest | undefined
		const status = error.response?.status

		// Never refresh on the auth routes themselves, or we'd loop.
		const isAuthRoute =
			original?.url === '/auth/login' || original?.url === '/auth/refresh'

		if (status === 401 && original && !isAuthRoute && !original._retry) {
			original._retry = true

			try {
				const token = await refreshAccessToken()
				original.headers.Authorization = `Bearer ${token}`

				return api(original)
			} catch {
				// Refresh failed: the session is really dead.
				clearToken()
				window.location.href = '/sign-in'
			}
		}

		return Promise.reject(error)
	},
)
```

> **As três travas que evitam loop e dor de cabeça.**
>
> 1. **`isAuthRoute`** — um 401 no `/auth/login` (senha errada) **não** deve disparar refresh; e o próprio `/auth/refresh` falhando **não** pode chamar refresh de novo. Os dois ficam de fora.
> 2. **`_retry`** — marca a request como "já tentei renovar"; se ela voltar 401 de novo (token novo também recusado), a gente desiste em vez de tentar pra sempre.
> 3. **single-flight (`refreshing`)** — o primeiro 401 cria a promise de refresh; os 401 concorrentes **reusam** a mesma. Um refresh só, depois todos repetem com o token novo.
>
> Se o refresh falhar de vez (cookie expirado/revogado), limpamos o token e mandamos pro `/sign-in` via `window.location` — recarga dura, mas zera qualquer estado de uma sessão morta.

3 - Comite:

```sh
pnpm lint
pnpm test:run
pnpm build
```

```sh
git add src
git commit -m "feat: silent token refresh on 401"
git push
```

---

### 5 - Mantendo o mock honesto (estendendo o MSW)

- **Atenção — esta seção é o que impede a Parte 5 de quebrar.** Na próxima seção a Home vira **protegida**: no boot o app vai chamar `/auth/refresh` e `/auth/me`. Em `--mode test` quem responde é o **MSW**, que hoje só conhece `/auth/login` e `/users`. Sem estender os handlers, o e2e quebra (login → `/` → guard → `/auth/me` sem mock → volta pro `/sign-in`). Adicionamos os três handlers que faltam **antes** de mexer no roteamento.

1 - Vá na pasta **`src/api/mocks`** e crie **`profile-mock.ts`**:

```ts
import { http, HttpResponse } from 'msw'

export const profileMock = http.get('/auth/me', ({ request }) => {
	// Mock rule: the demo access token identifies the seeded user.
	if (request.headers.get('Authorization') === 'Bearer mock-jwt-token') {
		return HttpResponse.json({
			user: { id: 'mock-user-id', username: 'johndoe' },
		})
	}

	return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
})
```

2 - Vá na pasta **`src/api/mocks`** e crie **`refresh-mock.ts`**:

```ts
import { http, HttpResponse } from 'msw'

export const refreshMock = http.patch('/auth/refresh', () => {
	// Mock mode keeps no refresh session, so boot always lands on "guest"
	// and you sign in on every load. The real backend rotates a cookie here.
	return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
})
```

3 - Vá na pasta **`src/api/mocks`** e crie **`sign-out-mock.ts`**:

```ts
import { http, HttpResponse } from 'msw'

export const signOutMock = http.post('/auth/logout', () => {
	return new HttpResponse(null, { status: 204 })
})
```

4 - Abra a **`src/api/mocks/index.ts`** e registre os três no worker:

```ts
import { profileMock } from './profile-mock'
import { refreshMock } from './refresh-mock'
import { registerMock } from './register-mock'
import { signInMock } from './sign-in-mock'
import { signOutMock } from './sign-out-mock'

export const worker = setupWorker(
	signInMock,
	registerMock,
	profileMock,
	refreshMock,
	signOutMock,
)
```

> **Por que o `/auth/refresh` mockado devolve 401.** No mundo do mock não há cookie de sessão persistente — então o boot sempre cai em **guest** e você loga a cada carregamento. É a escolha mais fiel pro ambiente de teste: mantém o estado "guest" significativo e o fluxo de login determinístico. (No backend real, o cookie faz o refresh do boot dar certo e você continua logado após um reload — essa é a diferença de fidelidade, esperada.) O `Bearer mock-jwt-token` no `/auth/me` casa com o token que o `sign-in-mock` já devolve desde a Parte 3.

5 - Comite (os handlers existem mas ninguém os aciona ainda — só na seção 6):

```sh
pnpm lint
pnpm test:run
pnpm build
```

```sh
git add src
git commit -m "chore: extend msw handlers (me, refresh, logout)"
git push
```

---

### 6 - AuthContext, ProtectedRoute e a virada

- Agora amarramos tudo. Um **contexto** carrega o estado da sessão (`loading | authed | guest` + `user`); um **provider** faz o refresh silencioso no boot e expõe `signIn`/`signOut`; um **ProtectedRoute** segura as rotas até saber quem você é. Seguimos o mesmo padrão de split dos providers de tema e título (Parte 2): `*-context.ts` (o contexto), `*-hooks.ts` (o `useAuth`), `*-provider.tsx` (a lógica).

1 - Crie a pasta do auth:

```sh
mkdir -p src/components/auth
```

2 - Vá na pasta **`src/components/auth`** e crie **`auth-context.ts`**:

```ts
import { createContext } from 'react'

export type AuthStatus = 'loading' | 'authed' | 'guest'

export interface User {
	id: string
	username: string
}

export interface AuthContextValue {
	status: AuthStatus
	user: User | null
	signIn: (token: string) => Promise<void>
	signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
	status: 'loading',
	user: null,
	signIn: async () => {},
	signOut: async () => {},
})
```

> **Por que o contexto já nasce com um valor padrão** (e não `undefined`). Igual ao tema/título da Parte 2. O bônus aqui é direto: os **testes unitários** (Parte 4) renderizam o `SignIn`/`Register` sem o `AuthProvider`. Com um padrão sensato, o `useAuth()` devolve esses no-ops em vez de explodir — então **nenhum teste unitário precisa mudar**.

3 - Vá na pasta **`src/components/auth`** e crie **`auth-hooks.ts`**:

```ts
import { useContext } from 'react'

import { AuthContext } from './auth-context'

export function useAuth() {
	return useContext(AuthContext)
}
```

4 - Vá na pasta **`src/components/auth`** e crie **`auth-provider.tsx`**:

```tsx
import { type ReactNode, useEffect, useState } from 'react'

import { getProfile } from '@/api/get-profile'
import { refresh } from '@/api/refresh'
import { signOut as signOutRequest } from '@/api/sign-out'
import { clearToken, setToken } from '@/lib/auth-store'

import { AuthContext, type AuthStatus, type User } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<AuthStatus>('loading')
	const [user, setUser] = useState<User | null>(null)

	// Silent boot: restore the session from the refresh cookie, if any.
	useEffect(() => {
		async function boot() {
			try {
				const token = await refresh()
				setToken(token)

				const profile = await getProfile()
				setUser(profile)
				setStatus('authed')
			} catch {
				// No valid cookie → just a guest. Silent, no error toast.
				clearToken()
				setUser(null)
				setStatus('guest')
			}
		}

		boot()
	}, [])

	// Called after a successful login: store the token and load the profile.
	async function signIn(token: string) {
		setToken(token)

		try {
			const profile = await getProfile()
			setUser(profile)
			setStatus('authed')
		} catch (err) {
			clearToken()
			setStatus('guest')
			throw err
		}
	}

	async function signOut() {
		try {
			await signOutRequest()
		} finally {
			clearToken()
			setUser(null)
			setStatus('guest')
		}
	}

	return (
		<AuthContext.Provider value={{ status, user, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	)
}
```

> **Três detalhes.** O **boot** é silencioso: sem cookie válido, vira guest sem toast de erro (é o caso normal de quem não logou). O **`signIn(token)`** assume o token (já validado pelo `/auth/login`), guarda e busca o perfil — se o perfil falhar, desfaz e propaga o erro pro form mostrar. O **`signOut`** limpa o estado no `finally`, então mesmo que o request de logout falhe, localmente você sai. Repare que o provider **não** usa `useNavigate` (ele fica acima do router) — quem redireciona é o `ProtectedRoute`, reagindo ao status.

5 - Vá na pasta **`src/components/auth`** e crie **`protected-route.tsx`**:

```tsx
import { LoaderCircle } from 'lucide-react'
import { Navigate, Outlet } from 'react-router'

import { useAuth } from './auth-hooks'

export function ProtectedRoute() {
	const { status } = useAuth()

	if (status === 'loading') {
		return (
			<div className='flex h-screen items-center justify-center'>
				<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
			</div>
		)
	}

	if (status === 'guest') {
		return <Navigate to='/sign-in' replace />
	}

	return <Outlet />
}
```

> **Por que o estado `loading` importa.** Sem ele, no primeiro render (antes do boot terminar) o status seria "guest" e o guard chutaria pra `/sign-in` **antes** do refresh ter chance — quem tem cookie válido veria um flash de tela de login. O spinner segura a rota até a resposta chegar; aí decide authed ou guest. O `replace` troca a entrada no histórico (o botão "voltar" não retorna pra rota protegida).

6 - Abra a **`src/app.tsx`** e envolva o router com o `AuthProvider`. Adicione o import e o wrapper:

```tsx
// Depois de:
import { Toaster } from '@/components/ui/sonner'
// Adicione:
import { AuthProvider } from './components/auth/auth-provider'
```

```tsx
// Adicione AuthProvider envolvendo RouterProvider e Toaster:
<AuthProvider>
	<RouterProvider router={router} />
	<Toaster richColors />
</AuthProvider>
```

7 - Abra a **`src/routes.tsx`**, importe o guard e proteja o ramo da Home:

```tsx
// Depois de:
import { createBrowserRouter } from 'react-router'
// Adicione:
import { ProtectedRoute } from './components/auth/protected-route'
```

```tsx
// Depois de:
children: [
// troque o primeiro objeto com a rota '/' (AppLayout) por este:
	{
		path: '/',
		element: <ProtectedRoute />,
		children: [
			{
				element: <AppLayout />,
				children: [{ index: true, element: <Home /> }],
			},
		],
	},
```

> **A montagem.** `ProtectedRoute` vira o elemento da rota `/`; quando autenticado, seu `<Outlet />` renderiza o `AppLayout` (rota de layout, sem `path`), que por sua vez renderiza a `Home`. As rotas `/sign-in` e `/register` **continuam fora** do guard — são públicas.

8 - Abra a **`src/pages/app/home.tsx`** e mostre o usuário logado + um botão de sair (a Home agora só renderiza quando autenticado, então `user` está presente):

```tsx
import { useNavigate } from 'react-router'

import { useAuth } from '@/components/auth/auth-hooks'
import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'

export function Home() {
	const { user, signOut } = useAuth()
	const navigate = useNavigate()

	async function handleSignOut() {
		await signOut()
		navigate('/sign-in')
	}

	return (
		<>
			<PageTitle title='Home' />
			<div className='flex flex-1 flex-col items-start gap-4 px-8 py-4'>
				<h2 className='text-2xl font-medium'>
					Welcome, {user?.username}!
				</h2>
				<Button variant='outline' onClick={handleSignOut}>
					Sign out
				</Button>
			</div>
		</>
	)
}
```

9 - Por fim, conecte o login ao contexto. Abra a **`src/pages/auth/sign-in/use-sign-in-pm.ts`**, importe o `useAuth`:

```ts
// Depois de:
import { signIn } from '@/api/sign-in'
// Adicione:
import { useAuth } from '@/components/auth/auth-hooks'
```

Pegue o contexto dentro do hook (logo após o `useNavigate`):

```ts
export function useSignInPM() {
	// Depois de:
	const navigate = useNavigate()
	// Adicione:
	const auth = useAuth()
```

E no `onSubmit`, capture o token e estabeleça a sessão antes de navegar:

```ts
// Substitua o bloco do try
		try {
			const { token } = await authenticate(data)
			await auth.signIn(token)
			toast.success('Signed in successfully.')
			navigate('/')
		} catch (err) {
```

> **O ciclo completo agora.** Login → `/auth/login` devolve `{ token }` → `auth.signIn(token)` guarda o token e busca `/auth/me` → status vira `authed` → `navigate('/')` → o `ProtectedRoute` vê `authed` e libera a Home, que mostra o `username`. Recarregou? O boot tenta o refresh pelo cookie e te traz de volta autenticado (no backend real). Sem cookie válido → guest → `/sign-in`.

10 - Rode tudo. O `pnpm test:run` continua verde (os unit não precisaram mudar) e o `pnpm e2e` prova que o MSW estendido segurou o fluxo protegido:

```sh
pnpm lint
pnpm test:run
pnpm build
pnpm e2e
```

```sh
git add src
git commit -m "feat: add auth provider and protected routes"
git push
```

> **Smoke no backend real.** Os testes acima rodam contra o MSW. Pra fechar, suba o backend (seção 1) e, com `pnpm dev`, faça o caminho de gente: registre → logue → veja seu `username` na Home → **recarregue** (continua logado, graças ao cookie) → **Sign out** (volta pro `/sign-in`).

---

### 7 - Layouts com cara de app real

- O auth funciona — agora a **cara de app de verdade**. A informação de sessão (quem está logado + sair) sobe do corpo da página pro **header** do `AppLayout`; e as telas de auth ganham **navegação** entre si. Como o `AppLayout` só renderiza **dentro do `ProtectedRoute`**, ele está sempre autenticado — pode usar o `useAuth` sem checar `null`. E como ele ganha **comportamento** (sair da sessão), a lógica vai pra um **Presentation Model** (`use-app-layout-pm.ts`) e o `.tsx` fica **só marcação** — igual `sign-in`/`register`; os layouts de auth/register, sem comportamento (só um `<Link>`), seguem markup puro.

1 - O `AppLayout` vira um par **view + PM**. Como ele divide a `_layouts/` com outros `.tsx` (`auth-layout`, `register-layout`), o par ganha **pasta própria** (mesmo prefixo). Crie a pasta e mova o arquivo:

```sh
mkdir src/pages/_layouts/app-layout
mv src/pages/_layouts/app-layout.tsx src/pages/_layouts/app-layout/
```

A mudança quebra o import. Abra a **`src/routes.tsx`** e ajuste o caminho:

```tsx
// de './pages/_layouts/app-layout' para:
import { AppLayout } from './pages/_layouts/app-layout/app-layout'
```

> **A regra da pasta.** Um `.tsx` **sozinho** na pasta recebe o `use-x-pm.ts` ao lado, sem cerimônia (foi o caso de `sign-in`/`register`). Quando ele **divide a pasta** com outros, cria-se uma subpasta de mesmo nome — cada view colada no seu PM, sem `use-*-pm.ts` soltos espalhados no diretório.

2 - Vá na pasta **`src/pages/_layouts/app-layout`** e crie **`use-app-layout-pm.ts`**:

```ts
import { useNavigate } from 'react-router'

import { useAuth } from '@/components/auth/auth-hooks'

export function useAppLayoutPM() {
	const { user, signOut } = useAuth()
	const navigate = useNavigate()

	async function handleSignOut() {
		await signOut()
		navigate('/sign-in')
	}

	return {
		user,
		handleSignOut,
	}
}
```

> **Por que um PM.** `handleSignOut` (chama `signOut()` → limpa a sessão → status vira `guest` → vai pro `/sign-in`) é **fluxo**, não marcação. Na real o `ProtectedRoute` já redirecionaria sozinho ao ver `guest`; o `navigate` só deixa instantâneo. O PM expõe só o que a view precisa: `user` + `handleSignOut`.

3 - Abra a **`src/pages/_layouts/app-layout/app-layout.tsx`** e deixe **só a marcação** (logo + marca à esquerda; `Welcome` + **Sign out** + `ModeToggle` à direita), consumindo o PM:

```tsx
import { GlobeCheck, LogOut } from 'lucide-react'
import { Outlet } from 'react-router'

import { ModeToggle } from '@/components/theme/mode-toggle'
import { Button } from '@/components/ui/button'

import { useAppLayoutPM } from './use-app-layout-pm'

export function AppLayout() {
	const pm = useAppLayoutPM()

	return (
		<div className='bg-background text-foreground flex h-screen flex-col'>
			<header className='flex h-20 items-center justify-between border-b px-8'>
				<div className='flex items-center gap-2'>
					<GlobeCheck className='text-primary size-8' />
					<h1 className='text-2xl font-bold'>Gympass Sample App</h1>
				</div>
				<div className='flex items-center gap-4'>
					<span className='text-muted-foreground text-sm'>
						Welcome, {pm.user?.username}!
					</span>
					<Button
						variant='outline'
						size='sm'
						onClick={pm.handleSignOut}
					>
						<LogOut />
						Sign out
					</Button>
					<ModeToggle />
				</div>
			</header>
			<main className='flex flex-1'>
				<Outlet />
			</main>
			<footer className='text-muted-foreground flex h-12 items-center border-t px-8'>
				<p>AppLayout Footer</p>
			</footer>
		</div>
	)
}
```

> **A "logo".** O `GlobeCheck` (lucide) entra como logo à esquerda da marca: `size-8` (32px) equilibra com o `text-3xl` do `<h1>` na altura `h-20` do header, e `text-primary` dá o tom de destaque. O mesmo bloco logo+marca se repete idêntico nos três layouts. O `user` nunca é `null` aqui (layout protegido), mas `pm.user?.username` mantém a segurança de tipo.

4 - Com o usuário no header, a **`Home`** volta a ser só conteúdo. Abra a **`src/pages/app/home.tsx`** e simplifique:

```tsx
import { PageTitle } from '@/components/title/page-title'

export function Home() {
	return (
		<>
			<PageTitle title='Home' />
			<div className='flex-1 px-8 py-4'>
				<h2 className='text-2xl font-medium'>Home Page!</h2>
			</div>
		</>
	)
}
```

5 - Agora as telas de auth. Abra a **`src/pages/_layouts/auth-layout.tsx`** e dê o mesmo header — marca + um botão pra **criar conta** + `ModeToggle`:

```tsx
import { GlobeCheck, UserPlus } from 'lucide-react'
import { Link, Outlet } from 'react-router'

import { ModeToggle } from '@/components/theme/mode-toggle'
import { Button } from '@/components/ui/button'

export function AuthLayout() {
	return (
		<div className='bg-background text-foreground flex h-screen flex-col'>
			<header className='flex h-20 items-center justify-between border-b px-8'>
				<div className='flex items-center gap-2'>
					<GlobeCheck className='text-primary size-8' />
					<h1 className='text-2xl font-bold'>Gympass Sample App</h1>
				</div>
				<div className='flex items-center gap-4'>
					<Button asChild variant='outline' size='sm'>
						<Link to='/register'>
							<UserPlus />
							Create account
						</Link>
					</Button>
					<ModeToggle />
				</div>
			</header>
			<main className='flex flex-1'>
				<Outlet />
			</main>
			<footer className='flex h-8 items-center border-t pl-8'></footer>
		</div>
	)
}
```

> **O botão é um link.** `<Button asChild>` + `<Link>` (do `react-router`) renderiza um `<a>` com cara de botão — navegação de verdade, sem `onClick`/`navigate`. O label **Create account** é diferente do **Sign up** do form, e o **Back to sign in** (abaixo) do **Sign in** — de propósito: assim os seletores do e2e (`getByRole('button', { name: 'Sign in' })`) não ficam ambíguos.

6 - Abra a **`src/pages/_layouts/register-layout.tsx`** e faça o simétrico — botão pra **voltar ao sign-in**:

```tsx
import { ArrowLeft, GlobeCheck } from 'lucide-react'
import { Link, Outlet } from 'react-router'

import { ModeToggle } from '@/components/theme/mode-toggle'
import { Button } from '@/components/ui/button'

export function RegisterLayout() {
	return (
		<div className='bg-background text-foreground flex h-screen flex-col'>
			<header className='flex h-20 items-center justify-between border-b px-8'>
				<div className='flex items-center gap-2'>
					<GlobeCheck className='text-primary size-8' />
					<h1 className='text-2xl font-bold'>Gympass Sample App</h1>
				</div>
				<div className='flex items-center gap-4'>
					<Button asChild variant='outline' size='sm'>
						<Link to='/sign-in'>
							<ArrowLeft />
							Back to sign in
						</Link>
					</Button>
					<ModeToggle />
				</div>
			</header>
			<main className='flex flex-1'>
				<Outlet />
			</main>
			<footer className='flex h-8 items-center border-t pl-8'></footer>
		</div>
	)
}
```

7 - Rode tudo (o `pnpm e2e` prova que os botões novos não bagunçaram os seletores) e comite:

```sh
pnpm lint
pnpm test:run
pnpm build
pnpm e2e
```

```sh
git add src
git commit -m "feat: real-app layout chrome"
git push
```

> **Continua 4/4 verde.** Os links de navegação são `<a>` (papel _link_), não _button_ — então `getByRole('button', { name: 'Sign in' })` (sign-in) e `'Sign up'` (register) seguem únicos. Os campos por `getByLabel` não mudaram. Nada nos specs precisou mexer.

---

### 8 - Smoke manual no backend real

- Os testes automatizados rodam contra o **MSW**. O smoke final é **na mão, no navegador, contra o backend de verdade** — prova o que o mock não cobre: o cookie `httpOnly` emitido no login, o **refresh do boot** segurando a sessão no reload, e o CORS com credenciais. Backend no ar (seção 1) + `pnpm dev` (porta **3001**).

1 - **Login com o usuário default do seed.** Abra **`http://localhost:3001`**, vá pro sign-in e entre com as credenciais padrão do backend:

- **Email or username:** `admin@example.com`
- **Password:** `Admin@12345`

Esperado: toast `Signed in successfully.` → header com `Welcome, admin!` → aperte **F5**: **continua logado** (o boot renova a sessão pelo cookie). O **Sign out** volta pro `/sign-in`.

2 - **Crie um usuário novo.** No header do sign-in clique em **Create account** e preencha o form (dados fictícios — copie campo a campo):

- **Username:** `mary_jane`
- **Email:** `mary.jane@example.com`
- **Password:** `Mary@12345`
- **Confirm password:** `Mary@12345`

**Sign up** → toast `Account created. You can sign in now.` → vai pro `/sign-in`. (Repetir o mesmo email → **409** do backend, toast de erro.)

3 - **Login com o usuário que você acabou de criar:**

- **Email or username:** `mary_jane`
- **Password:** `Mary@12345`

Mesmo comportamento do passo 1: entra, o header mostra `Welcome, mary_jane!`, e o reload mantém a sessão.

> **Por que na mão, além do e2e.** O e2e é determinístico e roda no CI (contra mocks). Este smoke valida a **integração real**: se algo só falha aqui, o suspeito é o cookie `httpOnly`, o CORS com credenciais ou a env (`VITE_API_URL`) — nada que o mock pegaria.

---

### 9 - Fechando a Parte 6

Fim da série. O app saiu de telas estáticas (P1–P2), virou clicável sobre mocks (P3), ganhou rede mockada (P3), duas camadas de teste (P4 unit, P5 e2e) e agora fala com um **backend de verdade**, com sessão autenticada de ponta a ponta — token em memória, refresh silencioso por cookie, rotas protegidas — **sem perder os mocks** (unit e e2e seguem rodando offline contra o MSW estendido).

**O que entrou:**

- `src/lib/auth-store.ts` — token de acesso em memória (`get`/`set`/`clear`)
- `src/lib/api.ts` — interceptors: **Bearer** em toda request + **silent refresh** no 401 (single-flight)
- `src/api/get-profile.ts` · `refresh.ts` · `sign-out.ts` — endpoints de sessão
- `src/components/auth/` — `AuthContext` (`loading|authed|guest`), `useAuth`, `AuthProvider` (boot refresh), `ProtectedRoute`
- MSW estendido (`/auth/me`, `/auth/refresh`, `/auth/logout`) — mocks fiéis ao backend
- `sign-in` estabelecendo a sessão pelo contexto (`Home` protegida)
- **layouts com cara de app**: header `Gympass Sample App`; `AppLayout` (lógica no `use-app-layout-pm`) com `Welcome` + **Sign out**; `AuthLayout` ↔ `RegisterLayout` navegando entre si; `ModeToggle` em todos

**Os dois mundos, lado a lado:**

| Comando         | API          | Sessão no boot                        |
| --------------- | ------------ | ------------------------------------- |
| `pnpm dev`      | backend real | refresh pelo cookie → continua logado |
| `pnpm dev:test` | MSW          | sem cookie → guest (loga a cada vez)  |
| `pnpm e2e`      | MSW          | idem — determinístico                 |

Por fim, comite este tutorial:

```sh
git add README_6_backend.md
git commit -m "docs: add part 6 tutorial (real backend integration)"
git push
```

> **Reaproveitando.** Essa arquitetura (mock-first → testes → backend real, com token em memória + refresh por cookie + rotas protegidas) é o esqueleto pro próximo sistema de verdade. O mock vira o **contrato**: o front nasce e é validado contra ele, e o backend entra por último, sem surpresa.

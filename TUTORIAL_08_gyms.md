# Parte 8 — Academias e o nascimento do sidebar

Na Parte 7 fechamos o ciclo de conta (verificação de email + reset de senha). Agora
o app ganha **conteúdo de verdade**: a tela de **academias** (buscar e listar perto de
você) e a **criação de academia**, que é exclusiva de **administradores**.

Para abrigar essas telas, a casca do app muda: nasce o **sidebar** à esquerda (com itens
que aparecem conforme o papel do usuário) e o header vira uma faixa fina. E como a criação
de academia é restrita, criamos o **guard por papel** (`RoleRoute`) — a primeira vez que o
`role` que veio do `/auth/me` (Parte 6) decide o que aparece na tela.

Três rotas do backend entram em cena:

| Rota                                    | Quem usa        | O que faz                                      |
| --------------------------------------- | --------------- | ---------------------------------------------- |
| `GET /gyms/search?query=&page=`         | qualquer logado | busca por nome (mín. 3 letras, 20 por página)  |
| `GET /gyms/nearby?latitude=&longitude=` | qualquer logado | academias num raio de ~10 km (sem paginação)   |
| `POST /gyms`                            | **só ADMIN**    | cria uma academia (`201`); membro recebe `403` |

A página de academias usa a **geolocalização do navegador** para o "perto de mim", com a
**busca por nome como rede de segurança** (se o GPS for negado, você ainda acha academias
digitando). Seguimos o mesmo pipeline de sempre: **mock-first → MSW → unit → e2e → backend
real**.

> **Antes de começar.** Garanta o backend atualizado (`git pull` em `solid_api_sample`),
> com `APP_URL=http://localhost:3001` e o `.env` da Parte 6 ainda valendo. Tudo abaixo é
> executado por você, passo a passo, com um commit por seção.

---

## 1. O sidebar nasce

### 1.1. O que muda na casca

Hoje o `app-layout` é um header gordo no topo (marca à esquerda, "Welcome / Sign out / tema"
à direita) com o conteúdo abaixo. A partir daqui:

```
┌──────────┬─────────────────────────────┐
│ SIDEBAR  │  header fino (trigger + tema)│
│ (esq.)   ├─────────────────────────────┤
│ marca    │  VerifyEmailBanner          │
│ ───────  ├─────────────────────────────┤
│ nav      │                             │
│ (role)   │  <Outlet/> (conteúdo)       │
│ ───────  │                             │
│ user +   │                             │
│ Sign out │                             │
└──────────┴─────────────────────────────┘
```

- A **marca** sobe para o topo do sidebar.
- A **navegação** (itens por papel) fica no meio.
- O **usuário + badge de papel + Sign out** descem para o rodapé do sidebar.
- O **header** vira uma faixa fina só com o botão de colapsar (`SidebarTrigger`) e o tema.
- O **banner de verificação** continua entre o header e o conteúdo.
- O **footer** antigo ("AppLayout Footer") é removido.

### 1.2. Instalando os componentes shadcn

O sidebar do shadcn é um componente grande que arrasta dependências (sheet, separator,
skeleton, tooltip e um hook `use-mobile`). Aproveitamos para trazer também o `badge` (o
selo de papel no rodapé):

```sh
yes n | pnpm dlx shadcn@latest add sidebar badge
```

> **Por que `yes n |`?** O `shadcn add` é interativo: ao ver que você já tem `button.tsx`
> e `input.tsx`, ele pergunta se quer sobrescrever. Queremos manter os nossos, então
> respondemos **não** a tudo. O `yes n` alimenta uma sequência infinita de "n" para o
> prompt, sem travar. (Os arquivos novos — sidebar, badge, sheet, etc. — são criados
> normalmente.)

Isso cria: `src/components/ui/{sidebar,badge,sheet,separator,skeleton,tooltip}.tsx` e
`src/hooks/use-mobile.ts`. As variáveis de tema do sidebar (`--sidebar-*`) já estavam no
`global.css` desde o `shadcn init`, então não há nada a ajustar lá.

### 1.3. Dois ajustes nos arquivos gerados

**(a) Ordenação de imports.** Os arquivos recém-criados vêm com os imports fora da ordem
que o nosso ESLint exige (`simple-import-sort`). É auto-corrigível:

```sh
pnpm lint:fix
```

**(b) O hook `use-mobile`.** A versão padrão do shadcn chama `setState` dentro de um
`useEffect`, o que dispara a nossa regra `react-hooks/set-state-in-effect`. Trocamos por
uma versão com `useSyncExternalStore` — mais idiomática no React 19 e sem efeito.

Vá na pasta `src/hooks` e substitua o conteúdo de `use-mobile.ts` por:

```ts
import * as React from 'react'

const MOBILE_BREAKPOINT = 768

function subscribe(callback: () => void) {
	const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
	mql.addEventListener('change', callback)
	return () => mql.removeEventListener('change', callback)
}

export function useIsMobile() {
	// useSyncExternalStore reads the media query without a setState-in-effect,
	// which keeps our react-hooks lint rule happy (vs. shadcn's default hook).
	return React.useSyncExternalStore(
		subscribe,
		() => window.innerWidth < MOBILE_BREAKPOINT,
		() => false,
	)
}
```

### 1.4. O componente do sidebar

O sidebar tem lógica (itens por papel, navegação, sign out), então segue o nosso padrão
Presentation Model: marcação no `.tsx`, comportamento no `use-*-pm.ts`.

Crie a pasta do componente:

```sh
mkdir src/components/app-sidebar
```

Vá na pasta `src/components/app-sidebar` e crie `use-app-sidebar-pm.ts`:

```ts
import { Dumbbell, LayoutDashboard, Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'

import { useAuth } from '@/components/auth/auth-hooks'

export function useAppSidebarPM() {
	const { user, signOut } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()

	// Nav items by role: the "New gym" item only exists for admins. The route
	// itself is still guarded (defense in depth) — hiding the link is just UX.
	const items = [
		{ to: '/', label: 'Dashboard', icon: LayoutDashboard },
		{ to: '/gyms', label: 'Gyms', icon: Dumbbell },
		...(user?.role === 'ADMIN'
			? [{ to: '/gyms/new', label: 'New gym', icon: Plus }]
			: []),
	]

	async function handleSignOut() {
		await signOut()
		navigate('/sign-in')
	}

	return {
		user,
		items,
		pathname: location.pathname,
		handleSignOut,
	}
}
```

O ponto-chave é o `...(user?.role === 'ADMIN' ? [...] : [])`: o item **New gym** só existe
na lista se o usuário for admin. Para o membro, ele simplesmente não está no DOM.

Vá na pasta `src/components/app-sidebar` e crie `app-sidebar.tsx`:

```tsx
import { GlobeCheck, LogOut } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from '@/components/ui/sidebar'

import { useAppSidebarPM } from './use-app-sidebar-pm'

export function AppSidebar() {
	const pm = useAppSidebarPM()

	return (
		<Sidebar collapsible='icon'>
			<SidebarHeader>
				<div className='flex items-center gap-2 px-2 py-1'>
					<GlobeCheck className='text-primary size-6 shrink-0' />
					<span className='truncate font-bold group-data-[collapsible=icon]:hidden'>
						Gympass Sample App
					</span>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{pm.items.map((item) => (
								<SidebarMenuItem key={item.to}>
									<SidebarMenuButton
										asChild
										isActive={pm.pathname === item.to}
										tooltip={item.label}
									>
										<Link to={item.to}>
											<item.icon />
											<span>{item.label}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<div className='flex flex-col gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden'>
					<div className='flex items-center justify-between gap-2'>
						<span className='truncate text-sm font-medium'>
							{pm.user?.username}
						</span>
						<Badge
							variant={
								pm.user?.role === 'ADMIN'
									? 'default'
									: 'secondary'
							}
						>
							{pm.user?.role === 'ADMIN' ? 'Admin' : 'Member'}
						</Badge>
					</div>
					<Button
						variant='outline'
						size='sm'
						onClick={pm.handleSignOut}
					>
						<LogOut />
						Sign out
					</Button>
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	)
}
```

Detalhes:

- `collapsible='icon'` faz o sidebar encolher para uma trilha de ícones (o `SidebarRail`
  no fim é a faixa fina que você clica para expandir de novo).
- `group-data-[collapsible=icon]:hidden` esconde os textos (marca, nome, badge) quando o
  sidebar está colapsado — sobram só os ícones.
- `tooltip={item.label}` mostra o nome do item ao passar o mouse quando colapsado (por isso
  vamos precisar do `TooltipProvider` no layout, a seguir).
- O `Badge` usa a variante `default` (sólida) para admin e `secondary` (suave) para membro.

### 1.5. Reescrevendo o layout

Agora a casca. Vá na pasta `src/pages/_layouts/app-layout` e substitua o conteúdo de
`app-layout.tsx` por:

```tsx
import { Outlet } from 'react-router'

import { AppSidebar } from '@/components/app-sidebar/app-sidebar'
import { VerifyEmailBanner } from '@/components/auth/verify-email-banner/verify-email-banner'
import { ModeToggle } from '@/components/theme/mode-toggle'
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppLayout() {
	return (
		<TooltipProvider>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<header className='flex h-14 shrink-0 items-center gap-2 border-b px-4'>
						<SidebarTrigger />
						<div className='flex-1' />
						<ModeToggle />
					</header>
					<VerifyEmailBanner />
					<div className='flex flex-1 flex-col'>
						<Outlet />
					</div>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	)
}
```

Notas:

- `SidebarProvider` controla o estado aberto/colapsado; `SidebarInset` é a área de conteúdo
  à direita (e já é um `<main>`, por isso usamos uma `<div>` em volta do `<Outlet/>`, e não
  outro `<main>`).
- O `TooltipProvider` envolve tudo porque os tooltips do sidebar (item 1.4) precisam de um
  provedor ancestral.
- O header ficou minimalista de propósito: a marca já está no sidebar, então aqui sobram só
  o botão de colapsar e o seletor de tema. O título da página continua no `<title>` da aba
  (via `PageTitle`).

### 1.6. Removendo o PM órfão

O `app-layout` não tem mais lógica (o sign out foi para o sidebar). Apague o PM antigo:

```sh
rm src/pages/_layouts/app-layout/use-app-layout-pm.ts
```

### 1.7. Conferindo e commitando

```sh
pnpm lint && pnpm test:run
```

Suba o app (`pnpm dev`), faça login e confira: sidebar à esquerda, marca no topo, "Dashboard"
e "Gyms" no meio, seu nome + badge **Member** + Sign out no rodapé. O botão de colapsar
encolhe para a trilha de ícones. (O item "New gym" só aparece para admin — chegamos lá.)

```sh
git add src
git commit -m "feat: introduce sidebar shell"
```

> Tudo o que o `shadcn add` criou está em `src/`, e ele não adicionou nenhuma dependência
> nova ao `package.json` (sidebar reaproveita o `radix-ui` que já temos). Então `git add src`
> basta — diferente da Parte 7, aqui **não** há `package.json`/lockfile para incluir.

---

## 2. Geolocalização, API de academias e mocks

### 2.1. Um helper de geolocalização

A API `navigator.geolocation` é baseada em callback. Embrulhamos numa Promise para usar com
`async/await` — tanto na página de academias (perto de mim ao abrir) quanto no formulário de
criar academia ("usar minha localização").

Vá na pasta `src/lib` e crie `geolocation.ts`:

```ts
export interface Coordinates {
	latitude: number
	longitude: number
}

// Promise wrapper around the callback-based Geolocation API. Reused by the gyms
// page (find nearby on load) and the create-gym form ("use my location").
export function getCurrentPosition(): Promise<Coordinates> {
	return new Promise((resolve, reject) => {
		if (!('geolocation' in navigator)) {
			reject(new Error('Geolocation is not supported by this browser.'))
			return
		}

		navigator.geolocation.getCurrentPosition(
			(position) =>
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				}),
			(error) => reject(error),
		)
	})
}
```

### 2.2. As funções de API

Vá na pasta `src/api` e crie `search-gyms.ts` (também é onde definimos o tipo `Gym`,
reaproveitado pelas outras funções):

```ts
import { api } from '@/lib/api'

export interface Gym {
	id: string
	title: string
	description: string | null
	phone: string | null
	latitude: number
	longitude: number
}

// The API serializes latitude/longitude as strings (Prisma Decimal). Coerce
// them to numbers so the rest of the app can treat coordinates as numbers.
export function normalizeGym(gym: Gym): Gym {
	return {
		...gym,
		latitude: Number(gym.latitude),
		longitude: Number(gym.longitude),
	}
}

interface SearchGymsResponse {
	gyms: Gym[]
}

export interface SearchGymsParams {
	query: string
	page?: number
}

export async function searchGyms({ query, page = 1 }: SearchGymsParams) {
	const response = await api.get<SearchGymsResponse>('/gyms/search', {
		params: { query, page },
	})

	return response.data.gyms.map(normalizeGym)
}
```

Vá na pasta `src/api` e crie `get-nearby-gyms.ts`:

```ts
import { api } from '@/lib/api'
import type { Coordinates } from '@/lib/geolocation'

import { type Gym, normalizeGym } from './search-gyms'

interface NearbyGymsResponse {
	gyms: Gym[]
}

export async function getNearbyGyms({ latitude, longitude }: Coordinates) {
	const response = await api.get<NearbyGymsResponse>('/gyms/nearby', {
		params: { latitude, longitude },
	})

	return response.data.gyms.map(normalizeGym)
}
```

Vá na pasta `src/api` e crie `create-gym.ts`:

```ts
import { api } from '@/lib/api'

import { type Gym, normalizeGym } from './search-gyms'

export interface CreateGymBody {
	title: string
	description: string | null
	phone: string | null
	latitude: number
	longitude: number
}

interface CreateGymResponse {
	gym: Gym
}

export async function createGym(body: CreateGymBody) {
	const response = await api.post<CreateGymResponse>('/gyms', body)

	return normalizeGym(response.data.gym)
}
```

> **Coordenadas: número no mock, string no backend.** O banco guarda `latitude`/`longitude`
> como `Decimal` (Prisma), e a API serializa `Decimal` como **string** no JSON — enquanto os
> mocks devolvem números. Para o app não ter que se preocupar com isso, cada função normaliza
> as coordenadas para `number` (`normalizeGym`) já na camada de API: assim o tipo `Gym` fica
> honesto e quem consome (ex.: `gym.latitude.toFixed(4)` no card) sempre recebe número. Esse
> foi um bug que **só apareceu no smoke** contra o backend real — o mock-first não pega
> diferença de tipo de serialização.

### 2.3. Os mocks

Primeiro um "banco" em memória, que o mock de busca filtra e o de criação alimenta.

Vá na pasta `src/api/mocks` e crie `gyms-data.ts`:

```ts
import type { Gym } from '../search-gyms'

// Mock-only in-memory store. Seeded gyms cluster around São Paulo so the
// "nearby" mock has something to return; newly created gyms are pushed here.
export const gyms: Gym[] = [
	{
		id: 'gym-1',
		title: 'Iron Temple',
		description: 'Heavy lifting in the city center.',
		phone: '+5511970000001',
		latitude: -23.55,
		longitude: -46.63,
	},
	{
		id: 'gym-2',
		title: 'Aqua Fitness',
		description: 'Pool, sauna and cardio.',
		phone: null,
		latitude: -23.56,
		longitude: -46.64,
	},
	{
		id: 'gym-3',
		title: 'Zen Yoga Studio',
		description: null,
		phone: '+5511970000003',
		latitude: -23.54,
		longitude: -46.62,
	},
	{
		id: 'gym-4',
		title: 'Powerhouse Gym',
		description: 'Open 24 hours.',
		phone: '+5511970000004',
		latitude: -23.57,
		longitude: -46.65,
	},
]
```

Vá na pasta `src/api/mocks` e crie `search-gyms-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import { gyms } from './gyms-data'

const PAGE_SIZE = 20

export const searchGymsMock = http.get('/gyms/search', ({ request }) => {
	const url = new URL(request.url)
	const query = (url.searchParams.get('query') ?? '').toLowerCase()
	const page = Number(url.searchParams.get('page') ?? '1')

	const matches = gyms.filter((gym) =>
		gym.title.toLowerCase().includes(query),
	)
	const start = (page - 1) * PAGE_SIZE
	const paged = matches.slice(start, start + PAGE_SIZE)

	return HttpResponse.json({ gyms: paged })
})
```

Vá na pasta `src/api/mocks` e crie `nearby-gyms-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import { gyms } from './gyms-data'

// Mock simplification: every seeded gym counts as "nearby". The real backend
// filters by a ~10km radius around the given latitude/longitude.
export const nearbyGymsMock = http.get('/gyms/nearby', () => {
	return HttpResponse.json({ gyms })
})
```

Vá na pasta `src/api/mocks` e crie `create-gym-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import type { CreateGymBody } from '../create-gym'
import { gyms } from './gyms-data'

let nextId = 100

export const createGymMock = http.post<never, CreateGymBody>(
	'/gyms',
	async ({ request }) => {
		// Mirror the backend RBAC: only the admin token may create a gym.
		if (
			request.headers.get('Authorization') !==
			'Bearer mock-admin-jwt-token'
		) {
			return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
		}

		const body = await request.json()
		const gym = { id: `gym-${nextId++}`, ...body }
		gyms.push(gym)

		return HttpResponse.json({ gym }, { status: 201 })
	},
)
```

### 2.4. Um admin no mundo dos mocks

Até agora o mock só conhecia o membro `johndoe`. Para exercitar as telas restritas a admin
**sem subir o backend**, ensinamos o mock a reconhecer um admin: ao logar com o identificador
`admin`, ele devolve um token de admin; o `/auth/me` então responde com `role: 'ADMIN'`.

Vá na pasta `src/api/mocks` e ajuste `sign-in-mock.ts` — troque o início do handler:

```ts
// Depois de:
export const signInMock = http.post<never, SignInBody>(
	'/auth/login',
// Substitua o bloco por:
	async ({ request }) => {
		const { identifier, password } = await request.json()

		// Mock rule: the demo password authenticates any identifier. Signing in
		// as "admin" yields an admin token so you can reach role-gated screens.
		if (password === 'Password1!') {
			const token =
				identifier === 'admin'
					? 'mock-admin-jwt-token'
					: 'mock-jwt-token'
			return HttpResponse.json({ token })
		}

		return HttpResponse.json(
			{ message: 'Invalid credentials.' },
			{ status: 401 },
		)
	},
```

Vá na pasta `src/api/mocks` e substitua o conteúdo de `profile-mock.ts` por:

```ts
import { http, HttpResponse } from 'msw'

import { isVerified } from './verified-state'

export const profileMock = http.get('/auth/me', ({ request }) => {
	const auth = request.headers.get('Authorization')

	// The admin token identifies the seeded admin (already verified).
	if (auth === 'Bearer mock-admin-jwt-token') {
		return HttpResponse.json({
			user: {
				id: 'mock-admin-id',
				username: 'admin',
				is_verified: true,
				role: 'ADMIN',
			},
		})
	}

	// The demo access token identifies the seeded member.
	if (auth === 'Bearer mock-jwt-token') {
		return HttpResponse.json({
			user: {
				id: 'mock-user-id',
				username: 'johndoe',
				is_verified: isVerified(),
				role: 'MEMBER',
			},
		})
	}

	return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
})
```

### 2.5. Registrando os handlers

Vá na pasta `src/api/mocks` e, em `index.ts`, adicione os imports e registre os três
handlers de academia no `setupWorker`:

```ts
import { createGymMock } from './create-gym-mock'
import { nearbyGymsMock } from './nearby-gyms-mock'
import { searchGymsMock } from './search-gyms-mock'
```

```ts
// No final de setupWorker, adicione:
createGymMock,
nearbyGymsMock,
searchGymsMock,
```

### 2.6. Commit

```sh
pnpm lint && pnpm test:run
git add src
git commit -m "feat: gyms api + mocks"
```

---

## 3. A página de academias

A tela `/gyms` tem três modos de exibição que dependem do estado da geolocalização e da
busca. Para não espalhar `if`s pela marcação, o PM resolve tudo num único campo `status`:

- `locating` — ainda pedindo a localização ao navegador;
- `geo-denied` — GPS negado/indisponível (cai na busca por nome);
- `loading` — buscando no servidor;
- `empty` — respondeu, mas veio vazio;
- `list` — tem academias para mostrar.

Crie a pasta da página:

```sh
mkdir src/pages/app/gyms
```

Vá na pasta `src/pages/app/gyms` e crie `use-gyms-pm.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { getNearbyGyms } from '@/api/get-nearby-gyms'
import { searchGyms } from '@/api/search-gyms'
import { type Coordinates, getCurrentPosition } from '@/lib/geolocation'

const MIN_QUERY = 3
const PAGE_SIZE = 20

export type GymsStatus =
	| 'locating'
	| 'geo-denied'
	| 'loading'
	| 'empty'
	| 'list'

export function useGymsPM() {
	const [coords, setCoords] = useState<Coordinates | null>(null)
	const [geoError, setGeoError] = useState(false)
	const [query, setQuery] = useState('')
	const [page, setPage] = useState(1)

	// On mount: ask for the user's location. Granted → show nearby gyms;
	// denied/unavailable → fall back to search-by-name only.
	useEffect(() => {
		getCurrentPosition()
			.then((position) => setCoords(position))
			.catch(() => setGeoError(true))
	}, [])

	const trimmed = query.trim()
	const searching = trimmed.length >= MIN_QUERY

	const nearby = useQuery({
		queryKey: ['gyms', 'nearby', coords],
		queryFn: () => getNearbyGyms(coords!),
		enabled: coords !== null && !searching,
	})

	const search = useQuery({
		queryKey: ['gyms', 'search', trimmed, page],
		queryFn: () => searchGyms({ query: trimmed, page }),
		enabled: searching,
	})

	const active = searching ? search : nearby
	const gyms = active.data ?? []

	let status: GymsStatus
	if (active.isLoading) {
		status = 'loading'
	} else if (!coords && !geoError && !searching) {
		status = 'locating'
	} else if (geoError && !searching) {
		status = 'geo-denied'
	} else if (gyms.length === 0) {
		status = 'empty'
	} else {
		status = 'list'
	}

	function handleQueryChange(value: string) {
		setQuery(value)
		setPage(1)
	}

	return {
		query,
		page,
		gyms,
		status,
		searching,
		hasPrevPage: searching && page > 1,
		hasNextPage: searching && gyms.length === PAGE_SIZE,
		handleQueryChange,
		nextPage: () => setPage((current) => current + 1),
		prevPage: () => setPage((current) => Math.max(1, current - 1)),
	}
}
```

O pulo do gato é o `enabled` das duas queries: enquanto você não digita, só a `nearby` roda
(e só depois que a localização chega); a partir de 3 letras, a `nearby` desliga e a `search`
assume. Cada query tem sua própria chave, então o React Query cuida do cache de cada modo.

Vá na pasta `src/pages/app/gyms` e crie `gym-card.tsx` (cartão sem lógica — fica solto na
mesma pasta):

```tsx
import { MapPin, Phone } from 'lucide-react'

import type { Gym } from '@/api/search-gyms'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

export function GymCard({ gym }: { gym: Gym }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{gym.title}</CardTitle>
				{gym.description && (
					<CardDescription>{gym.description}</CardDescription>
				)}
			</CardHeader>
			<CardContent className='text-muted-foreground space-y-1 text-sm'>
				<div className='flex items-center gap-2'>
					<MapPin className='size-4 shrink-0' />
					<span>
						{gym.latitude.toFixed(4)}, {gym.longitude.toFixed(4)}
					</span>
				</div>
				{gym.phone && (
					<div className='flex items-center gap-2'>
						<Phone className='size-4 shrink-0' />
						<span>{gym.phone}</span>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
```

Vá na pasta `src/pages/app/gyms` e crie `gyms.tsx`:

```tsx
import { LoaderCircle } from 'lucide-react'

import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { GymCard } from './gym-card'
import { useGymsPM } from './use-gyms-pm'

export function Gyms() {
	const pm = useGymsPM()

	return (
		<>
			<PageTitle title='Gyms' />

			<div className='flex flex-1 flex-col gap-6 p-8'>
				<div>
					<h2 className='text-2xl font-medium'>Gyms</h2>
					<p className='text-muted-foreground text-sm'>
						Find a gym near you, or search by name.
					</p>
				</div>

				<Input
					placeholder='Search gyms by name…'
					value={pm.query}
					onChange={(event) =>
						pm.handleQueryChange(event.target.value)
					}
					className='max-w-md'
				/>

				{pm.status === 'geo-denied' && (
					<p className='text-muted-foreground text-sm'>
						Couldn&apos;t get your location — search by name above.
					</p>
				)}

				{pm.status === 'locating' && (
					<div className='text-muted-foreground flex items-center gap-2 text-sm'>
						<LoaderCircle className='size-4 animate-spin' />
						Finding gyms near you…
					</div>
				)}

				{pm.status === 'loading' && (
					<div className='text-muted-foreground flex items-center gap-2 text-sm'>
						<LoaderCircle className='size-4 animate-spin' />
						Loading gyms…
					</div>
				)}

				{pm.status === 'empty' && (
					<p className='text-muted-foreground text-sm'>
						{pm.searching
							? 'No gyms match your search.'
							: 'No gyms found near you.'}
					</p>
				)}

				{pm.status === 'list' && (
					<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{pm.gyms.map((gym) => (
							<GymCard key={gym.id} gym={gym} />
						))}
					</div>
				)}

				{pm.searching && (pm.hasPrevPage || pm.hasNextPage) && (
					<div className='flex items-center gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={pm.prevPage}
							disabled={!pm.hasPrevPage}
						>
							Previous
						</Button>
						<span className='text-muted-foreground text-sm'>
							Page {pm.page}
						</span>
						<Button
							variant='outline'
							size='sm'
							onClick={pm.nextPage}
							disabled={!pm.hasNextPage}
						>
							Next
						</Button>
					</div>
				)}
			</div>
		</>
	)
}
```

Agora registre a rota. Vá na pasta `src` e, em `routes.tsx`, importe a página e adicione-a
como filha do `AppLayout` (ao lado do `Home`):

```tsx
import { Gyms } from './pages/app/gyms/gyms'
```

```tsx
// Depois de:
element: <AppLayout />,
// Substitua o bloco children por:
children: [
	{ index: true, element: <Home /> },
	{ path: 'gyms', element: <Gyms /> },
],
```

Suba o app, faça login e clique em **Gyms** no sidebar. O navegador vai pedir permissão de
localização: permitindo, você vê as academias "perto de você"; negando, aparece o aviso e a
busca por nome assume. Digite `aqua` e veja a lista filtrar.

```sh
pnpm lint && pnpm test:run
git add src
git commit -m "feat: gyms page"
```

---

## 4. Guard por papel e criação de academia

Agora a parte restrita. Precisamos de três peças: uma tela de **403** (mostrada no lugar do
conteúdo, sem tirar o sidebar), o **guard** que decide quando mostrá-la, e o **formulário**
de criar academia. Antes, um respiro: vamos harmonizar as duas telas de status antigas (404
e erro) com o tema — elas ficaram com cores fixas (`slate`) lá do primeiro tutorial.

### 4.1. Harmonizando as telas de status (404 e erro)

As páginas `e404.tsx` e `error.tsx` vêm da Parte 1 e ainda usam cores fixas (`bg-slate-900`,
`text-slate-100`, …) em vez dos tokens do tema — ou seja, não respeitam claro/escuro. Como a
`Forbidden` (a seguir) é uma tela de status no mesmo espírito, alinhamos as três agora. De
quebra, o 404 troca o `<a>` por `Link` (navegação client-side) e conserta uma classe de hover
quebrada.

Vá na pasta `src/pages` e substitua o conteúdo de `error.tsx` por:

```tsx
import { useRouteError } from 'react-router'

import { PageTitle } from '@/components/title/page-title'

interface RouteError {
	statusText?: string
	message?: string
}

export function ErrorPage() {
	const error = useRouteError() as RouteError
	console.error(error)

	return (
		<>
			<PageTitle title='Error' />
			<div
				id='error-page'
				className='bg-background text-foreground flex h-screen flex-col items-center justify-center p-8'
			>
				<h1 className='text-3xl font-bold'>Oops!</h1>
				<p className='text-muted-foreground pt-1'>
					Sorry, an error occurred:
				</p>
				<p className='pt-3'>
					<i className='text-destructive'>
						{error.statusText || error.message}
					</i>
				</p>
			</div>
		</>
	)
}
```

Vá na pasta `src/pages` e substitua o conteúdo de `e404.tsx` por:

```tsx
import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'

export function NotFound() {
	return (
		<>
			<PageTitle title='Not Found' />
			<div className='bg-background text-foreground flex h-screen flex-col items-center justify-center p-8'>
				<h1 className='text-3xl font-bold'>404 - Page not found</h1>
				<p className='text-muted-foreground pt-3'>
					<Link
						to='/'
						className='hover:text-foreground hover:underline'
					>
						Return to homepage
					</Link>
				</p>
			</div>
		</>
	)
}
```

Esse é um ajuste de estilo, independente do guard, então fica no **seu próprio commit**, antes
do `feat` da seção:

```sh
pnpm lint && pnpm test:run
git add src
git commit -m "style: align status pages with theme tokens"
```

### 4.2. A tela de acesso negado

Vá na pasta `src/components/auth` e crie `forbidden.tsx`:

```tsx
import { ShieldX } from 'lucide-react'
import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'

export function Forbidden() {
	return (
		<>
			<PageTitle title='Forbidden' />

			<div className='flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center'>
				<ShieldX className='text-muted-foreground size-10' />
				<div>
					<h2 className='text-2xl font-medium'>403 — Admins only</h2>
					<p className='text-muted-foreground text-sm'>
						You don&apos;t have access to this page.
					</p>
				</div>
				<Button asChild>
					<Link to='/'>Back to dashboard</Link>
				</Button>
			</div>
		</>
	)
}
```

### 4.3. O guard genérico

O `RoleRoute` mora dentro do `ProtectedRoute` (então o usuário já está autenticado). Ele é
**genérico** — recebe quais papéis são permitidos — para reaproveitarmos na futura Parte 10
(área de admin). Se o papel não bate, renderiza o `Forbidden` no lugar do conteúdo; o
sidebar e o header continuam ali.

Vá na pasta `src/components/auth` e crie `role-route.tsx`:

```tsx
import { LoaderCircle } from 'lucide-react'
import { Outlet } from 'react-router'

import { type Role } from './auth-context'
import { useAuth } from './auth-hooks'
import { Forbidden } from './forbidden'

// Sits *inside* ProtectedRoute (so the user is already authed). Renders the
// child route only when the user's role is allowed; otherwise shows Forbidden
// in place — the surrounding layout (sidebar, header) stays put.
export function RoleRoute({ allow }: { allow: Role[] }) {
	const { status, user } = useAuth()

	if (status === 'loading') {
		return (
			<div className='flex flex-1 items-center justify-center p-8'>
				<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
			</div>
		)
	}

	if (!user || !allow.includes(user.role)) {
		return <Forbidden />
	}

	return <Outlet />
}
```

### 4.4. O formulário de criar academia

A validação espelha o backend: `title` obrigatório; `description` e `phone` opcionais
(`phone` segue o padrão do backend quando preenchido); `latitude`/`longitude` obrigatórios e
dentro da faixa. Tratamos lat/long como **string** no formulário (campo de texto vazio =
inválido) e convertemos para número só no envio.

Crie a pasta:

```sh
mkdir src/pages/app/new-gym
```

Vá na pasta `src/pages/app/new-gym` e crie `use-new-gym-pm.ts`:

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { createGym } from '@/api/create-gym'
import { getCurrentPosition } from '@/lib/geolocation'

// Mirrors the backend: title required; description/phone optional; phone must
// match the API's loose phone pattern; coordinates are required, in range.
const phonePattern = /^\+?[\d\s().-]{7,20}$/

function coordinate(label: string, max: number) {
	return z
		.string()
		.min(1, `${label} is required.`)
		.refine((value) => {
			const parsed = Number(value)
			return !Number.isNaN(parsed) && parsed >= -max && parsed <= max
		}, `Enter a valid ${label.toLowerCase()}.`)
}

const newGymForm = z.object({
	title: z.string().min(1, 'Title is required.'),
	description: z.string(),
	phone: z
		.string()
		.regex(phonePattern, 'Enter a valid phone number.')
		.or(z.literal('')),
	latitude: coordinate('Latitude', 90),
	longitude: coordinate('Longitude', 180),
})
type NewGymForm = z.infer<typeof newGymForm>

export function useNewGymPM() {
	const navigate = useNavigate()
	const [locating, setLocating] = useState(false)

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<NewGymForm>({
		resolver: zodResolver(newGymForm),
		defaultValues: {
			title: '',
			description: '',
			phone: '',
			latitude: '',
			longitude: '',
		},
	})

	const { mutateAsync: submitGym } = useMutation({ mutationFn: createGym })

	async function handleUseMyLocation() {
		setLocating(true)
		try {
			const position = await getCurrentPosition()
			setValue('latitude', String(position.latitude))
			setValue('longitude', String(position.longitude))
		} catch {
			toast.error('Could not get your location.')
		} finally {
			setLocating(false)
		}
	}

	async function onSubmit(data: NewGymForm) {
		try {
			const gym = await submitGym({
				title: data.title,
				description: data.description || null,
				phone: data.phone || null,
				latitude: Number(data.latitude),
				longitude: Number(data.longitude),
			})
			toast.success(`Gym "${gym.title}" created.`)
			navigate('/gyms')
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not create the gym.'
			toast.error(message)
		}
	}

	return {
		register,
		errors,
		isSubmitting,
		locating,
		handleUseMyLocation,
		handleSubmit: handleSubmit(onSubmit),
	}
}
```

Vá na pasta `src/pages/app/new-gym` e crie `new-gym.tsx`:

```tsx
import { Crosshair } from 'lucide-react'

import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useNewGymPM } from './use-new-gym-pm'

export function NewGym() {
	const pm = useNewGymPM()

	return (
		<>
			<PageTitle title='New gym' />

			<div className='flex flex-1 justify-center p-8'>
				<Card className='w-full max-w-lg'>
					<CardHeader>
						<CardTitle>New gym</CardTitle>
						<CardDescription>
							Register a gym members can check in to.
						</CardDescription>
					</CardHeader>

					<CardContent>
						<form onSubmit={pm.handleSubmit} noValidate>
							<div className='flex flex-col gap-6'>
								<div className='grid gap-2'>
									<Label htmlFor='title'>Title</Label>
									<Input
										id='title'
										{...pm.register('title')}
									/>
									{pm.errors.title && (
										<p className='text-destructive text-sm'>
											{pm.errors.title.message}
										</p>
									)}
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='description'>
										Description
									</Label>
									<Input
										id='description'
										{...pm.register('description')}
									/>
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='phone'>Phone</Label>
									<Input
										id='phone'
										{...pm.register('phone')}
									/>
									{pm.errors.phone && (
										<p className='text-destructive text-sm'>
											{pm.errors.phone.message}
										</p>
									)}
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div className='grid gap-2'>
										<Label htmlFor='latitude'>
											Latitude
										</Label>
										<Input
											id='latitude'
											{...pm.register('latitude')}
										/>
										{pm.errors.latitude && (
											<p className='text-destructive text-sm'>
												{pm.errors.latitude.message}
											</p>
										)}
									</div>
									<div className='grid gap-2'>
										<Label htmlFor='longitude'>
											Longitude
										</Label>
										<Input
											id='longitude'
											{...pm.register('longitude')}
										/>
										{pm.errors.longitude && (
											<p className='text-destructive text-sm'>
												{pm.errors.longitude.message}
											</p>
										)}
									</div>
								</div>

								<Button
									type='button'
									variant='outline'
									onClick={pm.handleUseMyLocation}
									disabled={pm.locating}
								>
									<Crosshair />
									Use my current location
								</Button>

								<Button
									type='submit'
									disabled={pm.isSubmitting}
									className='w-full'
								>
									Create gym
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	)
}
```

### 4.5. A rota protegida por papel

Vá na pasta `src`, em `routes.tsx`, importe o guard e a página:

```tsx
import { RoleRoute } from './components/auth/role-route'
import { NewGym } from './pages/app/new-gym/new-gym'
```

E aninhe a rota `/gyms/new` dentro de um `RoleRoute` (logo abaixo da rota `/gyms`):

```tsx
// Depois de:
element: <AppLayout />,
children: [
	{ index: true, element: <Home /> },
	{ path: 'gyms', element: <Gyms /> },
	// Adicione esse bloco em children:
	{
		element: <RoleRoute allow={['ADMIN']} />,
		children: [
			{
				path: 'gyms/new',
				element: <NewGym />,
			},
		],
	},
],
```

Para testar à mão sem backend: faça logout, entre com o identificador **`admin`** e a senha
`Password1!`. O badge no rodapé vira **Admin** e o item **New gym** aparece no sidebar. Crie
uma academia (use o botão "Use my current location" para preencher as coordenadas) — o toast
de sucesso aparece e você volta para a lista.

```sh
pnpm lint && pnpm test:run
git add src
git commit -m "feat: create-gym page + role guard"
```

---

## 5. Testes

Como sempre: **unit** cobre validação e lógica que não precisa de rede; **e2e** cobre os
fluxos completos contra o MSW.

### 5.1. Unit — formulário e guard

Vá na pasta `src/pages/app/new-gym` e crie `new-gym.spec.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../../../../test/utils'
import { NewGym } from './new-gym'

describe('NewGym form', () => {
	it('requires title and coordinates before creating', async () => {
		const user = userEvent.setup()
		renderWithProviders(<NewGym />, { route: '/gyms/new' })

		await user.click(screen.getByRole('button', { name: 'Create gym' }))

		expect(
			await screen.findByText('Title is required.'),
		).toBeInTheDocument()
		expect(screen.getByText('Latitude is required.')).toBeInTheDocument()
		expect(screen.getByText('Longitude is required.')).toBeInTheDocument()
	})
})
```

Para o guard, montamos um mini-roteador e injetamos um `AuthContext` com o papel que
queremos testar. Vá na pasta `src/components/auth` e crie `role-route.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import {
	AuthContext,
	type AuthContextValue,
	type Role,
} from '@/components/auth/auth-context'

import { RoleRoute } from './role-route'

function renderWithRole(role: Role) {
	const value: AuthContextValue = {
		status: 'authed',
		user: { id: 'u1', username: 'tester', isVerified: true, role },
		signIn: async () => {},
		signOut: async () => {},
		reloadUser: async () => {},
	}

	return render(
		<AuthContext.Provider value={value}>
			<MemoryRouter initialEntries={['/secret']}>
				<Routes>
					<Route element={<RoleRoute allow={['ADMIN']} />}>
						<Route
							path='/secret'
							element={<div>secret content</div>}
						/>
					</Route>
				</Routes>
			</MemoryRouter>
		</AuthContext.Provider>,
	)
}

describe('RoleRoute', () => {
	it('shows Forbidden when the role is not allowed', () => {
		renderWithRole('MEMBER')

		expect(screen.getByText('403 — Admins only')).toBeInTheDocument()
		expect(screen.queryByText('secret content')).not.toBeInTheDocument()
	})

	it('renders the child route when the role is allowed', () => {
		renderWithRole('ADMIN')

		expect(screen.getByText('secret content')).toBeInTheDocument()
	})
})
```

> **Por que o "403 por URL direta" é unit, e não e2e?** No modo mock o `refresh` sempre
> responde `401` (não guardamos sessão entre reloads). Um `page.goto('/gyms/new')` no e2e
> recarrega a página → vira "guest" → o `ProtectedRoute` manda para `/sign-in`, e nunca
> chegaríamos no `Forbidden`. Então o caminho "membro abre a URL restrita e vê 403" fica no
> unit acima (que controla o `AuthContext` diretamente). No **backend real**, com o cookie
> de refresh funcionando, esse caminho funciona de verdade — você confere no smoke (§6).

### 5.2. e2e — navegar, buscar e criar

A página depende de geolocalização; o Playwright permite conceder uma posição fixa por
arquivo com `test.use({ geolocation, permissions })`. E lembrando do parágrafo acima: depois
do login, navegamos **clicando nos links** (sem `page.goto` em rota protegida, que perderia
a sessão no mock).

Vá na pasta `test` e crie `gyms.spec.ts`:

```ts
import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

// Grant a fixed location so the "nearby" flow resolves deterministically.
test.use({
	geolocation: { latitude: -23.55, longitude: -46.63 },
	permissions: ['geolocation'],
})

async function signIn(page: Page, identifier: string) {
	await page.goto('/sign-in')
	await page.getByLabel('Email or username').fill(identifier)
	await page.getByLabel('Password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign in' }).click()
	await expect(page).toHaveURL('/')
}

test('member browses nearby gyms and searches by name', async ({ page }) => {
	await signIn(page, 'johndoe')

	await page.getByRole('link', { name: 'Gyms' }).click()
	await expect(page).toHaveURL('/gyms')

	// Geolocation granted → the seeded "nearby" gyms render.
	await expect(page.getByText('Iron Temple')).toBeVisible()

	// Typing (>= 3 chars) switches to search and filters by name.
	await page.getByPlaceholder('Search gyms by name…').fill('aqua')
	await expect(page.getByText('Aqua Fitness')).toBeVisible()
	await expect(page.getByText('Iron Temple')).toBeHidden()

	await waitForUIInspection(page)
})

test('member does not see the New gym link', async ({ page }) => {
	await signIn(page, 'johndoe')

	await expect(page.getByRole('link', { name: 'New gym' })).toHaveCount(0)

	await waitForUIInspection(page)
})

test('admin creates a gym from the New gym page', async ({ page }) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'New gym' }).click()
	await expect(page).toHaveURL('/gyms/new')

	await page.getByLabel('Title').fill('Night Owl Gym')
	await page.getByLabel('Latitude').fill('-23.5')
	await page.getByLabel('Longitude').fill('-46.6')
	await page.getByRole('button', { name: 'Create gym' }).click()

	await expect(page.getByText('Gym "Night Owl Gym" created.')).toBeVisible()
	await expect(page).toHaveURL('/gyms')
	await expect(page.getByText('Night Owl Gym')).toBeVisible()

	await waitForUIInspection(page)
})
```

Rode as duas suítes:

```sh
pnpm test:run
pnpm e2e
```

```sh
git add src test
git commit -m "test: cover gyms + role guard"
```

---

## 6. Smoke test no backend real

Hora de validar contra o backend de verdade.

### 6.1. Subir tudo

No backend (`solid_api_sample`): `git pull`, confira o `.env` da Parte 6 (com
`APP_URL=http://localhost:3001`) e suba com `pnpm dev` (porta 3333). Se a porta estiver
presa, use `pnpm killapp`.

No frontend: `pnpm dev` (porta 3001).

### 6.2. Criar um membro

Registre um usuário comum pela tela de cadastro (o username aceita só letras, números e
underscore — por isso `peter_parker`, não `peter.parker`):

```
peter_parker
```

```
peter.parker@example.com
```

```
Password1!
```

Entre com ele, clique em **Gyms** e permita a localização. Como o banco provavelmente está
sem academias, você verá "No gyms found near you" — normal, vamos criar uma já já. Repare que
o item **New gym** **não** aparece no sidebar (ele é membro) e o badge mostra **Member**.

### 6.3. Promover a admin

O primeiro admin nasce direto no banco (o `role` vem do JWT, então vale após um novo login).
Abra o Prisma Studio no backend:

```sh
pnpm showdb
```

O script roda com `--browser none`, então não abre a aba sozinho — acesse
`http://localhost:5555` no navegador. Na tabela `users`, ache `peter_parker`, troque `role`
de `MEMBER` para `ADMIN` e salve. Volte ao app, faça **logout e login de novo** (para o token
trazer o papel novo).

### 6.4. Criar uma academia (como admin)

Agora o badge mostra **Admin** e o item **New gym** aparece. Abra-o e cadastre:

```
Iron Temple
```

```
Heavy lifting downtown
```

```
+5511970000001
```

Clique em **Use my current location** para preencher latitude/longitude (ou digite à mão) e
em **Create gym**. O toast confirma e você cai na lista, já com a academia nova.

### 6.5. Conferir as restrições

- Buscar funciona: digite parte do nome ("iron") e a academia aparece.
- No backend real o cookie de refresh persiste, então dá para conferir o **403 por URL
  direta**: ainda logado como **membro** (faça logout do admin e entre com outro usuário
  comum, ou rebaixe o `role` no Studio e relogue), digite `localhost:3001/gyms/new` na barra
  de endereço. A página recarrega, a sessão é restaurada e o `RoleRoute` mostra **403 —
  Admins only**, com o sidebar intacto. O item continua escondido no menu.

Deu tudo certo? Parte 8 fechada. ✅

---

## 7. O que vem a seguir

Temos academias e a primeira tela restrita por papel. As próximas partes:

- **Parte 9 — Check-ins.** `POST /gyms/:gymId/check-ins`, histórico e métricas, e a
  validação de check-in pelo admin. É aqui que demonstramos o **gate de email verificado**:
  com a flag desligada o check-in passa; ligando `REQUIRE_EMAIL_VERIFICATION=true` e
  reiniciando, o backend devolve `403` até o usuário verificar o email (o fluxo da Parte 7).
- **Parte 10 — Edição e permissões.** Edição da própria conta (incluindo troca de email) e a
  área de admin (listar e editar usuários/academias), toda atrás do `RoleRoute` que acabamos
  de criar.

    **Commit da documentação.** Por fim, versione este arquivo sozinho:

```sh
git add TUTORIAL_08_gyms.md
git commit -m "docs: add part 8 tutorial (gyms + sidebar)"
```

```

```

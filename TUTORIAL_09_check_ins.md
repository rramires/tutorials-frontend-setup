# Parte 9 — Check-ins e o dashboard

Na Parte 8 o app ganhou academias e a primeira tela restrita por papel. Agora ele ganha
**ação**: o usuário **bate ponto** (check-in) numa academia, vê seu **histórico**, e o admin
**valida** check-ins. De quebra, a **Home** (que até aqui só dizia "Home Page!") vira um
**dashboard pessoal leve** — total de check-ins e um gráfico da atividade recente.

A estrela da parte é a **demo do gate de email**: o backend tem uma flag
(`REQUIRE_EMAIL_VERIFICATION`) que protege **só** o check-in. Com ela desligada, qualquer um
bate ponto; ligando-a, um usuário com email não verificado leva `403` até confirmar o email
(o fluxo da Parte 7). É a primeira vez que a verificação de email vira uma _trava de verdade_
no produto.

Quatro rotas do backend entram em cena:

| Rota                                   | Quem usa        | O que faz                                          |
| -------------------------------------- | --------------- | -------------------------------------------------- |
| `POST /gyms/:gymId/check-ins`          | qualquer logado | bate ponto (`201`); gateado por email se a flag on |
| `GET /check-ins/history?page=`         | qualquer logado | meu histórico (20 por página)                      |
| `GET /check-ins/metrics`               | qualquer logado | meu total de check-ins                             |
| `PATCH /check-ins/:checkInId/validate` | **só ADMIN**    | valida um check-in (`200`)                         |

O `CheckIn` que volta é `{ id, created_at, validated_at, user_id, gym_id }` — `validated_at`
é `null` até um admin validar.

**Três regras de negócio** moram no backend (e você vai senti-las no smoke):

- **Distância:** o check-in só passa se você estiver a **≤ 100 m** da academia. O corpo do
  `POST` manda a **sua** localização; o backend compara com a da academia.
- **Um por dia:** o segundo check-in no mesmo dia é recusado.
- **Janela de validação:** o admin só valida um check-in até **20 min** depois de criado.

> **Sobre os códigos de erro.** Essas três regras devolvem **4xx** com uma `message` legível
> (`400 "Max distance reached."`, `409 "Max check-ins reached."`,
> `409 "The check-in can only be validated until 20 minutes of its creation."`). Garanta o
> backend atualizado (`git pull` em `solid_api_sample`) — versões antigas devolviam `500`
> nesses casos. No front, a regra é simples: **em qualquer 4xx, mostre `data.message` no
> toast**; `5xx` é erro inesperado (mensagem genérica).

Seguimos o pipeline de sempre: **mock-first → MSW → unit → e2e → backend real**. Cada seção
tem seu commit.

---

## 1. A API de check-ins e os mocks

### 1.1. As funções de API

São quatro chamadas. Comece pelo histórico, porque é ele que define o tipo `CheckIn` que as
outras reaproveitam.

Vá na pasta `src/api` e crie `get-check-ins-history.ts`:

```ts
import { api } from '@/lib/api'

export interface CheckIn {
	id: string
	created_at: string
	validated_at: string | null
	user_id: string
	gym_id: string
}

interface HistoryResponse {
	checkIns: CheckIn[]
}

export interface GetCheckInsHistoryParams {
	page?: number
}

export async function getCheckInsHistory({
	page = 1,
}: GetCheckInsHistoryParams = {}) {
	const response = await api.get<HistoryResponse>('/check-ins/history', {
		params: { page },
	})

	return response.data.checkIns
}
```

Vá na pasta `src/api` e crie `get-check-ins-metrics.ts`:

```ts
import { api } from '@/lib/api'

interface MetricsResponse {
	checkInsCount: number
}

export async function getCheckInsMetrics() {
	const response = await api.get<MetricsResponse>('/check-ins/metrics')

	return response.data.checkInsCount
}
```

Vá na pasta `src/api` e crie `create-check-in.ts`:

```ts
import { api } from '@/lib/api'

import { type CheckIn } from './get-check-ins-history'

export interface CreateCheckInParams {
	gymId: string
	latitude: number
	longitude: number
}

interface CreateCheckInResponse {
	checkIn: CheckIn
}

export async function createCheckIn({
	gymId,
	latitude,
	longitude,
}: CreateCheckInParams) {
	const response = await api.post<CreateCheckInResponse>(
		`/gyms/${gymId}/check-ins`,
		{ latitude, longitude },
	)

	return response.data.checkIn
}
```

Vá na pasta `src/api` e crie `validate-check-in.ts`:

```ts
import { api } from '@/lib/api'

import { type CheckIn } from './get-check-ins-history'

interface ValidateCheckInResponse {
	checkIn: CheckIn
}

export async function validateCheckIn(checkInId: string) {
	const response = await api.patch<ValidateCheckInResponse>(
		`/check-ins/${checkInId}/validate`,
	)

	return response.data.checkIn
}
```

### 1.2. Os mocks

O mock precisa de um **estado** próprio (a lista de check-ins) e de um jeito de saber **quem**
está pedindo — porque history e metrics são "os meus". Os tokens de demo da Parte 8 mapeiam
para os ids que o mock de `/auth/me` devolve.

Vá na pasta `src/api/mocks` e crie `check-ins-data.ts`:

```ts
import type { CheckIn } from '../get-check-ins-history'

// Mock-only in-memory store for check-ins. Maps the demo tokens to the seeded
// user ids the /auth/me mock returns, so history/metrics scope to "me".
export function userIdFromAuth(authHeader: string | null) {
	if (authHeader === 'Bearer mock-admin-jwt-token') {
		return 'mock-admin-id'
	}
	if (authHeader === 'Bearer mock-jwt-token') {
		return 'mock-user-id'
	}
	return null
}

// ISO timestamp for `n` days ago at noon (noon avoids timezone day-boundary
// flakiness when the chart buckets by calendar day).
function daysAgo(n: number) {
	const date = new Date()
	date.setDate(date.getDate() - n)
	date.setHours(12, 0, 0, 0)
	return date.toISOString()
}

let nextId = 1000

export function nextCheckInId() {
	return `check-in-${nextId++}`
}

// Seeded history for the demo member (mock-user-id). "Today" is left empty so
// the member can create a fresh check-in in the e2e flow without hitting the
// one-per-day rule. Spread across the past week so the activity chart has shape.
export const checkIns: CheckIn[] = [
	{
		id: 'check-in-1',
		created_at: daysAgo(1),
		validated_at: daysAgo(1),
		user_id: 'mock-user-id',
		gym_id: 'gym-1',
	},
	{
		id: 'check-in-2',
		created_at: daysAgo(2),
		validated_at: daysAgo(2),
		user_id: 'mock-user-id',
		gym_id: 'gym-2',
	},
	{
		id: 'check-in-3',
		created_at: daysAgo(2),
		validated_at: null,
		user_id: 'mock-user-id',
		gym_id: 'gym-1',
	},
	{
		id: 'check-in-4',
		created_at: daysAgo(4),
		validated_at: daysAgo(4),
		user_id: 'mock-user-id',
		gym_id: 'gym-3',
	},
	{
		id: 'check-in-5',
		created_at: daysAgo(6),
		validated_at: null,
		user_id: 'mock-user-id',
		gym_id: 'gym-4',
	},
]
```

Agora os quatro handlers. Vá na pasta `src/api/mocks` e crie `check-in-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import { checkIns, nextCheckInId, userIdFromAuth } from './check-ins-data'
import { gyms } from './gyms-data'

interface CheckInBody {
	latitude: number
	longitude: number
}

function isSameDay(iso: string, reference: Date) {
	const date = new Date(iso)
	return (
		date.getFullYear() === reference.getFullYear() &&
		date.getMonth() === reference.getMonth() &&
		date.getDate() === reference.getDate()
	)
}

export const checkInMock = http.post<{ gymId: string }, CheckInBody>(
	'/gyms/:gymId/check-ins',
	({ params, request }) => {
		const userId = userIdFromAuth(request.headers.get('Authorization'))
		if (!userId) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		// Gym must exist (real backend → 404 ResourceNotFoundError).
		const gym = gyms.find((candidate) => candidate.id === params.gymId)
		if (!gym) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// One check-in per day per user (real backend → 409 MaxCheckInsReached).
		// The mock skips the 100m-distance rule: it can't know the gym's real
		// coordinates relative to the browser's geolocation.
		const now = new Date()
		const already = checkIns.some(
			(checkIn) =>
				checkIn.user_id === userId &&
				isSameDay(checkIn.created_at, now),
		)
		if (already) {
			return HttpResponse.json(
				{ message: 'Max check-ins reached.' },
				{ status: 409 },
			)
		}

		const checkIn = {
			id: nextCheckInId(),
			created_at: now.toISOString(),
			validated_at: null,
			user_id: userId,
			gym_id: params.gymId,
		}
		checkIns.push(checkIn)

		return HttpResponse.json({ checkIn }, { status: 201 })
	},
)
```

Vá na pasta `src/api/mocks` e crie `check-ins-history-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import { checkIns, userIdFromAuth } from './check-ins-data'

const PAGE_SIZE = 20

export const checkInsHistoryMock = http.get(
	'/check-ins/history',
	({ request }) => {
		const userId = userIdFromAuth(request.headers.get('Authorization'))
		if (!userId) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		const url = new URL(request.url)
		const page = Number(url.searchParams.get('page') ?? '1')

		const mine = checkIns
			.filter((checkIn) => checkIn.user_id === userId)
			.sort((a, b) => b.created_at.localeCompare(a.created_at))

		const start = (page - 1) * PAGE_SIZE
		const paged = mine.slice(start, start + PAGE_SIZE)

		return HttpResponse.json({ checkIns: paged })
	},
)
```

Vá na pasta `src/api/mocks` e crie `check-ins-metrics-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import { checkIns, userIdFromAuth } from './check-ins-data'

export const checkInsMetricsMock = http.get(
	'/check-ins/metrics',
	({ request }) => {
		const userId = userIdFromAuth(request.headers.get('Authorization'))
		if (!userId) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		const checkInsCount = checkIns.filter(
			(checkIn) => checkIn.user_id === userId,
		).length

		return HttpResponse.json({ checkInsCount })
	},
)
```

Vá na pasta `src/api/mocks` e crie `validate-check-in-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import { checkIns } from './check-ins-data'

export const validateCheckInMock = http.patch<{ checkInId: string }>(
	'/check-ins/:checkInId/validate',
	({ params, request }) => {
		// Mirror the backend RBAC: only an admin may validate (real backend →
		// 403 via verifyUserRole(ADMIN)).
		if (
			request.headers.get('Authorization') !==
			'Bearer mock-admin-jwt-token'
		) {
			return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
		}

		const checkIn = checkIns.find(
			(candidate) => candidate.id === params.checkInId,
		)
		if (!checkIn) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// The mock skips the 20-minute window (real backend → 409 on a late
		// validation); a time-based rule can't be exercised deterministically.
		checkIn.validated_at = new Date().toISOString()

		return HttpResponse.json({ checkIn })
	},
)
```

> **O que o mock simplifica de propósito.** Ele faz cumprir o que dá para testar de forma
> determinística: precisa de token (`401`), academia existente (`404`), só admin valida
> (`403`) e **um check-in por dia** (`409`). Ele **não** simula a **distância de 100 m**, a
> **janela de 20 min** nem o **gate de email** — essas três são comportamento de tempo/ambiente
> que só fazem sentido no backend real, e é lá (no smoke) que a gente as exercita. É a mesma
> lição da Parte 8 com o `Decimal`: o mock é um contrato fiel **onde dá**, e o smoke cobre o
> resto.

### 1.3. Registrando os handlers

Vá na pasta `src/api/mocks` e abra `index.ts`. Junte estes imports aos que já existem (em
ordem alfabética):

```ts
import { checkInMock } from './check-in-mock'
import { checkInsHistoryMock } from './check-ins-history-mock'
import { checkInsMetricsMock } from './check-ins-metrics-mock'
import { validateCheckInMock } from './validate-check-in-mock'
```

E acrescente **só** estas quatro linhas ao final da lista de handlers do `setupWorker` (logo
depois de `searchGymsMock`, sem repetir nenhum dos que já estão lá):

```ts
// Adicione no final do setupWorker:
checkInMock,
checkInsHistoryMock,
checkInsMetricsMock,
validateCheckInMock,
```

### 1.4. Commit

```sh
pnpm lint:fix && pnpm test:run
git add src
git commit -m "feat: check-ins api + mocks"
```

---

## 2. Bater ponto a partir do card

O botão "Check in" mora no `GymCard` da página de academias. Ao clicar, ele lê a localização
do navegador e manda o check-in. Como essa ação invalida o histórico **e** as métricas (o
dashboard reage), vale extrair a lógica para um **hook reutilizável** em vez de enfiá-la no
card.

### 2.1. O hook `use-check-in`

Vá na pasta `src/hooks` e crie `use-check-in.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

import { createCheckIn } from '@/api/create-check-in'
import { getCurrentPosition } from '@/lib/geolocation'

// Reusable check-in action: reads the browser's location, posts the check-in,
// then invalidates the check-in queries so the history page and the dashboard
// (metrics + recent activity) refetch. One hook instance per call site, so a
// card's own button is the only one that shows a pending state.
export function useCheckIn() {
	const queryClient = useQueryClient()
	const [locating, setLocating] = useState(false)

	const { mutateAsync, isPending } = useMutation({
		mutationFn: createCheckIn,
	})

	async function handleCheckIn(gymId: string) {
		setLocating(true)
		let position
		try {
			position = await getCurrentPosition()
		} catch {
			toast.error('Could not get your location.')
			return
		} finally {
			setLocating(false)
		}

		try {
			await mutateAsync({
				gymId,
				latitude: position.latitude,
				longitude: position.longitude,
			})
			toast.success('Checked in!')
			await queryClient.invalidateQueries({ queryKey: ['check-ins'] })
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not check in.'
			toast.error(message)
		}
	}

	return {
		handleCheckIn,
		isCheckingIn: locating || isPending,
	}
}
```

Repare no `catch` do `mutateAsync`: ele mostra `err.response?.data?.message`. É exatamente o
contrato de erro da abertura — "longe demais" e "já bateu hoje" chegam como `message` num
`4xx` e viram o texto do toast, sem nenhum mapa de códigos no cliente.

### 2.2. O botão no `GymCard`

Vá na pasta `src/pages/app/gyms` e abra `gym-card.tsx`. Ele ganha um rodapé com o botão, e o
card vira uma coluna flex para o rodapé alinhar embaixo mesmo quando as descrições têm
tamanhos diferentes:

```tsx
import { CircleCheck, LoaderCircle, MapPin, Phone } from 'lucide-react'

import type { Gym } from '@/api/search-gyms'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useCheckIn } from '@/hooks/use-check-in'

export function GymCard({ gym }: { gym: Gym }) {
	const { handleCheckIn, isCheckingIn } = useCheckIn()

	return (
		<Card className='flex flex-col'>
			<CardHeader>
				<CardTitle>{gym.title}</CardTitle>
				{gym.description && (
					<CardDescription>{gym.description}</CardDescription>
				)}
			</CardHeader>
			<CardContent className='text-muted-foreground flex-1 space-y-1 text-sm'>
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
			<CardFooter>
				<Button
					variant='outline'
					className='w-full'
					disabled={isCheckingIn}
					onClick={() => handleCheckIn(gym.id)}
				>
					{isCheckingIn ? (
						<LoaderCircle className='size-4 animate-spin' />
					) : (
						<CircleCheck className='size-4' />
					)}
					Check in
				</Button>
			</CardFooter>
		</Card>
	)
}
```

### 2.3. Commit

```sh
pnpm lint:fix && pnpm test:run
git add src
git commit -m "feat: check-in from the gym card"
```

---

## 3. A página de histórico (`/check-ins`)

A tela lista os **meus** check-ins, cada um com um selo **Validated** ou **Pending**. Se o
usuário for **admin**, cada check-in pendente ganha um botão **Validate** — é o complemento do
guard da Parte 8: lá protegemos uma _rota_ por papel; aqui escondemos uma _ação_ por papel.

### 3.1. O PM

Crie a pasta da página:

```sh
mkdir src/pages/app/check-ins
```

Vá na pasta `src/pages/app/check-ins` e crie `use-check-ins-pm.ts`. Repare que ele **formata a
data aqui** e expõe `items` já prontos (`{ id, date, validated }`) — formatar é apresentação,
então mora na PM; a view só renderiza a string:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

import { getCheckInsHistory } from '@/api/get-check-ins-history'
import { validateCheckIn } from '@/api/validate-check-in'
import { useAuth } from '@/components/auth/auth-hooks'

const PAGE_SIZE = 20

const dateFormatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: 'medium',
	timeStyle: 'short',
})

export type CheckInsStatus = 'loading' | 'empty' | 'list'

// View model: the raw CheckIn shaped for display (formatted date + a flag),
// so the view stays pure markup.
export interface CheckInItem {
	id: string
	date: string
	validated: boolean
}

export function useCheckInsPM() {
	const { user } = useAuth()
	const queryClient = useQueryClient()
	const [page, setPage] = useState(1)

	const { data: checkIns = [], isLoading } = useQuery({
		queryKey: ['check-ins', 'history', page],
		queryFn: () => getCheckInsHistory({ page }),
	})

	const validate = useMutation({
		mutationFn: validateCheckIn,
		onSuccess: () => {
			toast.success('Check-in validated.')
			queryClient.invalidateQueries({ queryKey: ['check-ins'] })
		},
		onError: (err) => {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not validate the check-in.'
			toast.error(message)
		},
	})

	const items: CheckInItem[] = checkIns.map((checkIn) => ({
		id: checkIn.id,
		date: dateFormatter.format(new Date(checkIn.created_at)),
		validated: checkIn.validated_at !== null,
	}))

	let status: CheckInsStatus
	if (isLoading) {
		status = 'loading'
	} else if (checkIns.length === 0) {
		status = 'empty'
	} else {
		status = 'list'
	}

	return {
		items,
		status,
		page,
		hasPrevPage: page > 1,
		hasNextPage: checkIns.length === PAGE_SIZE,
		nextPage: () => setPage((current) => current + 1),
		prevPage: () => setPage((current) => Math.max(1, current - 1)),
		// Validating is an ADMIN-only action; members never see the button.
		isAdmin: user?.role === 'ADMIN',
		validateCheckIn: (id: string) => validate.mutate(id),
		validatingId: validate.isPending ? validate.variables : null,
	}
}
```

> **`validate.variables`**, sem estado extra. O React Query guarda o argumento da mutation em
> andamento; como o nosso é o `checkInId`, dá para saber **qual** linha está validando
> (`validatingId`) sem um `useState` à parte.

### 3.2. A view

A lista de check-ins traz só `gym_id`, não o nome da academia (o backend não expõe um
`GET /gyms/:id` público). Então a linha mostra a **data/hora** como informação principal, o
selo de estado, e — para admin em pendentes — o botão Validate.

Vá na pasta `src/pages/app/check-ins` e crie `check-ins.tsx`:

```tsx
import { CircleCheck, Clock, LoaderCircle } from 'lucide-react'

import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { useCheckInsPM } from './use-check-ins-pm'

export function CheckIns() {
	const pm = useCheckInsPM()

	return (
		<>
			<PageTitle title='Check-ins' />

			<div className='flex flex-1 flex-col gap-6 p-8'>
				<div>
					<h2 className='text-2xl font-medium'>Check-ins</h2>
					<p className='text-muted-foreground text-sm'>
						Your recent gym check-ins.
					</p>
				</div>

				{pm.status === 'loading' && (
					<div className='text-muted-foreground flex items-center gap-2 text-sm'>
						<LoaderCircle className='size-4 animate-spin' />
						Loading check-ins…
					</div>
				)}

				{pm.status === 'empty' && (
					<p className='text-muted-foreground text-sm'>
						No check-ins yet — check in from the Gyms page.
					</p>
				)}

				{pm.status === 'list' && (
					<ul className='divide-y rounded-md border'>
						{pm.items.map((item) => (
							<li
								key={item.id}
								className='flex items-center justify-between gap-4 p-4'
							>
								<div className='flex items-center gap-3'>
									{item.validated ? (
										<CircleCheck className='size-5 shrink-0 text-emerald-600' />
									) : (
										<Clock className='text-muted-foreground size-5 shrink-0' />
									)}
									<span className='text-sm'>{item.date}</span>
								</div>

								<div className='flex items-center gap-3'>
									<Badge
										variant={
											item.validated
												? 'default'
												: 'outline'
										}
									>
										{item.validated
											? 'Validated'
											: 'Pending'}
									</Badge>

									{pm.isAdmin && !item.validated && (
										<Button
											size='sm'
											variant='outline'
											disabled={
												pm.validatingId === item.id
											}
											onClick={() =>
												pm.validateCheckIn(item.id)
											}
										>
											{pm.validatingId === item.id ? (
												<LoaderCircle className='size-4 animate-spin' />
											) : null}
											Validate
										</Button>
									)}
								</div>
							</li>
						))}
					</ul>
				)}

				{pm.status === 'list' && (pm.hasPrevPage || pm.hasNextPage) && (
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

### 3.3. A rota e o item no sidebar

Vá na pasta `src` e abra `routes.tsx`. Importe a página e adicione a rota ao lado de `gyms`
(dentro do `AppLayout`, antes do bloco do `RoleRoute`):

```tsx
import { CheckIns } from './pages/app/check-ins/check-ins'
```

```tsx
// Depois de:
{ path: 'gyms', element: <Gyms /> },
// Adicione:
{ path: 'check-ins', element: <CheckIns /> },
```

Agora o link no menu. Vá na pasta `src/components/app-sidebar` e abra `use-app-sidebar-pm.ts`.
Adicione o ícone `History` ao import do `lucide-react` e o item ao array (entre Gyms e o item
de admin):

```ts
import { Dumbbell, History, LayoutDashboard, Plus } from 'lucide-react'
```

```ts
// Depois de:
{ to: '/gyms', label: 'Gyms', icon: Dumbbell },
// Adicione:
{ to: '/check-ins', label: 'Check-ins', icon: History },
```

### 3.4. Commit

```sh
pnpm lint:fix && pnpm test:run
git add src
git commit -m "feat: check-ins history page"
```

---

## 4. A Home vira dashboard

Até aqui a Home só dizia "Home Page!". Agora ela vira um **dashboard pessoal leve**, com o que
o backend atual já entrega: o **total de check-ins** (`metrics`) e um gráfico de **atividade
recente** montado a partir da página 1 do histórico, agrupada por dia.

> **Por que "recente" e não "all-time".** O backend não tem um endpoint agregado por dia, e o
> histórico vem paginado. Então o gráfico rotula honestamente os **últimos 7 dias** a partir da
> primeira página — sem inventar uma série histórica que o backend não tem.

### 4.1. O componente de gráfico (shadcn + recharts)

O shadcn tem um wrapper de gráficos sobre o **recharts**. Adicione-o:

```sh
pnpm dlx shadcn@latest add chart
```

> Se ele perguntar sobre sobrescrever algo, recuse tudo (`yes n | pnpm dlx shadcn@latest add
chart`). Isso cria `src/components/ui/chart.tsx` e **instala o recharts** (uma dependência
> nova — por isso o commit desta seção leva também `package.json` e `pnpm-lock.yaml`).

Como na Parte 8, o arquivo gerado pelo shadcn não segue o nosso padrão de ordenação de
imports. Rode o auto-fix:

```sh
pnpm lint:fix
```

### 4.2. Agrupando por dia (lógica pura)

Transformar uma lista de check-ins em "contagem por dia dos últimos 7 dias" é lógica pura — e
lógica pura testa-se sem renderizar nada. Por isso ela mora num arquivo só dela.

Vá na pasta `src/lib` e crie `check-in-activity.ts`:

```ts
import type { CheckIn } from '@/api/get-check-ins-history'

export interface ActivityDay {
	date: string // YYYY-MM-DD (local calendar day)
	label: string // short weekday, e.g. "Mon"
	count: number
}

function dateKey(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' })

// Buckets check-ins into the last `days` calendar days (oldest first), filling
// empty days with zero so the chart shows a continuous week. Pure function —
// `now` is injectable so it can be unit-tested deterministically.
export function groupByDay(
	checkIns: CheckIn[],
	days = 7,
	now: Date = new Date(),
): ActivityDay[] {
	const buckets: ActivityDay[] = []
	const index = new Map<string, ActivityDay>()

	for (let offset = days - 1; offset >= 0; offset--) {
		const date = new Date(now)
		date.setDate(now.getDate() - offset)
		date.setHours(0, 0, 0, 0)

		const bucket: ActivityDay = {
			date: dateKey(date),
			label: weekday.format(date),
			count: 0,
		}
		buckets.push(bucket)
		index.set(bucket.date, bucket)
	}

	for (const checkIn of checkIns) {
		const bucket = index.get(dateKey(new Date(checkIn.created_at)))
		if (bucket) {
			bucket.count++
		}
	}

	return buckets
}
```

### 4.3. O gráfico

Crie a pasta da Home (ela vira pasta, como `gyms/` e `new-gym/`):

```sh
mkdir src/pages/app/home
```

Vá na pasta `src/pages/app/home` e crie `activity-chart.tsx`:

```tsx
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import type { ActivityDay } from '@/lib/check-in-activity'

const chartConfig = {
	count: {
		label: 'Check-ins',
		color: 'var(--chart-1)',
	},
} satisfies ChartConfig

export function ActivityChart({ data }: { data: ActivityDay[] }) {
	return (
		<ChartContainer config={chartConfig} className='h-[200px] w-full'>
			<BarChart data={data} accessibilityLayer>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey='label'
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar dataKey='count' fill='var(--color-count)' radius={4} />
			</BarChart>
		</ChartContainer>
	)
}
```

### 4.4. O PM e a view

Vá na pasta `src/pages/app/home` e crie `use-home-pm.ts`:

```ts
import { useQuery } from '@tanstack/react-query'

import { getCheckInsHistory } from '@/api/get-check-ins-history'
import { getCheckInsMetrics } from '@/api/get-check-ins-metrics'
import { useAuth } from '@/components/auth/auth-hooks'
import { groupByDay } from '@/lib/check-in-activity'

export function useHomePM() {
	const { user } = useAuth()

	const metrics = useQuery({
		queryKey: ['check-ins', 'metrics'],
		queryFn: getCheckInsMetrics,
	})

	// Page 1 of the history feeds the "recent activity" chart. It's the most
	// recent slice the current backend exposes (no all-time aggregate endpoint).
	const history = useQuery({
		queryKey: ['check-ins', 'history', 1],
		queryFn: () => getCheckInsHistory({ page: 1 }),
	})

	return {
		user,
		total: metrics.data,
		isLoadingTotal: metrics.isLoading,
		activity: groupByDay(history.data ?? []),
		isLoadingActivity: history.isLoading,
	}
}
```

Repare nas `queryKey`s: ambas começam com `['check-ins', ...]`. Por isso o
`invalidateQueries({ queryKey: ['check-ins'] })` do hook de check-in (seção 2) faz o dashboard
**e** a página de histórico se atualizarem juntos depois de bater ponto.

Vá na pasta `src/pages/app/home` e crie `home.tsx`:

```tsx
import { LoaderCircle } from 'lucide-react'

import { PageTitle } from '@/components/title/page-title'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

import { ActivityChart } from './activity-chart'
import { useHomePM } from './use-home-pm'

export function Home() {
	const pm = useHomePM()

	return (
		<>
			<PageTitle title='Dashboard' />

			<div className='flex flex-1 flex-col gap-6 p-8'>
				<div>
					<h2 className='text-2xl font-medium'>
						Welcome back, {pm.user?.username}!
					</h2>
					<p className='text-muted-foreground text-sm'>
						Here&apos;s your recent gym activity.
					</p>
				</div>

				<div className='grid gap-4 md:grid-cols-3'>
					<Card>
						<CardHeader>
							<CardDescription>Total check-ins</CardDescription>
							<CardTitle className='text-4xl'>
								{pm.isLoadingTotal ? '—' : pm.total}
							</CardTitle>
						</CardHeader>
					</Card>

					<Card className='md:col-span-2'>
						<CardHeader>
							<CardTitle>Recent activity</CardTitle>
							<CardDescription>
								Check-ins over the last 7 days
							</CardDescription>
						</CardHeader>
						<CardContent>
							{pm.isLoadingActivity ? (
								<div className='text-muted-foreground flex h-[200px] items-center gap-2 text-sm'>
									<LoaderCircle className='size-4 animate-spin' />
									Loading activity…
								</div>
							) : (
								<ActivityChart data={pm.activity} />
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	)
}
```

### 4.5. Trocando a rota da Home

A Home virou pasta, então o antigo arquivo sai e o import da rota muda.

```sh
rm src/pages/app/home.tsx
```

Vá na pasta `src` e abra `routes.tsx`. Ajuste o import da Home (o `element` continua `<Home/>`):

```tsx
import { Home } from './pages/app/home/home'
```

### 4.6. Commit

Esta seção instalou o recharts, então o commit inclui o `package.json` e o lockfile:

```sh
pnpm lint:fix && pnpm test:run
git add src package.json pnpm-lock.yaml
git commit -m "feat: home dashboard with activity chart"
```

---

## 5. Testes

Três frentes: a lógica pura de agrupar, o esconde-mostra do botão Validate por papel, e o
fluxo ponta-a-ponta.

### 5.1. Unit — `groupByDay`

Como a função recebe o `now`, dá para fixar "hoje" e testar sem flakiness. Usamos datas
**locais** (`new Date(ano, mês, dia, ...)`) para o teste não depender do fuso da máquina.

Vá na pasta `src/lib` e crie `check-in-activity.spec.ts`:

```ts
import type { CheckIn } from '@/api/get-check-ins-history'

import { groupByDay } from './check-in-activity'

// Build a check-in whose created_at round-trips through a *local* date, so the
// test is independent of the machine timezone.
function checkInAt(
	year: number,
	month: number,
	day: number,
	hour = 12,
): CheckIn {
	return {
		id: `c-${year}-${month}-${day}-${hour}`,
		created_at: new Date(year, month, day, hour, 0, 0).toISOString(),
		validated_at: null,
		user_id: 'u1',
		gym_id: 'g1',
	}
}

describe('groupByDay', () => {
	const now = new Date(2026, 5, 20, 12) // 2026-06-20, local noon

	it('returns one bucket per day, oldest first, with today last', () => {
		const result = groupByDay([], 7, now)

		expect(result).toHaveLength(7)
		expect(result.at(-1)?.count).toBe(0)
	})

	it('counts multiple check-ins on the same day', () => {
		const checkIns = [checkInAt(2026, 5, 20, 8), checkInAt(2026, 5, 20, 20)]

		const result = groupByDay(checkIns, 7, now)

		expect(result.at(-1)?.count).toBe(2) // today
	})

	it('buckets a check-in into the right earlier day', () => {
		const result = groupByDay([checkInAt(2026, 5, 18, 10)], 7, now)

		// 2 days ago → third bucket from the end.
		expect(result.at(-3)?.count).toBe(1)
	})

	it('ignores check-ins outside the window', () => {
		const checkIns = [
			checkInAt(2026, 5, 20), // today (in)
			checkInAt(2026, 5, 1), // 19 days ago (out)
		]

		const total = groupByDay(checkIns, 7, now).reduce(
			(sum, day) => sum + day.count,
			0,
		)

		expect(total).toBe(1)
	})
})
```

### 5.2. Unit — o botão Validate por papel

O vitest não roda o MSW (isso é do navegador). Para testar a página sem servidor, a gente
**mocka** a função de API com `vi.mock` e injeta o `AuthContext` com o papel desejado — igual
fizemos no teste do `RoleRoute` na Parte 8.

Vá na pasta `src/pages/app/check-ins` e crie `check-ins.spec.tsx`:

```tsx
import { screen } from '@testing-library/react'
import { vi } from 'vitest'

import {
	AuthContext,
	type AuthContextValue,
	type Role,
} from '@/components/auth/auth-context'

import { renderWithProviders } from '../../../../test/utils'
import { CheckIns } from './check-ins'

// One pending check-in, so the Validate button is eligible to render.
vi.mock('@/api/get-check-ins-history', () => ({
	getCheckInsHistory: vi.fn().mockResolvedValue([
		{
			id: 'c1',
			created_at: '2026-06-19T12:00:00.000Z',
			validated_at: null,
			user_id: 'u1',
			gym_id: 'g1',
		},
	]),
}))

function renderAs(role: Role) {
	const value: AuthContextValue = {
		status: 'authed',
		user: { id: 'u1', username: 'tester', isVerified: true, role },
		signIn: async () => {},
		signOut: async () => {},
		reloadUser: async () => {},
	}

	return renderWithProviders(
		<AuthContext.Provider value={value}>
			<CheckIns />
		</AuthContext.Provider>,
		{ route: '/check-ins' },
	)
}

describe('CheckIns page', () => {
	it('hides the Validate button from members', async () => {
		renderAs('MEMBER')

		expect(await screen.findByText('Pending')).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Validate' }),
		).not.toBeInTheDocument()
	})

	it('shows the Validate button to admins on a pending check-in', async () => {
		renderAs('ADMIN')

		expect(await screen.findByText('Pending')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Validate' }),
		).toBeInTheDocument()
	})
})
```

### 5.3. e2e — bater ponto, histórico e validação

A localização é concedida via `test.use` (como na Parte 8). São quatro fluxos: o dashboard, o
membro batendo ponto, o membro **sem** o botão Validate, e o admin batendo ponto e validando.

Vá na pasta `test` e crie `check-ins.spec.ts`:

```ts
import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

// Grant a fixed location so the geolocation-driven check-in resolves.
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

test('the dashboard greets the user and shows check-in stats', async ({
	page,
}) => {
	await signIn(page, 'johndoe')

	await expect(page.getByText('Welcome back, johndoe!')).toBeVisible()
	await expect(page.getByText('Total check-ins')).toBeVisible()
	await expect(page.getByText('Recent activity')).toBeVisible()

	await waitForUIInspection(page)
})

test('member checks in from a gym and sees it in the history', async ({
	page,
}) => {
	await signIn(page, 'johndoe')

	await page.getByRole('link', { name: 'Gyms' }).click()
	await expect(page).toHaveURL('/gyms')
	await expect(page.getByText('Iron Temple')).toBeVisible()

	await page.getByRole('button', { name: 'Check in' }).first().click()
	await expect(page.getByText('Checked in!')).toBeVisible()

	await page.getByRole('link', { name: 'Check-ins' }).click()
	await expect(page).toHaveURL('/check-ins')
	await expect(page.getByText('Pending').first()).toBeVisible()

	await waitForUIInspection(page)
})

test('member does not see the Validate action', async ({ page }) => {
	await signIn(page, 'johndoe')

	await page.getByRole('link', { name: 'Check-ins' }).click()
	await expect(page).toHaveURL('/check-ins')
	await expect(page.getByText('Pending').first()).toBeVisible()

	await expect(page.getByRole('button', { name: 'Validate' })).toHaveCount(0)

	await waitForUIInspection(page)
})

test('admin checks in and validates the check-in', async ({ page }) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'Gyms' }).click()
	await expect(page.getByText('Iron Temple')).toBeVisible()
	await page.getByRole('button', { name: 'Check in' }).first().click()
	await expect(page.getByText('Checked in!')).toBeVisible()

	await page.getByRole('link', { name: 'Check-ins' }).click()
	await expect(page).toHaveURL('/check-ins')

	await page.getByRole('button', { name: 'Validate' }).first().click()
	await expect(page.getByText('Check-in validated.')).toBeVisible()
	await expect(page.getByText('Validated').first()).toBeVisible()

	await waitForUIInspection(page)
})
```

### 5.4. Um ajuste no e2e da Parte 8

Ao adicionar o botão "Check in", o bundle cresceu (o recharts pesa) e o app de teste ficou um
tiquinho mais lento — o suficiente para expor um problema **latente** no teste de criar
academia da Parte 8. A última asserção usava `getByText('Night Owl Gym')`, que casa por
**substring**; com o toast "Gym \"Night Owl Gym\" created." ainda visível, ela encontrava
**dois** elementos (o card e o toast) e o modo estrito do Playwright reclamava.

A correção é pedir o match **exato** no título do card. Vá na pasta `test` e abra
`gyms.spec.ts`; troque a última asserção do teste de criar academia:

```ts
// Depois de:
await expect(page).toHaveURL('/gyms')
// Substitua a linha com Night Owl Gym, por:
// Exact match: the success toast also contains "Night Owl Gym", so a
// substring match would resolve to two elements (strict-mode violation).
await expect(page.getByText('Night Owl Gym', { exact: true })).toBeVisible()
```

### 5.5. Commit

```sh
pnpm lint:fix && pnpm test:run
pnpm e2e
git add src test
git commit -m "test: cover check-ins + dashboard"
```

---

## 6. Smoke test no backend real

Aqui exercitamos o que o mock deixou de fora: a **distância de 100 m**, a **janela de 20 min**
e — o ponto alto — o **gate de email**.

### 6.1. Subir tudo

No backend (`solid_api_sample`): **`git pull`** (precisamos da versão que devolve `4xx` nos
erros de check-in), confira o `.env` da Parte 6 e, por enquanto, deixe o gate **desligado**:

```
REQUIRE_EMAIL_VERIFICATION=false
```

Suba com `pnpm dev` (porta 3333; `pnpm killapp` se alguma porta estiver presa). No frontend,
`pnpm dev` (porta 3001).

### 6.2. Preparar os dados (admin + uma academia perto de você)

O check-in exige estar a ≤ 100 m da academia, e o corpo manda a **sua** localização. O truque
do smoke é criar a academia **na sua localização atual** — aí, quando você bater ponto do mesmo
navegador, as coordenadas batem.

1. O backend já tem um **admin semeado** a partir do `.env` (`prisma/seed.ts`: role `ADMIN` e
   `is_verified: true` — então o gate de email nunca o tranca). Garanta que ele existe rodando
   uma vez no backend (idempotente, não reseta um admin já existente):

```sh
pnpm seeddb
```

Entre no app com `ADMIN_USERNAME` / `ADMIN_PASSWORD` do `.env` (o username é lowercased; no
exemplo padrão, `admin` / `Admin@12345`):

```
admin
```

```
Admin@12345
```

2. Como admin, abra **New gym**, clique em **Use my current location** e crie:

```
Smoke Gym
```

### 6.3. Bater ponto

Ainda logado, vá em **Gyms**, ache **Smoke Gym** e clique em **Check in**. O navegador usa a
sua localização (a mesma que criou a academia) → dentro dos 100 m → toast **"Checked in!"**.

- Clique de novo no mesmo dia: o toast vira **"Max check-ins reached."** (`409`) — a regra de
  um-por-dia.
- Se aparecer **"Max distance reached."**, sua localização reportada andou em relação à
  academia; recrie a **Smoke Gym** com **Use my current location** e tente de novo.

### 6.4. Validar como admin

Vá em **Check-ins**. O check-in que você acabou de criar aparece como **Pending**, com o botão
**Validate** (você é admin). Clique — toast **"Check-in validated."** e o selo vira
**Validated**. (Lembre da janela de 20 min: valide logo. Depois disso o backend devolve `409`
com **"The check-in can only be validated until 20 minutes of its creation."** — e o toast
mostra essa mensagem, prova de que o front lê o `data.message` do `4xx`. Se passou da janela,
apague o check-in de hoje no Studio e bata ponto de novo: como vale **1 por dia**, sem apagar o
antigo o novo check-in seria recusado.)

> **Lição: o mock não cobre CORS.** O `Validate` é o **primeiro `PATCH` que o browser dispara**
> neste app (até aqui só houve `GET`/`POST`). Se ele falhar com um toast genérico ("Could not
> validate the check-in.") e o backend logar apenas um `OPTIONS → 204` **sem nenhum `PATCH` em
> seguida**, o culpado é o **CORS do backend**: o preflight não lista `PATCH` em
> `Access-Control-Allow-Methods` (o `@fastify/cors` v11 tem default `GET,HEAD,POST`), então o
> **browser aborta o `PATCH` antes de enviá-lo** e o axios fica sem `response` — daí o
> fallback. O MSW intercepta **dentro** do browser, sem CORS, por isso unit e e2e passam e só o
> smoke real pega isso (mesma natureza da lição do `Decimal` na Parte 8). O conserto é no
> backend (`methods` explícito no `fastifyCors`, incluindo `PATCH`/`PUT`/`DELETE`); o front já
> degrada bem, mostrando o toast de erro.

### 6.5. O dashboard

Volte para a Home. O card **Total check-ins** reflete o número real e o gráfico **Recent
activity** mostra a barra de hoje. Bata ponto em outros dias (ou crie registros pelo Studio)
para ver mais barras.

### 6.6. ⭐ A demo do gate de email

Esta é a razão de a verificação de email existir no produto. Vamos ver a trava ligar.

1. **Crie um usuário novo e _não_ verifique o email.** Registre (ex.: `peter_parker`), entre.
   O banner "verifique seu email" aparece — ignore por enquanto. Com o gate **desligado**, vá
   em **Gyms** → **Smoke Gym** → **Check in**: **passa** (`201`). Email não verificado não
   importa ainda.
2. **Ligue o gate.** No `.env` do backend, troque para:

```
REQUIRE_EMAIL_VERIFICATION=true
```

**Reinicie o backend** (`Ctrl-C` e `pnpm dev` de novo — o `.env` é lido na subida). 3. **Tente bater ponto de novo** com o mesmo usuário não verificado (amanhã, ou apague o
check-in de hoje no Studio para escapar do um-por-dia). Agora o toast mostra **"Email not
verified."** (`403`) — a trava ligou. 4. **Verifique o email** pelo fluxo da Parte 7 (o link/código aparece no **console do
backend**). Assim que confirmar, o banner some. 5. **Bata ponto mais uma vez:** **passa**. O backend lê o `is_verified` fresco do banco (não do
token), então a trava libera na hora, sem novo login.

Deu tudo certo? Parte 9 fechada. ✅

---

## 7. O que vem a seguir

O app já tem o ciclo completo de uso: achar academia, bater ponto, acompanhar histórico e
métricas, e o admin validando. Falta a última parte:

- **Parte 10 — Edição e permissões.** Edição da própria conta (`PATCH /auth/me`) incluindo a
  **troca de email** (`POST /auth/me/email` + confirmação), e a **área de admin** (listar e
  editar usuários e academias) atrás do `RoleRoute` que nasceu na Parte 8. É o fechamento do
  RBAC: até aqui o admin só **cria** e **valida**; lá ele passa a **governar**.

**Commit da documentação.** Por fim, versione este arquivo sozinho:

```sh
git add TUTORIAL_09_check_ins.md
git commit -m "docs: add part 9 tutorial (check-ins + dashboard)"
```

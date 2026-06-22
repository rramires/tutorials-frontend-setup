# Parte 10 — Edição e permissões (a última)

Chegamos ao fim. Na Parte 8 nasceu o **guard por papel** (`RoleRoute`): o admin **cria**
academias. Na Parte 9, o primeiro **gating de ação**: o admin **valida** check-ins. Faltava
o outro lado de qualquer app de verdade — **editar**: a própria conta e, para o admin, os
outros. É o fechamento do RBAC: até aqui o admin só criava e validava; agora ele **governa**.

São **três superfícies**:

1. **Conta (self-service)** em `/account` — qualquer usuário muda o **username** e o **email**.
   A troca de email reusa as **duas portas** da Parte 7 (código OTP **ou** link).
2. **Área admin de usuários** em `/admin/users` — uma **tabela** com listagem paginada e uma
   **página dedicada de edição** por usuário. É aqui que moram as regras de permissão.
3. **Edição de academia** — um **Dialog** no próprio card da página de academias.

As rotas do backend que entram em cena:

| Rota                              | Quem usa     | O que faz                                             |
| --------------------------------- | ------------ | ----------------------------------------------------- |
| `PATCH /auth/me`                  | logado       | muda o **próprio** username (`200`)                   |
| `POST /auth/me/email`             | logado       | pede troca de email → manda código+link (`204`)       |
| `POST /auth/me/email/confirm`     | logado       | confirma com o **código** (`204`)                     |
| `GET /users/confirm-email-change` | público      | confirma pelo **link** (`204`)                        |
| `GET /users?page=`                | **só ADMIN** | lista usuários, 20/página (`200`)                     |
| `GET /users/:userId`              | **só ADMIN** | um usuário por id (`200`) — **rota nova** (veja §2.1) |
| `PATCH /users/:userId`            | **só ADMIN** | edita username/email/role/is_verified (`200`)         |
| `PATCH /gyms/:gymId`              | **só ADMIN** | edita title/description/phone (`200`)                 |

O usuário que o admin enxerga é o **`PublicUser`**:
`{ id, username, email, role, is_verified, created_at, password_changed_at }` — repare que
**nunca** vem `password_hash`. E uma trava que vale registrar: o admin **não troca senha de
ninguém** — `PATCH /users/:userId` não tem campo de senha, e não deve ter. Trocar a senha de
um usuário é só pelo **reset por email** (link/OTP) da Parte 7; ninguém define senha "na mão".

> **Atualize o backend antes (`git pull` em `solid_api_sample`).** A Parte 10 é toda
> `PATCH`/`PUT`. O smoke da Parte 9 forçou dois consertos que já estão no `master` do backend e
> dos quais esta parte **depende**: (1) os erros de domínio do check-in voltam em `4xx`; e
> sobretudo (2) o **CORS com `methods` explícito** incluindo `PATCH`/`PUT`/`DELETE` — sem ele o
> browser aborta todo `PATCH` no preflight. Além disso, a rota `GET /users/:userId` (§2.1) é
> nova; confirme que o seu backend já a tem.

Pipeline de sempre: **mock-first → MSW → unit → e2e → backend real**, com **dry-run completo**
e **smoke** no fim. Cada seção tem seu commit.

> **Uma honestidade de UI.** O `GET /auth/me` devolve só `{ id, username, is_verified, role }`
> — **não traz o email**. E não há endpoint para um membro ler o próprio email (`GET
/users/:id` é só admin). Por isso o card de Email **não mostra o email atual**; ele oferece a
> troca. É uma limitação real do contrato, não um esquecimento — se um dia você quiser exibir o
> atual, é um campo a mais no `/auth/me` do backend.

---

## 1. Self-service: a página de conta (`/account`)

### 1.1. As funções de API

Três chamadas: mudar username, pedir a troca de email, e confirmar a troca (pelas duas portas).

Vá na pasta `src/api` e crie `update-profile.ts`:

```ts
import { api } from '@/lib/api'

// Self-service: changes the current user's own username. The backend whitelist
// is username-only — role/email/is_verified can never be set here.
export interface UpdateProfileBody {
	username: string
}

export async function updateProfile(body: UpdateProfileBody) {
	await api.patch('/auth/me', body)
}
```

Vá na pasta `src/api` e crie `request-email-change.ts`:

```ts
import { api } from '@/lib/api'

// Self-service email change, step 1: ask the backend to send a confirmation to
// the NEW address. The current email stays valid until the change is confirmed.
export interface RequestEmailChangeBody {
	email: string
}

export async function requestEmailChange(body: RequestEmailChangeBody) {
	await api.post('/auth/me/email', body)
}
```

Vá na pasta `src/api` e crie `confirm-email-change.ts`:

```ts
import { api } from '@/lib/api'

export interface ConfirmEmailChangeOtpBody {
	code: string
}

// Step 2, door A: the authenticated user types the 6-digit code from the email.
export async function confirmEmailChangeByOtp(body: ConfirmEmailChangeOtpBody) {
	await api.post('/auth/me/email/confirm', body)
}

// Step 2, door B: the public link landing forwards its token to the backend.
export async function confirmEmailChangeByToken(token: string) {
	await api.get('/users/confirm-email-change', { params: { token } })
}
```

### 1.2. Os mocks

O diretório de usuários é estado mutável compartilhado entre o self-service e a área admin.
Vamos criá-lo já pensando na §2 (a tabela paginada precisa de mais de 20 registros). Mas o mock
usa o tipo `PublicUser`, então criamos **antes** o `get-users.ts` que o define — é o mesmo
arquivo da função de listagem que a área admin vai reusar na §2.

Vá na pasta `src/api` e crie `get-users.ts`:

```ts
import { api } from '@/lib/api'

// The admin-facing user shape. Mirrors the backend's PublicUser exactly — it is
// User without password_hash, so the hash never reaches the client.
export interface PublicUser {
	id: string
	username: string
	email: string
	role: 'MEMBER' | 'ADMIN'
	is_verified: boolean
	created_at: string
	password_changed_at: string | null
}

interface GetUsersResponse {
	users: PublicUser[]
}

export interface GetUsersParams {
	page?: number
}

// Admin-only listing (20/page). A non-admin gets 403 from the backend guard.
export async function getUsers({ page = 1 }: GetUsersParams = {}) {
	const response = await api.get<GetUsersResponse>('/users', {
		params: { page },
	})

	return response.data.users
}
```

Agora o diretório. Vá na pasta `src/api/mocks` e crie `users-data.ts`:

```ts
import { HttpResponse } from 'msw'

import type { PublicUser } from '../get-users'

const ADMIN_TOKEN = 'Bearer mock-admin-jwt-token'

// Mutable mock state: the user directory the admin area reads and edits. Seeded
// with the two demo accounts (admin + johndoe, matching the profile mock) plus
// filler members so the list has a second page (page 1 = 20, page 2 = 3).
export const users: PublicUser[] = [
	{
		id: 'mock-admin-id',
		username: 'admin',
		email: 'admin@example.com',
		role: 'ADMIN',
		is_verified: true,
		created_at: '2026-01-01T12:00:00.000Z',
		password_changed_at: null,
	},
	{
		id: 'mock-user-id',
		username: 'johndoe',
		email: 'johndoe@example.com',
		role: 'MEMBER',
		is_verified: false,
		created_at: '2026-02-01T12:00:00.000Z',
		password_changed_at: null,
	},
	...Array.from({ length: 21 }, (_, index) => {
		const n = index + 3
		return {
			id: `mock-user-${n}`,
			username: `member${n}`,
			email: `member${n}@example.com`,
			role: 'MEMBER' as const,
			is_verified: n % 2 === 0,
			created_at: `2026-03-${String(n).padStart(2, '0')}T12:00:00.000Z`,
			password_changed_at: null,
		}
	}),
]

// Mirror the backend role guard: admin routes answer 401 without a token and
// 403 for a non-admin token. Returns a response to short-circuit with, or null
// when the caller is an admin.
export function requireAdmin(authHeader: string | null) {
	if (!authHeader) {
		return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
	}
	if (authHeader !== ADMIN_TOKEN) {
		return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
	}
	return null
}

export function findUser(id: string) {
	return users.find((user) => user.id === id)
}
```

Agora os handlers do self-service. Vá na pasta `src/api/mocks` e crie `update-profile-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import { findUser, users } from './users-data'
import { isVerified } from './verified-state'

interface UpdateProfileBody {
	username: string
}

export const updateProfileMock = http.patch<never, UpdateProfileBody>(
	'/auth/me',
	async ({ request }) => {
		const auth = request.headers.get('Authorization')
		if (!auth) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		const isAdmin = auth === 'Bearer mock-admin-jwt-token'
		const id = isAdmin ? 'mock-admin-id' : 'mock-user-id'

		const { username: raw } = await request.json()
		const username = raw.toLowerCase()

		// Username uniqueness across the directory (excluding self).
		if (
			users.some((user) => user.username === username && user.id !== id)
		) {
			return HttpResponse.json(
				{ message: 'E-mail already exists.' },
				{ status: 409 },
			)
		}

		// Persist so the profile mock (and the admin list) reflect the change.
		const self = findUser(id)
		if (self) {
			self.username = username
		}

		return HttpResponse.json({
			user: {
				id,
				username,
				is_verified: isAdmin ? true : isVerified(),
				role: isAdmin ? 'ADMIN' : 'MEMBER',
			},
		})
	},
)
```

> **Por que o 409 diz "E-mail already exists." num conflito de username?** Porque é exatamente
> o que o backend devolve — ele reusa a mesma `UserAlreadyExistsError` para username e email. A
> regra do front não muda: **toast = `data.message` em qualquer 4xx**. Espelhar o contrato
> string-por-string é o ponto do mock-first.

Vá na pasta `src/api/mocks` e crie `request-email-change-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import { users } from './users-data'

interface RequestEmailChangeBody {
	email: string
}

export const requestEmailChangeMock = http.post<never, RequestEmailChangeBody>(
	'/auth/me/email',
	async ({ request }) => {
		const auth = request.headers.get('Authorization')
		if (!auth) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		const { email } = await request.json()

		// Demo trigger: this sentinel address simulates the resend cooldown.
		if (email === 'cooldown@example.com') {
			return HttpResponse.json(
				{
					message:
						'Please wait before requesting another verification email.',
					retryAfter: 60,
				},
				{ status: 429 },
			)
		}

		// An address already taken returns the conflict the backend would.
		if (users.some((user) => user.email === email)) {
			return HttpResponse.json(
				{ message: 'E-mail already exists.' },
				{ status: 409 },
			)
		}

		return new HttpResponse(null, { status: 204 })
	},
)
```

Vá na pasta `src/api/mocks` e crie `confirm-email-change-mock.ts` (as duas portas num arquivo,
como o `verify-email-mock` da Parte 7):

```ts
import { http, HttpResponse } from 'msw'

const INVALID_TOKEN = {
	message: 'Verification token is invalid or has already been used.',
}

// Door A — the authenticated user types the 6-digit code from the email.
export const confirmEmailChangeByOtpMock = http.post<never, { code: string }>(
	'/auth/me/email/confirm',
	async ({ request }) => {
		const auth = request.headers.get('Authorization')
		if (!auth) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		const { code } = await request.json()
		if (code === '123456') {
			return new HttpResponse(null, { status: 204 })
		}

		return HttpResponse.json(INVALID_TOKEN, { status: 400 })
	},
)

// Door B — the public link landing forwards its token (no auth needed).
export const confirmEmailChangeByLinkMock = http.get(
	'/users/confirm-email-change',
	({ request }) => {
		const url = new URL(request.url)
		const token = url.searchParams.get('token')
		if (token === 'valid-token') {
			return new HttpResponse(null, { status: 204 })
		}

		return HttpResponse.json(INVALID_TOKEN, { status: 400 })
	},
)
```

Falta um retoque no mock de perfil. Como o username agora pode mudar, o `/auth/me` precisa
lê-lo do diretório (senão, depois de trocar, o `reloadUser()` traria o nome antigo).

Vá na pasta `src/api/mocks`, abra `profile-mock.ts` e troque os usernames fixos por uma leitura
do diretório, substituindo o arquivo inteiro por:

```ts
import { http, HttpResponse } from 'msw'

import { findUser } from './users-data'
import { isVerified } from './verified-state'

export const profileMock = http.get('/auth/me', ({ request }) => {
	const auth = request.headers.get('Authorization')

	// The admin token identifies the seeded admin (already verified). Username is
	// read from the directory so a self-service rename (PATCH /auth/me) shows up.
	if (auth === 'Bearer mock-admin-jwt-token') {
		return HttpResponse.json({
			user: {
				id: 'mock-admin-id',
				username: findUser('mock-admin-id')?.username ?? 'admin',
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
				username: findUser('mock-user-id')?.username ?? 'johndoe',
				is_verified: isVerified(),
				role: 'MEMBER',
			},
		})
	}

	return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
})
```

Registre os handlers do self-service no worker. Abra `src/api/mocks/index.ts` e **adicione**
estes imports (junto dos que já existem):

```ts
// Adicione:
import {
	confirmEmailChangeByLinkMock,
	confirmEmailChangeByOtpMock,
} from './confirm-email-change-mock'
import { requestEmailChangeMock } from './request-email-change-mock'
import { updateProfileMock } from './update-profile-mock'
```

E **adicione** os quatro handlers dentro do `setupWorker(...)`. O `updateProfileMock` vai logo
após `profileMock`; os de email-change ficam perto dos `verifyEmail*` (o
`confirmEmailChangeByLinkMock` é um GET estático `/users/...`, então fica junto deles):

```ts
// Adicione no final do setupWorker
confirmEmailChangeByLinkMock,
confirmEmailChangeByOtpMock,
requestEmailChangeMock,
updateProfileMock,
```

> Os handlers **admin** entram só na §2.3, onde você reescreve o `index.ts` inteiro — lá a ordem
> dos `/users/...` importa (e o porquê está explicado). Por ora, esses quatro bastam para o
> self-service funcionar.

### 1.3. O Card de Profile

Lógica fica no PM; a view é markup puro. Crie a pasta `src/pages/app/account` e crie
`use-profile-card-pm.ts` nela:

```sh
mkdir -p src/pages/app/account
```

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { updateProfile } from '@/api/update-profile'
import { useAuth } from '@/components/auth/auth-hooks'

// Mirrors the backend: 3-30 chars, letters/numbers/underscore only.
const usernamePattern = /^[a-zA-Z0-9_]+$/

const profileForm = z.object({
	username: z
		.string()
		.min(3, 'Minimum of 3 characters.')
		.max(30, 'Maximum of 30 characters.')
		.regex(usernamePattern, 'Letters, numbers and underscore only.'),
})
type ProfileForm = z.infer<typeof profileForm>

export function useProfileCardPM() {
	const auth = useAuth()

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting, isDirty },
	} = useForm<ProfileForm>({
		resolver: zodResolver(profileForm),
		defaultValues: { username: auth.user?.username ?? '' },
	})

	const { mutateAsync: saveProfile } = useMutation({
		mutationFn: updateProfile,
	})

	async function onSubmit(data: ProfileForm) {
		try {
			await saveProfile({ username: data.username })
			// Refetch the profile so the sidebar (and the rest of the app) pick
			// up the new username.
			await auth.reloadUser()
			toast.success('Profile updated.')
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not update your profile.'
			toast.error(message)
		}
	}

	return {
		register,
		errors,
		isSubmitting,
		isDirty,
		handleSubmit: handleSubmit(onSubmit),
	}
}
```

Vá na pasta `src/pages/app/account` e crie `profile-card.tsx`:

```tsx
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

import { useProfileCardPM } from './use-profile-card-pm'

export function ProfileCard() {
	const pm = useProfileCardPM()

	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile</CardTitle>
				<CardDescription>Update your account username.</CardDescription>
			</CardHeader>

			<CardContent>
				<form onSubmit={pm.handleSubmit} noValidate>
					<div className='flex flex-col gap-6'>
						<div className='grid gap-2'>
							<Label htmlFor='username'>Username</Label>
							<Input id='username' {...pm.register('username')} />
							{pm.errors.username && (
								<p className='text-destructive text-sm'>
									{pm.errors.username.message}
								</p>
							)}
						</div>

						<Button
							type='submit'
							disabled={pm.isSubmitting || !pm.isDirty}
							className='w-full'
						>
							Save
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
```

### 1.4. O Card de Email (máquina de três estados)

Este é o card mais interessante: uma máquina **`idle → editing → confirming`**, toda **inline**
no próprio card. Reusa o `input-otp` e o padrão de duas portas da Parte 7 — a porta OTP fica
aqui; a porta do link é a landing da §1.6.

Vá na pasta `src/pages/app/account` e crie `use-email-card-pm.ts`:

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { confirmEmailChangeByOtp } from '@/api/confirm-email-change'
import { requestEmailChange } from '@/api/request-email-change'
import { useAuth } from '@/components/auth/auth-hooks'

const requestForm = z.object({ email: z.email('Enter a valid email.') })
type RequestForm = z.infer<typeof requestForm>

const confirmForm = z.object({
	code: z.string().length(6, 'Enter the 6-digit code.'),
})
type ConfirmForm = z.infer<typeof confirmForm>

// idle → editing (type the new email) → confirming (enter the code / click the
// link). Two doors: the OTP here, or the link from the email (landing page).
export type EmailCardState = 'idle' | 'editing' | 'confirming'

export function useEmailCardPM() {
	const auth = useAuth()
	const [state, setState] = useState<EmailCardState>('idle')
	const [pendingEmail, setPendingEmail] = useState('')

	const {
		register,
		handleSubmit: submitRequest,
		reset: resetRequest,
		formState: { errors, isSubmitting },
	} = useForm<RequestForm>({ resolver: zodResolver(requestForm) })

	const {
		control,
		handleSubmit: submitConfirm,
		reset: resetConfirm,
		formState: { errors: confirmErrors, isSubmitting: isConfirming },
	} = useForm<ConfirmForm>({ resolver: zodResolver(confirmForm) })

	const { mutateAsync: requestChange } = useMutation({
		mutationFn: requestEmailChange,
	})
	const { mutateAsync: confirmChange } = useMutation({
		mutationFn: confirmEmailChangeByOtp,
	})

	function startEditing() {
		resetRequest({ email: '' })
		setState('editing')
	}

	function cancel() {
		resetRequest({ email: '' })
		resetConfirm({ code: '' })
		setState('idle')
	}

	async function onRequest(data: RequestForm) {
		try {
			await requestChange({ email: data.email })
			setPendingEmail(data.email)
			resetConfirm({ code: '' })
			setState('confirming')
			toast.success(
				'We sent a confirmation code to your new email. Check the backend console (dev).',
			)
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error('Please wait before requesting another change.')
				return
			}
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not start the email change.'
			toast.error(message)
		}
	}

	async function onConfirm(data: ConfirmForm) {
		try {
			await confirmChange({ code: data.code })
			toast.success('Email updated.')
			// Confirming proves the new address → refetch so is_verified is fresh.
			await auth.reloadUser()
			cancel()
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Invalid or expired code.'
			toast.error(message)
		}
	}

	return {
		state,
		pendingEmail,
		register,
		errors,
		isSubmitting,
		handleRequest: submitRequest(onRequest),
		control,
		confirmErrors,
		isConfirming,
		handleConfirm: submitConfirm(onConfirm),
		startEditing,
		cancel,
	}
}
```

Vá na pasta `src/pages/app/account` e crie `email-card.tsx`:

```tsx
import { Controller } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

import { useEmailCardPM } from './use-email-card-pm'

export function EmailCard() {
	const pm = useEmailCardPM()

	return (
		<Card>
			<CardHeader>
				<CardTitle>Email</CardTitle>
				<CardDescription>
					Change the email address for your account.
				</CardDescription>
			</CardHeader>

			<CardContent>
				{pm.state === 'idle' && (
					<Button variant='outline' onClick={pm.startEditing}>
						Change email
					</Button>
				)}

				{pm.state === 'editing' && (
					<form onSubmit={pm.handleRequest} noValidate>
						<div className='flex flex-col gap-6'>
							<div className='grid gap-2'>
								<Label htmlFor='new-email'>New email</Label>
								<Input
									id='new-email'
									type='email'
									placeholder='m@example.com'
									{...pm.register('email')}
								/>
								{pm.errors.email && (
									<p className='text-destructive text-sm'>
										{pm.errors.email.message}
									</p>
								)}
							</div>

							<div className='flex gap-2'>
								<Button
									type='submit'
									disabled={pm.isSubmitting}
									className='flex-1'
								>
									Send confirmation
								</Button>
								<Button
									type='button'
									variant='ghost'
									onClick={pm.cancel}
								>
									Cancel
								</Button>
							</div>
						</div>
					</form>
				)}

				{pm.state === 'confirming' && (
					<form onSubmit={pm.handleConfirm} noValidate>
						<div className='flex flex-col gap-6'>
							<div className='grid gap-2'>
								<Label htmlFor='code'>Confirmation code</Label>
								<p className='text-muted-foreground text-sm'>
									Enter the 6-digit code sent to{' '}
									<span className='font-medium'>
										{pm.pendingEmail}
									</span>
									, or click the link in that email.
								</p>
								<Controller
									control={pm.control}
									name='code'
									render={({ field }) => (
										<InputOTP
											maxLength={6}
											value={field.value ?? ''}
											onChange={field.onChange}
										>
											<InputOTPGroup>
												<InputOTPSlot index={0} />
												<InputOTPSlot index={1} />
												<InputOTPSlot index={2} />
												<InputOTPSlot index={3} />
												<InputOTPSlot index={4} />
												<InputOTPSlot index={5} />
											</InputOTPGroup>
										</InputOTP>
									)}
								/>
								{pm.confirmErrors.code && (
									<p className='text-destructive text-sm'>
										{pm.confirmErrors.code.message}
									</p>
								)}
							</div>

							<div className='flex gap-2'>
								<Button
									type='submit'
									disabled={pm.isConfirming}
									className='flex-1'
								>
									Confirm
								</Button>
								<Button
									type='button'
									variant='ghost'
									onClick={pm.cancel}
								>
									Cancel
								</Button>
							</div>
						</div>
					</form>
				)}
			</CardContent>
		</Card>
	)
}
```

### 1.5. A página, a rota e o sidebar (Account no rodapé)

A página só compõe os dois cards. Vá na pasta `src/pages/app/account` e crie `account.tsx`:

```tsx
import { PageTitle } from '@/components/title/page-title'

import { EmailCard } from './email-card'
import { ProfileCard } from './profile-card'

export function Account() {
	return (
		<>
			<PageTitle title='Account' />

			<div className='flex flex-1 flex-col items-center p-8'>
				<div className='flex w-full max-w-lg flex-col gap-6'>
					<ProfileCard />
					<EmailCard />
				</div>
			</div>
		</>
	)
}
```

Abra `src/routes.tsx`, importe a página e registre a rota `account` dentro do `AppLayout`
(logo após `check-ins`):

```tsx
import { Account } from './pages/app/account/account'
```

```tsx
// Depois de:
{ path: 'check-ins', element: <CheckIns /> },
// Adicione:
{ path: 'account', element: <Account /> },
```

Agora o sidebar. **Account não entra na nav principal** — é self-service (sobre você), então
vai no **rodapé**, junto da sua identidade (username + badge), não com as features de academia.
Abra `src/components/app-sidebar/use-app-sidebar-pm.ts` e substitua o arquivo inteiro por:

```ts
import { Dumbbell, History, LayoutDashboard } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'

import { useAuth } from '@/components/auth/auth-hooks'

export function useAppSidebarPM() {
	const { user, signOut } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()

	// Main nav: the gym-domain features. Account is self-service (about you), so
	// it lives in the footer next to your identity — not here.
	const items = [
		{ to: '/', label: 'Dashboard', icon: LayoutDashboard },
		{ to: '/gyms', label: 'Gyms', icon: Dumbbell },
		{ to: '/check-ins', label: 'Check-ins', icon: History },
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

Agora o botão de Account no rodapé. Abra `src/components/app-sidebar/app-sidebar.tsx` e
**adicione** o `UserRoundPen` ao import do lucide:

```ts
import { GlobeCheck, LogOut, UserRoundPen } from 'lucide-react'
```

No `SidebarFooter`, **substitua a linha do username + badge** por esta (troca o
`justify-between` por `flex-1` no nome e acrescenta um ghost icon-button pro `/account` depois
do badge):

```tsx
<div className='flex items-center gap-2'>
	<span className='flex-1 truncate text-sm font-medium'>
		{pm.user?.username}
	</span>
	<Badge
		variant={pm.user?.role === 'ADMIN' ? 'default' : 'secondary'}
	>
		{pm.user?.role === 'ADMIN' ? 'Admin' : 'Member'}
	</Badge>
	{/* Account is self-service — it lives here, next to your
	    identity, not in the gym-domain nav above. */}
	<Button
		asChild
		variant={pm.pathname === '/account' ? 'secondary' : 'ghost'}
		size='icon'
		className='size-7'
	>
		<Link to='/account' aria-label='Account' title='Account'>
			<UserRoundPen />
		</Link>
	</Button>
</div>
```

> Saiu o "New gym" da lista de itens? Calma — ele volta na §2.6, junto com **Users**, num grupo
> **Admin** próprio. Até lá, o admin acessa o New gym digitando `/gyms/new`; o sidebar ganha o
> grupo no fim.

### 1.6. A landing da porta do link

A porta do link precisa de uma página pública, igual à `verify-email` da Parte 7. Ela lê o
`?token`, chama o `GET /users/confirm-email-change` e mostra sucesso/erro.

```sh
mkdir -p src/pages/auth/confirm-email-change
```

Vá na pasta `src/pages/auth/confirm-email-change` e crie `use-confirm-email-change-pm.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'

import { confirmEmailChangeByToken } from '@/api/confirm-email-change'
import { useAuth } from '@/components/auth/auth-hooks'

export type ConfirmEmailChangeStatus = 'verifying' | 'success' | 'error'

export function useConfirmEmailChangePM() {
	const [searchParams] = useSearchParams()
	const token = searchParams.get('token')
	const auth = useAuth()
	const reloaded = useRef(false)

	const query = useQuery({
		queryKey: ['confirm-email-change', token],
		queryFn: async () => {
			await confirmEmailChangeByToken(token as string)
			// React Query forbids an undefined return; signal success explicitly.
			return true
		},
		enabled: Boolean(token),
		retry: false,
	})

	// Once confirmed, refresh the profile so a logged-in user sees fresh state.
	// Guarded so it runs once despite re-renders / StrictMode.
	useEffect(() => {
		if (query.isSuccess && auth.status === 'authed' && !reloaded.current) {
			reloaded.current = true
			auth.reloadUser()
		}
	}, [query.isSuccess, auth])

	const status: ConfirmEmailChangeStatus = !token
		? 'error'
		: query.isSuccess
			? 'success'
			: query.isError
				? 'error'
				: 'verifying'

	return {
		status,
		isAuthed: auth.status === 'authed',
	}
}
```

Vá na pasta `src/pages/auth/confirm-email-change` e crie `confirm-email-change.tsx`:

```tsx
import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

import { useConfirmEmailChangePM } from './use-confirm-email-change-pm'

export function ConfirmEmailChange() {
	const pm = useConfirmEmailChangePM()

	return (
		<>
			<PageTitle title='Confirm email change' />

			<div className='flex flex-1 items-center justify-center p-8'>
				<Card className='w-full max-w-sm text-center'>
					{pm.status === 'verifying' && (
						<CardHeader>
							<LoaderCircle className='text-muted-foreground mx-auto size-10 animate-spin' />
							<CardTitle>Confirming your email…</CardTitle>
							<CardDescription>
								Hold on while we confirm your link.
							</CardDescription>
						</CardHeader>
					)}

					{pm.status === 'success' && (
						<>
							<CardHeader>
								<CheckCircle2 className='mx-auto size-10 text-emerald-500' />
								<CardTitle>Email confirmed</CardTitle>
								<CardDescription>
									Your new email address is now active.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link
										to={
											pm.isAuthed
												? '/account'
												: '/sign-in'
										}
									>
										{pm.isAuthed
											? 'Back to account'
											: 'Sign in'}
									</Link>
								</Button>
							</CardContent>
						</>
					)}

					{pm.status === 'error' && (
						<>
							<CardHeader>
								<XCircle className='text-destructive mx-auto size-10' />
								<CardTitle>Confirmation failed</CardTitle>
								<CardDescription>
									This link is invalid or has expired.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link
										to={
											pm.isAuthed
												? '/account'
												: '/sign-in'
										}
									>
										{pm.isAuthed
											? 'Back to account'
											: 'Sign in'}
									</Link>
								</Button>
							</CardContent>
						</>
					)}
				</Card>
			</div>
		</>
	)
}
```

Abra `src/routes.tsx`, importe a landing e registre a rota pública (logo após a de
`verify-email`):

```tsx
import { ConfirmEmailChange } from './pages/auth/confirm-email-change/confirm-email-change'
```

```tsx
// No final depois do bloco contendo /users/verify-email, adicione:
{
	path: '/users/confirm-email-change',
	element: <AuthLayout />,
	children: [{ index: true, element: <ConfirmEmailChange /> }],
},
```

### 1.7. Commit

```sh
pnpm lint:fix && pnpm test:run
git add src
git commit -m "feat: account self-service (username + email change)"
```

---

## 2. A área admin: diretório de usuários

### 2.1. A rota nova `GET /users/:userId`

A página de edição vai ser **dedicada** (`/admin/users/:userId`) — porque tem vários campos e,
numa app derivada, tende a crescer. Mas uma página dedicada precisa **buscar o usuário por
id**, e o backend só tinha `GET /users` (a lista). Sem um `GET /users/:userId`, a página não
sobreviveria a um **refresh** ou a um **link direto** (ela dependeria de dados passados pela
lista).

Por isso o backend ganhou uma rota nova, `GET /users/:userId` (admin-only), que devolve um
`PublicUser`. A serialização é **byte-idêntica** à de cada item do `GET /users` (mesma
projeção no banco), e o `password_hash` **nunca é lido do banco** — não tem como vazar.

Confirme que o seu `solid_api_sample` já tem essa rota (`git pull`). Contrato:

- `GET /users/:userId` (Bearer + role ADMIN) → `200 { user: PublicUser }`
- `404 { message: "Resource not found." }` (id válido, mas inexistente)
- `400 { message: "Validation error.", issues }` (id que não é uuid)
- `403`/`401` pelos middlewares de role/JWT

> **Contraste didático.** Usuário se administra **por lista** (tem `GET /users`); academia se
> administra **contextualmente** (não há "listar todas as gyms" — só busca e nearby), então a
> edição de gym vai ser um **Dialog** no card (§3), não uma tabela. Duas formas de governar,
> escolhidas pelo que o backend oferece.

### 2.2. A API

O `get-users.ts` (com o tipo `PublicUser`) você já criou na §1.2 — o mock precisava do tipo.
Faltam duas chamadas: buscar um usuário **por id** e **editar**.

Vá na pasta `src/api` e crie `get-user.ts`:

```ts
import { api } from '@/lib/api'

import type { PublicUser } from './get-users'

interface GetUserResponse {
	user: PublicUser
}

// Admin-only fetch by id. Lets the edit page stand on its own (survive a refresh
// / direct link) instead of depending on data passed from the list.
export async function getUser(userId: string) {
	const response = await api.get<GetUserResponse>(`/users/${userId}`)

	return response.data.user
}
```

Vá na pasta `src/api` e crie `update-user.ts`:

```ts
import { api } from '@/lib/api'

import type { PublicUser } from './get-users'

// Admin edit. All fields optional, but the backend requires at least one and
// rejects unknown keys. Changing the email unverifies the account server-side.
export interface UpdateUserBody {
	username?: string
	email?: string
	role?: 'MEMBER' | 'ADMIN'
	is_verified?: boolean
}

interface UpdateUserResponse {
	user: PublicUser
}

export async function updateUser(userId: string, body: UpdateUserBody) {
	const response = await api.patch<UpdateUserResponse>(
		`/users/${userId}`,
		body,
	)

	return response.data.user
}
```

### 2.3. Os mocks admin (e por que a ordem importa)

Três handlers: listar, buscar por id, editar. Todos passam pelo `requireAdmin` (criado na §1.2).

Vá na pasta `src/api/mocks` e crie `get-users-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import { requireAdmin, users } from './users-data'

const PAGE_SIZE = 20

export const getUsersMock = http.get('/users', ({ request }) => {
	const denied = requireAdmin(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}

	const url = new URL(request.url)
	const page = Number(url.searchParams.get('page') ?? '1')
	const start = (page - 1) * PAGE_SIZE

	return HttpResponse.json({ users: users.slice(start, start + PAGE_SIZE) })
})
```

Vá na pasta `src/api/mocks` e crie `get-user-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import { findUser, requireAdmin } from './users-data'

export const getUserMock = http.get<{ userId: string }>(
	'/users/:userId',
	({ request, params }) => {
		const denied = requireAdmin(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const user = findUser(params.userId)
		if (!user) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		return HttpResponse.json({ user })
	},
)
```

Vá na pasta `src/api/mocks` e crie `update-user-mock.ts` — aqui moram as três regras de `400`:

```ts
import { http, HttpResponse } from 'msw'

import type { UpdateUserBody } from '../update-user'
import { findUser, requireAdmin, users } from './users-data'

export const updateUserMock = http.patch<{ userId: string }, UpdateUserBody>(
	'/users/:userId',
	async ({ request, params }) => {
		const denied = requireAdmin(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const body = await request.json()

		// At least one field (mirrors the backend .refine).
		if (
			body.username === undefined &&
			body.email === undefined &&
			body.role === undefined &&
			body.is_verified === undefined
		) {
			return HttpResponse.json(
				{ message: 'Provide at least one field to update.' },
				{ status: 400 },
			)
		}

		// Can't verify a brand-new (unproven) email in the same request.
		if (body.email !== undefined && body.is_verified === true) {
			return HttpResponse.json(
				{
					message:
						'Cannot verify a newly-changed email in the same request.',
				},
				{ status: 400 },
			)
		}

		const user = findUser(params.userId)
		if (!user) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// The acting admin is mock-admin-id; they can't change their own role.
		if (
			params.userId === 'mock-admin-id' &&
			body.role !== undefined &&
			body.role !== user.role
		) {
			return HttpResponse.json(
				{ message: 'You cannot change your own role.' },
				{ status: 400 },
			)
		}

		const nextUsername = body.username?.toLowerCase()
		// Uniqueness (excluding the user being edited). The backend reuses the
		// same error for username and email conflicts.
		const conflict = users.some(
			(other) =>
				other.id !== user.id &&
				((nextUsername !== undefined &&
					other.username === nextUsername) ||
					(body.email !== undefined && other.email === body.email)),
		)
		if (conflict) {
			return HttpResponse.json(
				{ message: 'E-mail already exists.' },
				{ status: 409 },
			)
		}

		if (nextUsername !== undefined) {
			user.username = nextUsername
		}
		if (body.role !== undefined) {
			user.role = body.role
		}
		if (body.email !== undefined) {
			user.email = body.email
			// Changing the email unverifies the account until it's confirmed.
			user.is_verified = false
		}
		if (body.is_verified !== undefined) {
			user.is_verified = body.is_verified
		}

		return HttpResponse.json({ user })
	},
)
```

Registre os handlers admin no worker. Abra `src/api/mocks/index.ts` e **adicione** estes três
imports (junto dos que já existem):

```ts
// Adicione:
import { getUserMock } from './get-user-mock'
import { getUsersMock } from './get-users-mock'
import { updateUserMock } from './update-user-mock'
```

E **adicione** os três handlers **no final** do `setupWorker(...)` — eles têm que vir **depois**
de todos os GET estáticos `/users/...` (os `verifyEmail*` e o `confirmEmailChangeByLinkMock`):

```ts
// Adicione no final do setupWorker
getUsersMock,
getUserMock,
updateUserMock,
```

> **A ordem importa aqui.** O MSW testa os handlers **na ordem** e o primeiro que casa vence.
> `GET /users/:userId` (o `getUserMock`) casa com **qualquer** `/users/algo` — inclusive
> `/users/verify-email` e `/users/confirm-email-change`. Por isso ele entra **no fim**, depois dos
> GET estáticos `/users/...`; senão os engoliria. (O `updateGymMock` entra só na §3, quando o
> arquivo dele existir.)

### 2.4. A tabela (`/admin/users`)

Precisamos de três componentes do shadcn: `table`, `select` e `switch` (este e a tabela aqui; o
select e o switch na página de edição). Nenhum traz dependência nova — todos usam o pacote
`radix-ui` que já está instalado.

```sh
pnpm dlx shadcn@latest add table select switch
```

> Os arquivos gerados usam aspas duplas e `"use client"`, então rode `pnpm lint:fix` depois (já
> está no commit da seção). Não há mudança em `package.json` — `git add src` basta.

PM com paginação e formatação de data (formatar é trabalho do PM; a view só renderiza string).

```sh
mkdir -p src/pages/app/admin/users
```

Vá na pasta `src/pages/app/admin/users` e crie `use-users-pm.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { getUsers } from '@/api/get-users'

const PAGE_SIZE = 20

const dateFormatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: 'medium',
})

export type UsersStatus = 'loading' | 'empty' | 'list'

// View model: the PublicUser shaped for the table (formatted date + a flag), so
// the view stays pure markup.
export interface UserRow {
	id: string
	username: string
	email: string
	role: 'MEMBER' | 'ADMIN'
	verified: boolean
	created: string
}

export function useUsersPM() {
	const [page, setPage] = useState(1)

	const { data: users = [], isLoading } = useQuery({
		queryKey: ['users', page],
		queryFn: () => getUsers({ page }),
	})

	const rows: UserRow[] = users.map((user) => ({
		id: user.id,
		username: user.username,
		email: user.email,
		role: user.role,
		verified: user.is_verified,
		created: dateFormatter.format(new Date(user.created_at)),
	}))

	let status: UsersStatus
	if (isLoading) {
		status = 'loading'
	} else if (users.length === 0) {
		status = 'empty'
	} else {
		status = 'list'
	}

	return {
		rows,
		status,
		page,
		hasPrevPage: page > 1,
		hasNextPage: users.length === PAGE_SIZE,
		nextPage: () => setPage((current) => current + 1),
		prevPage: () => setPage((current) => Math.max(1, current - 1)),
	}
}
```

Vá na pasta `src/pages/app/admin/users` e crie `users.tsx`:

```tsx
import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

import { useUsersPM } from './use-users-pm'

export function AdminUsers() {
	const pm = useUsersPM()

	return (
		<>
			<PageTitle title='Users' />

			<div className='flex flex-1 flex-col gap-4 p-8'>
				<div>
					<h1 className='text-2xl font-bold'>Users</h1>
					<p className='text-muted-foreground text-sm'>
						Manage member and admin accounts.
					</p>
				</div>

				{pm.status === 'loading' && (
					<p className='text-muted-foreground text-sm'>Loading…</p>
				)}

				{pm.status === 'empty' && (
					<p className='text-muted-foreground text-sm'>
						No users found.
					</p>
				)}

				{pm.status === 'list' && (
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Username</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead className='text-right'>
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pm.rows.map((row) => (
									<TableRow key={row.id}>
										<TableCell className='font-medium'>
											{row.username}
										</TableCell>
										<TableCell>{row.email}</TableCell>
										<TableCell>
											<Badge
												variant={
													row.role === 'ADMIN'
														? 'default'
														: 'secondary'
												}
											>
												{row.role === 'ADMIN'
													? 'Admin'
													: 'Member'}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													row.verified
														? 'default'
														: 'outline'
												}
											>
												{row.verified
													? 'Verified'
													: 'Unverified'}
											</Badge>
										</TableCell>
										<TableCell className='text-muted-foreground'>
											{row.created}
										</TableCell>
										<TableCell className='text-right'>
											<Button
												asChild
												variant='outline'
												size='sm'
											>
												<Link
													to={`/admin/users/${row.id}`}
												>
													Edit
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}

				<div className='flex items-center justify-end gap-2'>
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
			</div>
		</>
	)
}
```

### 2.5. A página de edição (`/admin/users/:userId`)

Aqui estão as **três regras** de permissão, espelhando o backend:

1. **Não rebaixar o próprio papel** → ao editar a si mesmo, o role aparece **read-only** (um
   `Badge`, não um `Select`), com um aviso (o backend devolveria `400 "You cannot change your own
   role."`).
2. **Trocar o email desverifica** → ao mexer no email, o `Switch` de "verified" é **forçado em
   off e desabilitado**, com um aviso.
3. **Email + verified juntos** → impossível pela regra 2, e o backend rejeitaria com `400`.

A página **busca o usuário por id** (`useQuery(['users', userId])`) — por isso sobrevive a um
refresh. Usamos um form controlado pelo `react-hook-form`, com `Controller` para o `Select` e o
`Switch` (componentes controlados), e `useWatch` para reagir à mudança do email.

```sh
mkdir -p src/pages/app/admin/users/user-edit
```

Vá na pasta `src/pages/app/admin/users/user-edit` e crie `use-user-edit-pm.ts`:

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { getUser } from '@/api/get-user'
import { type UpdateUserBody, updateUser } from '@/api/update-user'
import { useAuth } from '@/components/auth/auth-hooks'

const usernamePattern = /^[a-zA-Z0-9_]+$/

const editForm = z.object({
	username: z
		.string()
		.min(3, 'Minimum of 3 characters.')
		.max(30, 'Maximum of 30 characters.')
		.regex(usernamePattern, 'Letters, numbers and underscore only.'),
	email: z.email('Enter a valid email.'),
	role: z.enum(['MEMBER', 'ADMIN']),
	is_verified: z.boolean(),
})
type EditForm = z.infer<typeof editForm>

export function useUserEditPM() {
	const { userId = '' } = useParams()
	const auth = useAuth()
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	// Fetch the user by id so the page stands alone (refresh / direct link).
	const {
		data: user,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['users', userId],
		queryFn: () => getUser(userId),
		enabled: Boolean(userId),
		retry: false,
	})

	const {
		register,
		control,
		handleSubmit,
		setValue,
		formState: { errors, dirtyFields },
	} = useForm<EditForm>({
		resolver: zodResolver(editForm),
		defaultValues: {
			username: '',
			email: '',
			role: 'MEMBER',
			is_verified: false,
		},
		// `values` (not a post-mount reset) re-seeds the form when the async user
		// load resolves. It refreshes the Controller-bound Select/Switch too — a
		// reset() inside an effect leaves those stale (register inputs seed, the
		// Controllers don't), so on first open Role/verified came up blank.
		values: user
			? {
					username: user.username,
					email: user.email,
					role: user.role,
					is_verified: user.is_verified,
				}
			: undefined,
	})

	// Rule: changing the email unverifies the account, so the verified toggle is
	// forced off (and disabled in the view) while the email differs. dirtyFields
	// (not a watched value) tells us the email diverged from the seeded baseline
	// — no first-render lag that would wrongly clobber the seeded verified flag.
	const emailChanged = Boolean(dirtyFields.email)
	useEffect(() => {
		if (emailChanged) {
			setValue('is_verified', false)
		}
	}, [emailChanged, setValue])

	const update = useMutation({
		mutationFn: (body: UpdateUserBody) => updateUser(userId, body),
		onSuccess: () => {
			toast.success('User updated.')
			queryClient.invalidateQueries({ queryKey: ['users'] })
			navigate('/admin/users')
		},
		onError: (err) => {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not update the user.'
			toast.error(message)
		},
	})

	function onSubmit(data: EditForm) {
		if (!user) {
			return
		}

		// Send only the changed fields — the backend requires at least one and
		// rejects an email+is_verified:true combination.
		const body: UpdateUserBody = {}
		if (data.username !== user.username) {
			body.username = data.username
		}
		if (data.email !== user.email) {
			body.email = data.email
		}
		if (data.role !== user.role) {
			body.role = data.role
		}
		if (!emailChanged && data.is_verified !== user.is_verified) {
			body.is_verified = data.is_verified
		}

		if (Object.keys(body).length === 0) {
			toast.info('No changes to save.')
			return
		}

		update.mutate(body)
	}

	return {
		isLoading,
		isError,
		user,
		register,
		control,
		errors,
		// Rule: an admin cannot change their own role.
		isSelf: auth.user?.id === userId,
		emailChanged,
		isSaving: update.isPending,
		handleSubmit: handleSubmit(onSubmit),
		cancel: () => navigate('/admin/users'),
	}
}
```

> **Três decisões que parecem detalhe e não são** (bugs reais que só apareceram no smoke por causa
> delas). **(1) `values`, não `reset()` num efeito.** Com dados assíncronos, semear o form via
> `reset()` dentro de `useEffect` atualiza os inputs de `register`, mas **deixa os campos de
> `Controller` defasados**. O prop `values` do RHF reidrata **tudo**, Controllers inclusive.
> **(2) `dirtyFields.email`, não `useWatch`.** Comparar um valor "observado" contra `user.email`
> sofre **lag de um render** no load — `emailChanged` vira `true` por engano por um instante e o
> efeito **zera o `is_verified` recém-semeado**. `dirtyFields.email` só fica `true` quando o usuário
> muda o email de fato. **(3) No `Select` do role: `key={user.id}` + `defaultValue`, não `value`.**
> Ao **navegar entre usuários** (`/admin/users/:id` → outro id, sem reload), o `useForm` persiste e
> o `value` controlado fica **stale** no transient da troca; o Radix Select não reidrata o display
> sem reabrir, e o role vem vazio no 2º usuário. `key={pm.user?.id}` **remonta** o Select por
> usuário e `defaultValue` o semeia no mount — robusto. **Por que os testes não pegaram:** o e2e
> **clicava** para escolher o role (não dependia do valor semeado); o unit roda em **happy-dom**,
> que renderiza o valor do Radix Select avidamente (sem o portal lazy do browser real); e o
> transient de navegação o Playwright **espera passar** (auto-retry). O §4.1 agora cobre o seeding
> de um usuário; o caso de **troca entre usuários** ficou verificado no smoke manual.

Vá na pasta `src/pages/app/admin/users/user-edit` e crie `user-edit.tsx`:

```tsx
import { Controller } from 'react-hook-form'
import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import { useUserEditPM } from './use-user-edit-pm'

export function UserEdit() {
	const pm = useUserEditPM()

	return (
		<>
			<PageTitle title='Edit user' />

			<div className='flex flex-1 justify-center p-8'>
				<Card className='w-full max-w-lg'>
					{pm.isLoading && (
						<CardHeader>
							<CardTitle>Loading…</CardTitle>
						</CardHeader>
					)}

					{pm.isError && (
						<>
							<CardHeader>
								<CardTitle>User not found</CardTitle>
								<CardDescription>
									This user does not exist or could not be
									loaded.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild variant='outline'>
									<Link to='/admin/users'>Back to users</Link>
								</Button>
							</CardContent>
						</>
					)}

					{!pm.isLoading && !pm.isError && pm.user && (
						<>
							<CardHeader>
								<CardTitle>Edit user</CardTitle>
								<CardDescription>
									Update {pm.user.username}'s account.
								</CardDescription>
							</CardHeader>

							<CardContent>
								<form onSubmit={pm.handleSubmit} noValidate>
									<div className='flex flex-col gap-6'>
										<div className='grid gap-2'>
											<Label htmlFor='username'>
												Username
											</Label>
											<Input
												id='username'
												{...pm.register('username')}
											/>
											{pm.errors.username && (
												<p className='text-destructive text-sm'>
													{pm.errors.username.message}
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='email'>Email</Label>
											<Input
												id='email'
												type='email'
												{...pm.register('email')}
											/>
											{pm.errors.email && (
												<p className='text-destructive text-sm'>
													{pm.errors.email.message}
												</p>
											)}
											{pm.emailChanged && (
												<p className='text-muted-foreground text-sm'>
													Changing the email will
													unverify this account.
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='role'>Role</Label>
											{pm.isSelf ? (
												// Your own role can't change — show
												// it read-only. (A disabled Select
												// wouldn't even render its value.)
												<Badge
													variant={
														pm.user.role === 'ADMIN'
															? 'default'
															: 'secondary'
													}
													className='w-fit'
												>
													{pm.user.role === 'ADMIN'
														? 'Admin'
														: 'Member'}
												</Badge>
											) : (
												<Controller
													control={pm.control}
													name='role'
													render={({ field }) => (
														// key remounts the Select per
														// user; defaultValue seeds it
														// uncontrolled. A controlled
														// value goes stale during the
														// cross-user navigation transient
														// (useForm persists) and Radix
														// won't re-show it without
														// reopening.
														<Select
															key={pm.user?.id}
															defaultValue={
																field.value
															}
															onValueChange={
																field.onChange
															}
														>
															<SelectTrigger id='role'>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value='MEMBER'>
																	Member
																</SelectItem>
																<SelectItem value='ADMIN'>
																	Admin
																</SelectItem>
															</SelectContent>
														</Select>
													)}
												/>
											)}
											{pm.isSelf && (
												<p className='text-muted-foreground text-sm'>
													You can't change your own
													role.
												</p>
											)}
										</div>

										<div className='flex items-center justify-between'>
											<Label htmlFor='is_verified'>
												Email verified
											</Label>
											<Controller
												control={pm.control}
												name='is_verified'
												render={({ field }) => (
													<Switch
														id='is_verified'
														checked={field.value}
														onCheckedChange={
															field.onChange
														}
														disabled={
															pm.emailChanged
														}
													/>
												)}
											/>
										</div>

										<div className='flex gap-2'>
											<Button
												type='submit'
												disabled={pm.isSaving}
												className='flex-1'
											>
												Save changes
											</Button>
											<Button
												type='button'
												variant='ghost'
												onClick={pm.cancel}
											>
												Cancel
											</Button>
										</div>
									</div>
								</form>
							</CardContent>
						</>
					)}
				</Card>
			</div>
		</>
	)
}
```

### 2.6. As rotas e o grupo Admin no sidebar

Abra `src/routes.tsx`, importe as duas páginas e registre as rotas **dentro do bloco
`RoleRoute allow={['ADMIN']}`** (onde já mora o `gyms/new`):

```tsx
import { AdminUsers } from './pages/app/admin/users/users'
import { UserEdit } from './pages/app/admin/users/user-edit/user-edit'
```

```tsx
// Substitua o bloco que contém:
element: <RoleRoute allow={['ADMIN']} />
// Por:
{
	element: <RoleRoute allow={['ADMIN']} />,
	children: [
		{ path: 'gyms/new', element: <NewGym /> },
		{ path: 'admin/users', element: <AdminUsers /> },
		{ path: 'admin/users/:userId', element: <UserEdit /> },
	],
},
```

Agora o grupo **Admin** no sidebar. Abra `src/components/app-sidebar/use-app-sidebar-pm.ts` e
adicione os `adminItems` (New gym volta aqui, agora ao lado de Users):

```ts
// Substitua o import dos icons por:
import {
	Dumbbell,
	History,
	LayoutDashboard,
	Plus,
	UserCog,
	Users,
} from 'lucide-react'
```

```ts
// Inclua depois do bloco const items...

// Admin nav: a separate, labelled group, only built for admins. The routes
// are still guarded (defense in depth) — hiding the links is just UX.
const adminItems =
	user?.role === 'ADMIN'
		? [
				{ to: '/gyms/new', label: 'New gym', icon: Plus },
				{ to: '/admin/users', label: 'Users', icon: Users },
			]
		: []
```

E inclua `adminItems` no retorno do PM:

```ts
	return {
		// Depois de:
		user,
		items,
		// Adicione:
		adminItems,
```

Por fim, a view. Abra `src/components/app-sidebar/app-sidebar.tsx`, importe o
`SidebarGroupLabel` e renderize um segundo grupo quando houver itens de admin:

```tsx
import {
	// Adicione:
	SidebarGroupLabel,
	// No grupo de imports:
} from '@/components/ui/sidebar'
```

Logo depois do `</SidebarGroup>` do menu principal, dentro do `<SidebarContent>`:

```tsx
{
	pm.adminItems.length > 0 && (
		<SidebarGroup>
			<SidebarGroupLabel>Admin</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{pm.adminItems.map((item) => (
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
	)
}
```

### 2.7. Commit

```sh
pnpm lint:fix && pnpm test:run
git add src
git commit -m "feat: admin users (list + edit + RBAC rules)"
```

---

## 3. Editar academia (Dialog no card)

A edição de gym é **contextual**: um botão **Edit** (admin-only) no próprio `GymCard`, abrindo
um `Dialog`. O `PATCH /gyms/:gymId` só mexe em **title / description / phone** — a localização é
fixa na criação, então **não** vai no form.

### 3.1. A API

Vá na pasta `src/api` e crie `update-gym.ts` (reusa o `Gym` e o `normalizeGym` da Parte 8):

```ts
import { api } from '@/lib/api'

import { type Gym, normalizeGym } from './search-gyms'

// Admin edit. Only the three editable fields — latitude/longitude are fixed at
// creation, so they are not part of the update.
export interface UpdateGymBody {
	title?: string
	description?: string | null
	phone?: string | null
}

interface UpdateGymResponse {
	gym: Gym
}

export async function updateGym(gymId: string, body: UpdateGymBody) {
	const response = await api.patch<UpdateGymResponse>(`/gyms/${gymId}`, body)

	return normalizeGym(response.data.gym)
}
```

Vá na pasta `src/api/mocks` e crie `update-gym-mock.ts`:

```ts
import { http, HttpResponse } from 'msw'

import type { UpdateGymBody } from '../update-gym'
import { gyms } from './gyms-data'

export const updateGymMock = http.patch<{ gymId: string }, UpdateGymBody>(
	'/gyms/:gymId',
	async ({ request, params }) => {
		// Mirror the backend RBAC: only the admin token may edit a gym.
		if (
			request.headers.get('Authorization') !==
			'Bearer mock-admin-jwt-token'
		) {
			return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
		}

		const body = await request.json()
		if (
			body.title === undefined &&
			body.description === undefined &&
			body.phone === undefined
		) {
			return HttpResponse.json(
				{ message: 'Provide at least one field to update.' },
				{ status: 400 },
			)
		}

		const gym = gyms.find((candidate) => candidate.id === params.gymId)
		if (!gym) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		if (body.title !== undefined) {
			gym.title = body.title
		}
		if (body.description !== undefined) {
			gym.description = body.description
		}
		if (body.phone !== undefined) {
			gym.phone = body.phone
		}

		return HttpResponse.json({ gym })
	},
)
```

Agora que o arquivo existe, registre-o. Abra `src/api/mocks/index.ts` e **adicione** o import:

```ts
// Adicione:
import { updateGymMock } from './update-gym-mock'
```

E **adicione** dentro do `setupWorker(...)`:

```ts
// Adicione no final do setupWorker:
updateGymMock,
```

### 3.2. O Dialog e o botão no card

O Dialog é dono do próprio estado de aberto/fechado; reabrir reseta o form para os valores
atuais da academia.

Vá na pasta `src/pages/app/gyms` e crie `use-edit-gym-pm.ts`:

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { Gym } from '@/api/search-gyms'
import { type UpdateGymBody, updateGym } from '@/api/update-gym'

// Mirrors the backend's editable fields — no latitude/longitude (fixed at
// creation). Same phone pattern as the create form.
const phonePattern = /^\+?[\d\s().-]{7,20}$/

const editGymForm = z.object({
	title: z.string().min(1, 'Title is required.'),
	description: z.string(),
	phone: z
		.string()
		.regex(phonePattern, 'Enter a valid phone number.')
		.or(z.literal('')),
})
type EditGymForm = z.infer<typeof editGymForm>

export function useEditGymPM(gym: Gym) {
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<EditGymForm>({
		resolver: zodResolver(editGymForm),
		defaultValues: {
			title: gym.title,
			description: gym.description ?? '',
			phone: gym.phone ?? '',
		},
	})

	function onOpenChange(next: boolean) {
		// Reset to the gym's current values each time the dialog opens.
		if (next) {
			reset({
				title: gym.title,
				description: gym.description ?? '',
				phone: gym.phone ?? '',
			})
		}
		setOpen(next)
	}

	const { mutateAsync: saveGym } = useMutation({
		mutationFn: (body: UpdateGymBody) => updateGym(gym.id, body),
	})

	async function onSubmit(data: EditGymForm) {
		try {
			const updated = await saveGym({
				title: data.title,
				description: data.description || null,
				phone: data.phone || null,
			})
			toast.success(`Gym "${updated.title}" updated.`)
			// Refetch the nearby/search lists so the card reflects the change.
			await queryClient.invalidateQueries({ queryKey: ['gyms'] })
			setOpen(false)
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not update the gym.'
			toast.error(message)
		}
	}

	return {
		open,
		onOpenChange,
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}
```

Vá na pasta `src/pages/app/gyms` e crie `edit-gym-dialog.tsx`:

```tsx
import { Pencil } from 'lucide-react'

import type { Gym } from '@/api/search-gyms'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useEditGymPM } from './use-edit-gym-pm'

export function EditGymDialog({ gym }: { gym: Gym }) {
	const pm = useEditGymPM(gym)

	return (
		<Dialog open={pm.open} onOpenChange={pm.onOpenChange}>
			<DialogTrigger asChild>
				<Button variant='outline' className='w-full'>
					<Pencil className='size-4' />
					Edit
				</Button>
			</DialogTrigger>

			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Edit gym</DialogTitle>
					<DialogDescription>
						Update this gym's details. Location can't be changed.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={pm.handleSubmit} noValidate>
					<div className='flex flex-col gap-6'>
						<div className='grid gap-2'>
							<Label htmlFor='edit-title'>Title</Label>
							<Input id='edit-title' {...pm.register('title')} />
							{pm.errors.title && (
								<p className='text-destructive text-sm'>
									{pm.errors.title.message}
								</p>
							)}
						</div>

						<div className='grid gap-2'>
							<Label htmlFor='edit-description'>
								Description
							</Label>
							<Input
								id='edit-description'
								{...pm.register('description')}
							/>
						</div>

						<div className='grid gap-2'>
							<Label htmlFor='edit-phone'>Phone</Label>
							<Input id='edit-phone' {...pm.register('phone')} />
							{pm.errors.phone && (
								<p className='text-destructive text-sm'>
									{pm.errors.phone.message}
								</p>
							)}
						</div>

						<DialogFooter>
							<Button
								type='submit'
								disabled={pm.isSubmitting}
								className='w-full'
							>
								Save changes
							</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
```

Agora pendure o botão no card. Abra `src/pages/app/gyms/gym-card.tsx` e adicione o `useAuth`, o
import do dialog, e o botão admin-only no rodapé:

```tsx
import { useAuth } from '@/components/auth/auth-hooks'
import { EditGymDialog } from './edit-gym-dialog'
```

No topo do componente, descubra o papel:

```tsx
// Depois de:
const { handleCheckIn, isCheckingIn } = useCheckIn()
// Adicione:
const { user } = useAuth()
const isAdmin = user?.role === 'ADMIN'
```

E troque o `CardFooter` para empilhar os botões (Check in + Edit):

```tsx
// Substitua o bloco todo por:
<CardFooter className='flex-col gap-2'>
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

	{/* Editing a gym is an ADMIN-only action (the route-level guard
				    still protects the API; hiding the button is just UX). */}
	{isAdmin && <EditGymDialog gym={gym} />}
</CardFooter>
```

### 3.3. Commit

```sh
pnpm lint:fix && pnpm test:run
git add src
git commit -m "feat: edit gym from the card"
```

---

## 4. Testes

### 4.1. Unit — as três regras da edição de usuário

O que é difícil de exercitar no e2e (a trava do **próprio** papel) cai bem no unit. Renderizamos
a página de edição injetando o `AuthContext` (igual ao teste da Parte 9) e dentro de um
`<Routes>` que define o param `:userId`, com o `getUser` mockado.

Vá na pasta `src/pages/app/admin/users/user-edit` e crie `user-edit.spec.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { vi } from 'vitest'

import {
	AuthContext,
	type AuthContextValue,
} from '@/components/auth/auth-context'

import { renderWithProviders } from '../../../../../../test/utils'
import { UserEdit } from './user-edit'

// The edit page fetches the user by id; return a verified member.
vi.mock('@/api/get-user', () => ({
	getUser: vi.fn(async (id: string) => ({
		id,
		username: 'memberx',
		email: 'memberx@example.com',
		role: 'MEMBER',
		is_verified: true,
		created_at: '2026-03-01T12:00:00.000Z',
		password_changed_at: null,
	})),
}))

function renderEdit({
	selfId,
	targetId,
}: {
	selfId: string
	targetId: string
}) {
	const value: AuthContextValue = {
		status: 'authed',
		user: {
			id: selfId,
			username: 'admin',
			isVerified: true,
			role: 'ADMIN',
		},
		signIn: async () => {},
		signOut: async () => {},
		reloadUser: async () => {},
	}

	return renderWithProviders(
		<AuthContext.Provider value={value}>
			<Routes>
				<Route path='/admin/users/:userId' element={<UserEdit />} />
			</Routes>
		</AuthContext.Provider>,
		{ route: `/admin/users/${targetId}` },
	)
}

describe('UserEdit page', () => {
	it('shows the role read-only (no select) when editing your own account', async () => {
		renderEdit({ selfId: 'me', targetId: 'me' })

		expect(
			await screen.findByText("You can't change your own role."),
		).toBeInTheDocument()
		// Self-edit renders the role as a static badge, not an editable select.
		expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
	})

	it('seeds the form and allows changing the role of another user', async () => {
		renderEdit({ selfId: 'admin-id', targetId: 'other-id' })

		expect(await screen.findByLabelText('Username')).toHaveValue('memberx')
		// Controller-bound fields must seed from the loaded user. Regression: a
		// reset() in an effect left the Select/Switch blank on first open, so
		// the role failed validation and Save silently did nothing.
		expect(screen.getByRole('combobox')).toHaveTextContent('Member')
		expect(screen.getByRole('switch')).toBeChecked()
		expect(
			screen.queryByText("You can't change your own role."),
		).not.toBeInTheDocument()
		expect(screen.getByRole('combobox')).toBeEnabled()
	})

	it('forces the verified toggle off when the email changes', async () => {
		renderEdit({ selfId: 'admin-id', targetId: 'other-id' })

		const email = await screen.findByLabelText('Email')
		expect(screen.getByRole('switch')).toBeEnabled()

		await userEvent.clear(email)
		await userEvent.type(email, 'changed@example.com')

		expect(
			await screen.findByText(
				'Changing the email will unverify this account.',
			),
		).toBeInTheDocument()
		expect(screen.getByRole('switch')).toBeDisabled()
	})
})
```

### 4.2. e2e — self-service da conta

Vá na pasta `test` e crie `account.spec.ts`:

```ts
import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

async function signIn(page: Page, identifier: string) {
	await page.goto('/sign-in')
	await page.getByLabel('Email or username').fill(identifier)
	await page.getByLabel('Password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign in' }).click()
	await expect(page).toHaveURL('/')
}

test('member updates their username from the account page', async ({
	page,
}) => {
	await signIn(page, 'johndoe')

	await page.getByRole('link', { name: 'Account' }).click()
	await expect(page).toHaveURL('/account')

	await page.getByLabel('Username').fill('johnny')
	await page.getByRole('button', { name: 'Save' }).click()

	await expect(page.getByText('Profile updated.')).toBeVisible()
	// The sidebar reflects the new username after the profile refetch.
	await expect(page.getByText('johnny', { exact: true })).toBeVisible()

	await waitForUIInspection(page)
})

test('member changes their email with the confirmation code', async ({
	page,
}) => {
	await signIn(page, 'johndoe')

	await page.getByRole('link', { name: 'Account' }).click()

	await page.getByRole('button', { name: 'Change email' }).click()
	await page.getByLabel('New email').fill('new@example.com')
	await page.getByRole('button', { name: 'Send confirmation' }).click()

	// The card swaps to the OTP step, naming the pending address.
	await expect(
		page.getByText('new@example.com', { exact: true }),
	).toBeVisible()

	await page.locator('[data-slot="input-otp"]').click()
	await page.keyboard.type('123456')
	await page.getByRole('button', { name: 'Confirm' }).click()

	await expect(page.getByText('Email updated.')).toBeVisible()

	await waitForUIInspection(page)
})

test('confirms an email change from a valid link', async ({ page }) => {
	await page.goto('/users/confirm-email-change?token=valid-token')

	await expect(page.getByText('Email confirmed')).toBeVisible()

	await waitForUIInspection(page)
})
```

> **Por que digitar no OTP com `keyboard.type`.** O `input-otp` esconde um `<input>` por trás dos
> seis slots. A gente clica no campo (`[data-slot="input-otp"]`) para focá-lo e manda as teclas
> uma a uma — é como o usuário digita de verdade.

### 4.3. e2e — a área admin

Vá na pasta `test` e crie `admin.spec.ts`:

```ts
import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

// Geolocation granted so the gyms page resolves "nearby" (used by the gym-edit
// test below).
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

test('admin lists users and promotes a member', async ({ page }) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'Users' }).click()
	await expect(page).toHaveURL('/admin/users')
	await expect(page.getByText('member3@example.com')).toBeVisible()

	// Open the dedicated edit page for that member.
	await page
		.getByRole('row')
		.filter({ hasText: 'member3@example.com' })
		.getByRole('link', { name: 'Edit' })
		.click()
	await expect(page).toHaveURL(/\/admin\/users\/.+/)

	// The role select must show the seeded value on load (before any click) —
	// this is the case that broke on a real browser but not in happy-dom.
	await expect(page.getByRole('combobox')).toContainText('Member')

	// Promote MEMBER → ADMIN via the role select.
	await page.getByRole('combobox').click()
	await page.getByRole('option', { name: 'Admin' }).click()
	await page.getByRole('button', { name: 'Save changes' }).click()

	await expect(page.getByText('User updated.')).toBeVisible()
	await expect(page).toHaveURL('/admin/users')

	await waitForUIInspection(page)
})

test('member does not see the admin navigation', async ({ page }) => {
	await signIn(page, 'johndoe')

	await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0)
	await expect(page.getByRole('link', { name: 'New gym' })).toHaveCount(0)

	await waitForUIInspection(page)
})

test('admin edits a gym from the gym card', async ({ page }) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'Gyms' }).click()
	await expect(page.getByText('Iron Temple')).toBeVisible()

	// The Edit button is admin-only; open the dialog on the first card.
	await page.getByRole('button', { name: 'Edit' }).first().click()
	await expect(page.getByRole('dialog')).toBeVisible()

	await page.getByLabel('Title').fill('Iron Temple Reborn')
	await page.getByRole('button', { name: 'Save changes' }).click()

	await expect(
		page.getByText('Gym "Iron Temple Reborn" updated.'),
	).toBeVisible()
	// Exact match: the success toast also contains the new title.
	await expect(
		page.getByText('Iron Temple Reborn', { exact: true }),
	).toBeVisible()

	await waitForUIInspection(page)
})
```

> **Por que `getByText(..., { exact: true })` no título da academia.** Depois de salvar, o card
> mostra "Iron Temple Reborn" **e** o toast mostra `Gym "Iron Temple Reborn" updated.`. Sem
> `exact`, o `getByText` casaria com os dois (busca por substring) e o modo estrito do Playwright
> acusaria dois elementos. Mesma lição da Parte 9.

### 4.4. Commit

```sh
pnpm lint:fix && pnpm test:run
git add src test
git commit -m "test: cover account + admin"
```

Os gates devem fechar verdes: **20 unit** e **21 e2e** no total.

---

## 5. Smoke test no backend real

Agora o de sempre: subir o backend real e exercitar à mão. O smoke pega o que o mock não pega
(serialização, CORS, regras de tempo). Mantenha o olho aberto para qualquer `PATCH` que falhe.

### 5.1. Subir tudo

No backend (`solid_api_sample`): **`git pull`** — você precisa da rota nova `GET /users/:userId`
**e** do CORS com `methods` incluindo `PATCH`/`PUT` (sem ele, nada nesta parte funciona). Suba
com `pnpm dev` (porta 3333; `pnpm killapp` se travar). Garanta o admin semeado:

```sh
pnpm seeddb
```

No frontend, `pnpm dev` (porta 3001). Entre como admin com `ADMIN_USERNAME` / `ADMIN_PASSWORD`
do `.env` (username lowercased; no exemplo padrão, `admin` / `Admin@12345`):

```
admin
```

```
Admin@12345
```

### 5.2. Conta: trocar o username e o email

1. **Username.** Abra **Account** (ícone ✎ no rodapé do sidebar, ao lado do badge de papel),
   mude o username (ex.: `admin_boss`) e clique **Save** →
   toast **"Profile updated."** e o nome no rodapé do sidebar muda. (Tente um username já
   existente para ver o `409` com a mensagem do backend.)
2. **Email — porta do código.** No card de Email, clique **Change email**, informe um endereço
   novo e **Send confirmation**. O card vira o passo do código. O **código aparece no console do
   backend** (dev). Digite os 6 dígitos, **Confirm** → toast **"Email updated."**
3. **Email — porta do link.** Repita o pedido de troca, mas em vez do código, **clique no link**
   do email (no console do backend, ele aponta para `…/users/confirm-email-change?token=…`).
   Cai na landing → **"Email confirmed"**.

> **Sobre verificação.** Na troca self-service você prova o novo endereço (código ou link),
> então a conta continua verificada — o banner da Parte 7 não aparece. É diferente da troca pelo
> **admin** (abaixo), que **desverifica** a conta do outro.

> **Se o `Confirm` falhar com "Invalid or expired code." mesmo com o código fresco:** sua
> **sessão expirou** (smoke demorado = access token, e às vezes o refresh, vencidos). O `confirm`
> tomou `401` e o erro caiu no fallback genérico do toast. **Faça logout/login** e refaça a troca
> — em sessão normal o silent-refresh cobre isso. Esse fallback pouco específico no `401` é o
> tipo de aresta que só o smoke real expõe; o front degrada sem quebrar.

### 5.3. Admin: governar usuários

Como admin, abra **Users** (grupo **Admin** no sidebar). A tabela lista os usuários reais do
banco. Clique **Edit** numa linha que **não** seja a sua e exercite as regras:

1. **Promover/rebaixar** um membro (role) e **Save changes** → **"User updated."**. A lista
   reflete.
2. **Trocar o email** de um usuário: o `Switch` "Email verified" trava em off, com o aviso. Ao
   salvar, aquele usuário fica **desverificado** (o backend dispara a confirmação para o novo
   endereço).
3. **Tente editar a si mesmo:** o role vira **read-only** (Badge, sem `Select`). Mesmo via API,
   rebaixar o próprio papel devolve `400 "You cannot change your own role."`.

> **Suspeite de novos warts aqui.** Este é o primeiro lugar onde o **browser** dispara `PATCH
/users/:id` e `PATCH /auth/me` contra o backend real. Se algum falhar com toast genérico e o
> backend logar só `OPTIONS → 204` sem o `PATCH` em seguida, é CORS (a lição da Parte 9) — mas
> isso já deve estar resolvido no `master`. Se um campo numérico/serializado vier estranho,
> lembre do `Decimal`-string da Parte 8.

### 5.4. Editar uma academia

Vá em **Gyms**. Como admin, cada card tem **Edit**. Abra, mude o **title** (ou phone) e **Save
changes** → toast **"Gym ... updated."** e o card reflete na hora. Repare que **não há** campo de
latitude/longitude: a localização é imutável por essa rota.

Deu tudo certo? **Parte 10 fechada — e o tutorial completo.** ✅

---

## 6. O fim da trilha

Partindo de um `index.html` em branco, o app passou por **Tailwind → shadcn → MSW (mock-first)
→ Vitest → Playwright → backend real → email & senha → academias & sidebar & guard por papel →
check-ins & dashboard** e agora **edição & permissões**. O RBAC fechou o ciclo: o admin não só
**cria** e **valida** — ele **governa** conta, usuários e academias, sempre atrás do `RoleRoute`
que nasceu na Parte 8.

O que ficou de método, e vale levar para qualquer projeto derivado:

- **Mock-first como contrato.** Espelhar o backend string-por-string deixa o front pronto antes
  da API — e o **smoke real** é quem pega o que o mock não vê (serialização `Decimal`, CORS sem
  `PATCH`, janelas de tempo).
- **Presentation Model.** Lógica e formatação no `use-x-pm`; a view é markup. Testa-se o PM e o
  gating sem subir o app inteiro.
- **Permissão em camadas.** Esconder o link é UX; o `RoleRoute` protege a rota; o backend é a
  verdade. As três coexistem (defesa em profundidade).

**Commit da documentação.** Por fim, versione este arquivo sozinho:

```sh
git add README_10_edit_permissions.md
git commit -m "docs: add part 10 tutorial (edit + permissions)"
```

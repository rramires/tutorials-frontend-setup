# Tutorial Frontend Setup — Parte 7: verificação de email e reset de senha

Continuação da Parte 6 (**README_6_backend.md**). Pré-requisito: o app conectado ao backend real — sessão autenticada (token em memória + refresh por cookie), rotas protegidas, layouts com header `Gympass Sample App`, e o MSW estendido mantendo unit/e2e verdes offline.

A Parte 6 fechou o ciclo de **sessão**. Esta abre o ciclo de **conta**: confirmar que o email é seu (**verificação**) e recuperar acesso quando a senha se perde (**reset**). São os dois fluxos de "auto-atendimento" que toda app real tem — e que destravam o que vem depois (o check-in, na Parte 9, exige email verificado).

- **Verificação de email** — banner persistente enquanto `is_verified` é `false`, com **duas portas**: um **código OTP** digitado dentro do app e um **link** que cai numa página de feedback.
- **Reset de senha** — também **duas portas**: a página **"esqueci minha senha"** (email → código → nova senha) e o **link** do email (token → nova senha).
- **Mock honesto** — os handlers MSW espelham o backend (códigos, 202 anti-enumeração, OTP), e o `/auth/me` mockado passa a refletir `is_verified` de verdade.

**Onde isto entra no fluxo (mock-first):**

```
telas → MSW deixa clicável → testes garantem que não quebra → backend real ✅
P7 segue o mesmo pipeline, agora sobre as rotas de conta
```

> **A ideia das "duas portas".** Cada fluxo tem um caminho **dentro do app** (você já está logado: digita o OTP) e um caminho por **link** (você clica no email, talvez nem esteja logado). O backend imprime o **link e o código no console** em modo dev — então no smoke você copia de lá. Em produção, iriam por email de verdade. Construímos as duas portas porque uma app derivada precisa das duas.

**Contrato do backend** (rotas desta parte — a fonte da verdade são os controllers da API):

| Rota                            | Entra                                                          | Sai (ok)                                            | Erros               |
| ------------------------------- | -------------------------------------------------------------- | --------------------------------------------------- | ------------------- |
| `GET /auth/me`                  | _(Bearer)_                                                     | `200 { user: { id, username, is_verified, role } }` | `401`               |
| `POST /users/forgot-password`   | `{ email }`                                                    | `202` (sempre — anti-enumeração)                    | `429`               |
| `POST /users/reset-password`    | `{ token, newPassword }` **ou** `{ email, code, newPassword }` | `204`                                               | `400`, `410`, `429` |
| `POST /users/send-verification` | _(Bearer)_                                                     | `204`                                               | `429`, `404`        |
| `POST /users/verify-email/otp`  | `{ code }` _(Bearer)_                                          | `204`                                               | `400`, `410`, `409` |
| `GET /users/verify-email`       | `?token=` _(público)_                                          | `204`                                               | `400`, `410`, `409` |

> **Rate limit (429).** As rotas públicas de conta (`/users`, `/auth/login`, `/users/forgot-password`, `/users/reset-password`) têm um limite **estrito de 5/min por IP**; `send-verification` tem **cooldown** próprio (com `retryAfter` na resposta). Tratamos o `429` com um toast claro em vez de um erro genérico.

---

### 1 - Componentes shadcn + o `APP_URL` no backend

- Antes do código, duas preparações: três componentes shadcn que os fluxos usam, e um ajuste de **uma linha** no `.env` do backend pra que os links de email caiam no SPA.

1 - Adicione os componentes (shadcn-first; o `input-otp` é o campo de código de 6 dígitos e o `dialog` é o modal do OTP):

```sh
pnpm dlx shadcn@latest add input-otp dialog
```

> **Se ele perguntar sobre `button.tsx`** (ou outro já existente), responda **N** (não sobrescrever) — você já tem a sua versão. Só os três novos entram.

2 - No projeto do **backend**, abra o `.env` e aponte o `APP_URL` pro frontend:

```sh
APP_URL=http://localhost:3001
```

> **Por que isso importa.** O backend monta os links de email como `${APP_URL}/users/verify-email?token=…` e `${APP_URL}/users/reset-password?token=…`. Com o default (`http://localhost:3333`, o próprio backend), o link de verify devolve um `204` cru e o de reset **quebra** (não há `GET /users/reset-password`, só `POST`). Apontando pro front (`:3001`), o link abre uma **página do SPA** que coleta o que falta e chama a API. Use `localhost` (não `127.0.0.1`) — o cookie de refresh cross-origin depende disso. As rotas do SPA precisam dos paths **exatos**: `/users/verify-email` e `/users/reset-password`.

3 - Normalize a formatação dos componentes novos e comite:

```sh
pnpm lint:fix
pnpm format
pnpm build
```

```sh
git add src package.json pnpm-lock.yaml
git commit -m "chore: add shadcn input-otp and dialog"
git push
```

> **Por que `package.json` + `pnpm-lock.yaml` aqui.** O `input-otp` é uma **dependência nova** (o `dialog` reusa o `radix-ui` que já existe). Diferente das outras seções (que só mexem em `src/`), esta instala um pacote — então o commit precisa carregar o `package.json` e o lockfile, senão um clone limpo não instala o `input-otp` e o build quebra.

---

### 2 - O `/auth/me` estendido (role + verificação)

- O `GET /auth/me` do backend agora devolve `is_verified` e `role` além de `id`/`username`. O front precisa **enxergar** isso: pra mostrar o banner (`is_verified`) e, lá na frente, pra RBAC (`role`). Estendemos o endpoint, o modelo `User`, e damos ao contexto um jeito de **re-buscar** o perfil quando o estado muda.

1 - Abra a **`src/api/get-profile.ts`** e amplie o DTO + mapeie pro modelo do app:

```ts
import { api } from '@/lib/api'

export interface GetProfileResponse {
	user: {
		id: string
		username: string
		is_verified: boolean
		role: 'MEMBER' | 'ADMIN'
	}
}

export async function getProfile() {
	const response = await api.get<GetProfileResponse>('/auth/me')

	// Map the wire DTO (snake_case) to the app's User model (camelCase).
	const { id, username, is_verified, role } = response.data.user

	return { id, username, isVerified: is_verified, role }
}
```

> **Por que mapear snake → camel.** O backend fala `is_verified` (a convenção dele); o front fala `isVerified` (a convenção dele). O DTO `GetProfileResponse` documenta o que vem **na rede**; o retorno mapeado é o **modelo do app**. Uma tradução fina num lugar só evita `is_verified` vazando por toda a UI.

2 - Abra a **`src/components/auth/auth-context.ts`** e estenda o `User` + adicione `reloadUser` ao contrato:

```ts
import { createContext } from 'react'

export type AuthStatus = 'loading' | 'authed' | 'guest'

export type Role = 'MEMBER' | 'ADMIN'

export interface User {
	id: string
	username: string
	isVerified: boolean
	role: Role
}

export interface AuthContextValue {
	status: AuthStatus
	user: User | null
	signIn: (token: string) => Promise<void>
	signOut: () => Promise<void>
	reloadUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
	status: 'loading',
	user: null,
	signIn: async () => {},
	signOut: async () => {},
	reloadUser: async () => {},
})
```

3 - Abra a **`src/components/auth/auth-provider.tsx`** e implemente o `reloadUser` (depois do `signOut`), expondo-o no value:

```tsx
// Refetch the profile to pick up server-side changes (e.g. is_verified
// flips to true after the user verifies their email).
async function reloadUser() {
	const profile = await getProfile()
	setUser(profile)
}

return (
	<AuthContext.Provider value={{ status, user, signIn, signOut, reloadUser }}>
		{children}
	</AuthContext.Provider>
)
```

> **Por que `reloadUser`.** A verificação acontece **sem recarregar a página** (você digita o OTP num dialog). Quando dá certo, o `is_verified` mudou **no servidor**, mas o `user` em memória ainda diz `false`. `reloadUser()` re-busca o `/auth/me` e atualiza o estado — o banner some sozinho. É a mesma razão de o backend ler `is_verified` fresco do banco a cada `/auth/me`.

4 - Agora o mock precisa acompanhar. Primeiro, um pedacinho de estado só-do-mock pra lembrar se o usuário verificou. Vá na pasta **`src/api/mocks`** e crie **`verified-state.ts`**:

```ts
// Mock-only state: tracks whether the demo user has verified their email.
// The /auth/me mock reads this so is_verified flips to true after a successful
// verification — the banner clears on refetch, exactly like the real backend.
let verified = false

export function isVerified() {
	return verified
}

export function setVerified(value: boolean) {
	verified = value
}
```

5 - Abra a **`src/api/mocks/profile-mock.ts`** e devolva os campos novos (lendo o estado):

```ts
import { http, HttpResponse } from 'msw'

import { isVerified } from './verified-state'

export const profileMock = http.get('/auth/me', ({ request }) => {
	// Mock rule: the demo access token identifies the seeded user.
	if (request.headers.get('Authorization') === 'Bearer mock-jwt-token') {
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

> **O mock honesto.** No mundo do mock, o usuário demo nasce **não verificado** (`is_verified: false`) — então o banner aparece, igual num cadastro novo de verdade. Os handlers de verificação (seção 5) chamam `setVerified(true)`, e o próximo `/auth/me` reflete a mudança. Mock = contrato: ele se comporta como o backend, inclusive na transição.

6 - Comite (nada visível mudou ainda — o banner que consome `isVerified` entra na seção 5):

```sh
pnpm lint:fix
pnpm test:run
pnpm build
```

```sh
git add src
git commit -m "feat: expose role and verification status on the profile"
git push
```

---

### 3 - Reset de senha: a página "esqueci minha senha"

- A primeira porta do reset. Um link **Forgot your password?** no sign-in leva a uma página que **morfa em dois passos**: pede o email (passo 1), depois pede o **código + a nova senha** (passo 2). Tudo num Card só, sem trocar de rota.

1 - Vá na pasta **`src/api`** e crie **`forgot-password.ts`**:

```ts
import { api } from '@/lib/api'

export interface ForgotPasswordBody {
	email: string
}

export async function forgotPassword({ email }: ForgotPasswordBody) {
	await api.post('/users/forgot-password', { email })
}
```

2 - Vá na pasta **`src/api`** e crie **`reset-password.ts`** (a união espelha o backend — token **ou** email+código):

```ts
import { api } from '@/lib/api'

// Two ways to reset, mirroring the backend union: a link token (from the
// emailed link) or an email + 6-digit OTP code (from the forgot-password form).
export type ResetPasswordBody =
	| { token: string; newPassword: string }
	| { email: string; code: string; newPassword: string }

export async function resetPassword(body: ResetPasswordBody) {
	await api.post('/users/reset-password', body)
}
```

3 - Os mocks. Vá na pasta **`src/api/mocks`** e crie **`forgot-password-mock.ts`**:

```ts
import { http, HttpResponse } from 'msw'

export const forgotPasswordMock = http.post('/users/forgot-password', () => {
	// Always 202 with the same body — never reveal whether the email exists.
	return HttpResponse.json(
		{ message: 'If the email exists, reset instructions were sent.' },
		{ status: 202 },
	)
})
```

4 - Vá na pasta **`src/api/mocks`** e crie **`reset-password-mock.ts`** (o token/código demo funcionam; o resto dá 400):

```ts
import { http, HttpResponse } from 'msw'

import type { ResetPasswordBody } from '../reset-password'

export const resetPasswordMock = http.post<never, ResetPasswordBody>(
	'/users/reset-password',
	async ({ request }) => {
		const body = await request.json()
		const credential = 'token' in body ? body.token : body.code

		// Mock rule: the demo token/code resets successfully; anything else 400.
		if (credential === 'valid-token' || credential === '123456') {
			return new HttpResponse(null, { status: 204 })
		}

		return HttpResponse.json({ message: 'Invalid token.' }, { status: 400 })
	},
)
```

5 - Registre os dois handlers. Abra a **`src/api/mocks/index.ts`**, importe e adicione ao worker:

```ts
// nos imports:
import { forgotPasswordMock } from './forgot-password-mock'
import { resetPasswordMock } from './reset-password-mock'
```

```ts
// no setupWorker(...), adicione à lista:
forgotPasswordMock,
resetPasswordMock,
```

6 - Agora a tela. Como `auth/` já tem subpastas por página (`sign-in/`), crie a da forgot:

```sh
mkdir src/pages/auth/forgot-password
```

7 - Vá na pasta **`src/pages/auth/forgot-password`** e crie **`use-forgot-password-pm.ts`** (dois forms, um por passo; `step` controla qual aparece):

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { forgotPassword } from '@/api/forgot-password'
import { resetPassword } from '@/api/reset-password'
import { env } from '@/env'

const passwordMin = env.VITE_PASSWORD_MIN_LENGTH
const passwordPattern = new RegExp(env.VITE_PASSWORD_PATTERN)
const passwordMessage = env.VITE_PASSWORD_MESSAGE

const requestForm = z.object({
	email: z.email('Enter a valid email.'),
})
type RequestForm = z.infer<typeof requestForm>

const resetForm = z
	.object({
		code: z.string().length(6, 'Enter the 6-digit code.'),
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
type ResetForm = z.infer<typeof resetForm>

export function useForgotPasswordPM() {
	const navigate = useNavigate()
	const [step, setStep] = useState<'request' | 'reset'>('request')
	const [email, setEmail] = useState('')

	const {
		register,
		handleSubmit: submitRequest,
		formState: { errors, isSubmitting },
	} = useForm<RequestForm>({ resolver: zodResolver(requestForm) })

	const {
		register: resetRegister,
		control: resetControl,
		handleSubmit: submitReset,
		formState: { errors: resetErrors, isSubmitting: resetIsSubmitting },
	} = useForm<ResetForm>({ resolver: zodResolver(resetForm) })

	const { mutateAsync: requestReset } = useMutation({
		mutationFn: forgotPassword,
	})
	const { mutateAsync: confirmReset } = useMutation({
		mutationFn: resetPassword,
	})

	async function onRequest(data: RequestForm) {
		try {
			await requestReset({ email: data.email })
			setEmail(data.email)
			setStep('reset')
			toast.success(
				'If the email exists, a code was sent. Check the backend console (dev).',
			)
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error('Too many attempts. Please wait a moment.')
				return
			}
			toast.error('Could not start password reset.')
		}
	}

	async function onReset(data: ResetForm) {
		try {
			await confirmReset({
				email,
				code: data.code,
				newPassword: data.password,
			})
			toast.success('Password reset. You can sign in now.')
			navigate('/sign-in')
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error('Too many attempts. Please wait a moment.')
				return
			}
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not reset password.'
			toast.error(message)
		}
	}

	return {
		step,
		email,
		backToRequest: () => setStep('request'),
		register,
		errors,
		isSubmitting,
		handleRequest: submitRequest(onRequest),
		resetControl,
		resetRegister,
		resetErrors,
		resetIsSubmitting,
		handleReset: submitReset(onReset),
	}
}
```

> **Por que dois `useForm`.** Cada passo valida coisas diferentes (passo 1 = email; passo 2 = código + senha). Dois forms isolados deixam cada validação limpa, e o `email` capturado no passo 1 vive em `state` pra ir junto no `POST /users/reset-password` do passo 2. O `step` decide qual marcação a view mostra — a "morfagem" é só condicional de render.

8 - Vá na pasta **`src/pages/auth/forgot-password`** e crie **`forgot-password.tsx`** (só marcação; o `input-otp` entra via `Controller` porque é um campo controlado):

```tsx
import { Controller } from 'react-hook-form'
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
import { Input } from '@/components/ui/input'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

import { useForgotPasswordPM } from './use-forgot-password-pm'

export function ForgotPassword() {
	const pm = useForgotPasswordPM()

	return (
		<>
			<PageTitle title='Forgot password' />

			<div className='flex flex-1 items-center justify-center p-8'>
				<Card className='w-full max-w-sm'>
					{pm.step === 'request' ? (
						<>
							<CardHeader>
								<CardTitle>Forgot your password?</CardTitle>
								<CardDescription>
									Enter your email and we'll send a reset
									code.
								</CardDescription>
							</CardHeader>

							<CardContent>
								<form onSubmit={pm.handleRequest}>
									<div className='flex flex-col gap-6'>
										<div className='grid gap-2'>
											<Label htmlFor='email'>Email</Label>
											<Input
												id='email'
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

										<Button
											type='submit'
											disabled={pm.isSubmitting}
											className='w-full'
										>
											Send reset code
										</Button>
									</div>
								</form>
							</CardContent>
						</>
					) : (
						<>
							<CardHeader>
								<CardTitle>Reset your password</CardTitle>
								<CardDescription>
									Enter the code sent to {pm.email} and your
									new password.
								</CardDescription>
							</CardHeader>

							<CardContent>
								<form onSubmit={pm.handleReset}>
									<div className='flex flex-col gap-6'>
										<div className='grid gap-2'>
											<Label htmlFor='code'>
												Verification code
											</Label>
											<Controller
												control={pm.resetControl}
												name='code'
												render={({ field }) => (
													<InputOTP
														maxLength={6}
														value={
															field.value ?? ''
														}
														onChange={
															field.onChange
														}
													>
														<InputOTPGroup>
															<InputOTPSlot
																index={0}
															/>
															<InputOTPSlot
																index={1}
															/>
															<InputOTPSlot
																index={2}
															/>
															<InputOTPSlot
																index={3}
															/>
															<InputOTPSlot
																index={4}
															/>
															<InputOTPSlot
																index={5}
															/>
														</InputOTPGroup>
													</InputOTP>
												)}
											/>
											{pm.resetErrors.code && (
												<p className='text-destructive text-sm'>
													{
														pm.resetErrors.code
															.message
													}
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='password'>
												New password
											</Label>
											<Input
												id='password'
												type='password'
												{...pm.resetRegister(
													'password',
												)}
											/>
											{pm.resetErrors.password && (
												<p className='text-destructive text-sm'>
													{
														pm.resetErrors.password
															.message
													}
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='confirmPassword'>
												Confirm password
											</Label>
											<Input
												id='confirmPassword'
												type='password'
												{...pm.resetRegister(
													'confirmPassword',
												)}
											/>
											{pm.resetErrors.confirmPassword && (
												<p className='text-destructive text-sm'>
													{
														pm.resetErrors
															.confirmPassword
															.message
													}
												</p>
											)}
										</div>

										<Button
											type='submit'
											disabled={pm.resetIsSubmitting}
											className='w-full'
										>
											Reset password
										</Button>

										<button
											type='button'
											onClick={pm.backToRequest}
											className='text-muted-foreground text-sm underline-offset-4 hover:underline'
										>
											Use a different email
										</button>
									</div>
								</form>
							</CardContent>
						</>
					)}

					<div className='text-center text-sm'>
						<Link
							to='/sign-in'
							className='underline-offset-4 hover:underline'
						>
							Back to login
						</Link>
					</div>
				</Card>
			</div>
		</>
	)
}
```

9 - Ligue a porta de entrada. Abra a **`src/pages/auth/sign-in/sign-in.tsx`**, importe o `Link`:

```tsx
// no topo do arquivo:
import { Link } from 'react-router'
```

E troque o bloco do label `Password` por um que tenha o link à direita:

```tsx
// Substitua:
<Label htmlFor='password'>Password</Label>
// Por:
<div className='flex items-center'>
	<Label htmlFor='password'>Password</Label>
	<Link
		to='/forgot-password'
		className='ml-auto text-sm underline-offset-4 hover:underline'
	>
		Forgot your password?
	</Link>
</div>
```

10 - Registre a rota. Abra a **`src/routes.tsx`**, importe a página e adicione a rota pública (sob o `AuthLayout`, depois de `/register`):

```tsx
// nos imports:
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password'
```

```tsx
// Depois de:
{
	path: '/register',
	element: <RegisterLayout />,
	children: [{ index: true, element: <Register /> }],
},
// Adicione:
{
	path: '/forgot-password',
	element: <AuthLayout />,
	children: [{ index: true, element: <ForgotPassword /> }],
},
```

11 - Rode e comite:

```sh
pnpm lint:fix
pnpm test:run
pnpm build
```

```sh
git add src
git commit -m "feat: add forgot-password flow"
git push
```

---

### 4 - Reset de senha: a landing do link

- A segunda porta. O link do email aponta pra `/users/reset-password?token=…`. Essa página lê o **token da URL**, pede só a **nova senha**, e usa a mesma `resetPassword` (variante de token) da seção anterior — zero API nova.

1 - Crie a pasta da página:

```sh
mkdir src/pages/auth/reset-password
```

2 - Vá na pasta **`src/pages/auth/reset-password`** e crie **`use-reset-password-pm.ts`** (lê o `?token=` com `useSearchParams`):

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { resetPassword } from '@/api/reset-password'
import { env } from '@/env'

const passwordMin = env.VITE_PASSWORD_MIN_LENGTH
const passwordPattern = new RegExp(env.VITE_PASSWORD_PATTERN)
const passwordMessage = env.VITE_PASSWORD_MESSAGE

const resetForm = z
	.object({
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
type ResetForm = z.infer<typeof resetForm>

export function useResetPasswordPM() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const token = searchParams.get('token')

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ResetForm>({ resolver: zodResolver(resetForm) })

	const { mutateAsync: confirmReset } = useMutation({
		mutationFn: resetPassword,
	})

	async function onSubmit(data: ResetForm) {
		if (!token) {
			return
		}

		try {
			await confirmReset({ token, newPassword: data.password })
			toast.success('Password reset. You can sign in now.')
			navigate('/sign-in')
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error('Too many attempts. Please wait a moment.')
				return
			}
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not reset password. The link may have expired.'
			toast.error(message)
		}
	}

	return {
		hasToken: Boolean(token),
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}
```

3 - Vá na pasta **`src/pages/auth/reset-password`** e crie **`reset-password.tsx`** (sem token → mostra um fallback em vez do form):

```tsx
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useResetPasswordPM } from './use-reset-password-pm'

export function ResetPassword() {
	const pm = useResetPasswordPM()

	return (
		<>
			<PageTitle title='Reset password' />

			<div className='flex flex-1 items-center justify-center p-8'>
				<Card className='w-full max-w-sm'>
					<CardHeader>
						<CardTitle>Reset your password</CardTitle>
						<CardDescription>
							{pm.hasToken
								? 'Choose a new password for your account.'
								: 'This reset link is invalid or incomplete.'}
						</CardDescription>
					</CardHeader>

					<CardContent>
						{pm.hasToken ? (
							<form onSubmit={pm.handleSubmit}>
								<div className='flex flex-col gap-6'>
									<div className='grid gap-2'>
										<Label htmlFor='password'>
											New password
										</Label>
										<Input
											id='password'
											type='password'
											{...pm.register('password')}
										/>
										{pm.errors.password && (
											<p className='text-destructive text-sm'>
												{pm.errors.password.message}
											</p>
										)}
									</div>

									<div className='grid gap-2'>
										<Label htmlFor='confirmPassword'>
											Confirm password
										</Label>
										<Input
											id='confirmPassword'
											type='password'
											{...pm.register('confirmPassword')}
										/>
										{pm.errors.confirmPassword && (
											<p className='text-destructive text-sm'>
												{
													pm.errors.confirmPassword
														.message
												}
											</p>
										)}
									</div>

									<Button
										type='submit'
										disabled={pm.isSubmitting}
										className='w-full'
									>
										Reset password
									</Button>
								</div>
							</form>
						) : (
							<Button asChild className='w-full'>
								<Link to='/forgot-password'>
									Request a new link
								</Link>
							</Button>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	)
}
```

4 - Registre a rota com o **path exato** que o backend monta. Abra a **`src/routes.tsx`**:

```tsx
// nos imports:
import { ResetPassword } from './pages/auth/reset-password/reset-password'
```

```tsx
// Adicione no final das rotas:
{
	path: '/users/reset-password',
	element: <AuthLayout />,
	children: [{ index: true, element: <ResetPassword /> }],
},
```

> **O path tem que ser literal.** O backend gera `${APP_URL}/users/reset-password?token=…`. A rota do SPA precisa casar **exatamente** (`/users/reset-password`) — daí o `/users/` no caminho, mesmo parecendo estranho pra uma tela de front. Mantendo igual, zero mudança de código no backend.

5 - Rode e comite:

```sh
pnpm lint:fix
pnpm test:run
pnpm build
```

```sh
git add src
git commit -m "feat: add reset-password link page"
git push
```

---

### 5 - Verificação de email: banner + código OTP

- Agora a verificação. Enquanto `is_verified` é `false`, um **banner** aparece no `app-layout`. O botão **Send code** dispara o email e abre um **dialog** com o `input-otp`; o código certo verifica a conta e o banner some — sem reload.

1 - Vá na pasta **`src/api`** e crie **`send-verification.ts`**:

```ts
import { api } from '@/lib/api'

export async function sendVerification() {
	await api.post('/users/send-verification')
}
```

2 - Vá na pasta **`src/api`** e crie **`verify-email.ts`** (as duas portas da verificação num arquivo — token pro link, OTP pro in-app):

```ts
import { api } from '@/lib/api'

// Public link landing: the SPA forwards the token to the backend GET route.
export async function verifyEmailByToken(token: string) {
	await api.get('/users/verify-email', { params: { token } })
}

export interface VerifyEmailOtpBody {
	code: string
}

// In-app flow: the authenticated user types the 6-digit code from the email.
export async function verifyEmailByOtp({ code }: VerifyEmailOtpBody) {
	await api.post('/users/verify-email/otp', { code })
}
```

3 - Vá na pasta **`src/api/mocks`** e crie **`send-verification-mock.ts`**:

```ts
import { http, HttpResponse } from 'msw'

export const sendVerificationMock = http.post(
	'/users/send-verification',
	() => {
		// Backend prints the code/link to its console in dev. Here we just 204.
		return new HttpResponse(null, { status: 204 })
	},
)
```

4 - Vá na pasta **`src/api/mocks`** e crie **`verify-email-mock.ts`** (ambos flipam o estado verificado, igual o backend):

```ts
import { http, HttpResponse } from 'msw'

import { setVerified } from './verified-state'

// Public link landing — token comes in the query string.
export const verifyEmailByLinkMock = http.get(
	'/users/verify-email',
	({ request }) => {
		const url = new URL(request.url)
		const token = url.searchParams.get('token')

		if (token === 'valid-token') {
			setVerified(true)
			return new HttpResponse(null, { status: 204 })
		}

		return HttpResponse.json({ message: 'Invalid token.' }, { status: 400 })
	},
)

// In-app OTP — 6-digit code in the body.
export const verifyEmailByOtpMock = http.post<never, { code: string }>(
	'/users/verify-email/otp',
	async ({ request }) => {
		const { code } = await request.json()

		if (code === '123456') {
			setVerified(true)
			return new HttpResponse(null, { status: 204 })
		}

		return HttpResponse.json({ message: 'Invalid code.' }, { status: 400 })
	},
)
```

5 - Registre os três no worker. Abra a **`src/api/mocks/index.ts`**:

```ts
// nos imports:
import { sendVerificationMock } from './send-verification-mock'
import {
	verifyEmailByLinkMock,
	verifyEmailByOtpMock,
} from './verify-email-mock'
```

```ts
// no setupWorker(...), adicione à lista:
sendVerificationMock,
verifyEmailByLinkMock,
verifyEmailByOtpMock,
```

6 - O banner ganha **comportamento** (enviar código, verificar, controlar o dialog) → par view + PM em pasta própria. Crie a pasta:

```sh
mkdir src/components/auth/verify-email-banner
```

7 - Vá na pasta **`src/components/auth/verify-email-banner`** e crie **`use-verify-email-banner-pm.ts`**:

```ts
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

import { sendVerification } from '@/api/send-verification'
import { verifyEmailByOtp } from '@/api/verify-email'
import { useAuth } from '@/components/auth/auth-hooks'

export function useVerifyEmailBannerPM() {
	const auth = useAuth()
	const [open, setOpen] = useState(false)
	const [code, setCode] = useState('')

	const { mutateAsync: send, isPending: isSending } = useMutation({
		mutationFn: sendVerification,
	})
	const { mutateAsync: verify, isPending: isVerifying } = useMutation({
		mutationFn: verifyEmailByOtp,
	})

	async function handleSendCode() {
		try {
			await send()
			toast.success(
				'Verification code sent. Check the backend console (dev).',
			)
			setOpen(true)
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				const retryAfter = err.response.data?.retryAfter
				toast.error(
					retryAfter
						? `Please wait ${retryAfter}s before requesting a new code.`
						: 'Please wait before requesting a new code.',
				)
				return
			}
			toast.error('Could not send the verification code.')
		}
	}

	async function handleVerify() {
		try {
			await verify({ code })
			await auth.reloadUser()
			toast.success('Email verified.')
			setOpen(false)
			setCode('')
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Invalid or expired code.'
			toast.error(message)
		}
	}

	const visible =
		auth.status === 'authed' && auth.user !== null && !auth.user.isVerified

	return {
		visible,
		open,
		setOpen,
		code,
		setCode,
		isSending,
		isVerifying,
		handleSendCode,
		handleVerify,
	}
}
```

> **Onde o `reloadUser` paga.** `handleVerify` chama `verify({ code })` → no sucesso, `auth.reloadUser()` re-busca o `/auth/me` (agora `is_verified: true`) → o `visible` recalcula pra `false` → o banner desmonta. O usuário vê o toast e a barra somindo, sem recarregar nada.

8 - Vá na pasta **`src/components/auth/verify-email-banner`** e crie **`verify-email-banner.tsx`**:

```tsx
import { MailWarning } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp'

import { useVerifyEmailBannerPM } from './use-verify-email-banner-pm'

export function VerifyEmailBanner() {
	const pm = useVerifyEmailBannerPM()

	if (!pm.visible) {
		return null
	}

	return (
		<>
			<div className='bg-card text-card-foreground flex w-full flex-col items-center gap-2 border-b px-8 py-4'>
				<div className='flex items-center gap-2'>
					<MailWarning className='size-5' />
					<p className='font-medium'>Verify your email</p>
				</div>
				<p className='text-muted-foreground text-sm'>
					Confirm your email address to unlock check-ins.
				</p>
				<Button
					size='sm'
					onClick={pm.handleSendCode}
					disabled={pm.isSending}
				>
					Send code
				</Button>
			</div>

			<Dialog open={pm.open} onOpenChange={pm.setOpen}>
				<DialogContent className='sm:max-w-sm'>
					<DialogHeader>
						<DialogTitle>Enter verification code</DialogTitle>
						<DialogDescription>
							Type the 6-digit code we sent to your email.
						</DialogDescription>
					</DialogHeader>

					<div className='flex justify-center py-2'>
						<InputOTP
							maxLength={6}
							value={pm.code}
							onChange={pm.setCode}
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
					</div>

					<DialogFooter>
						<Button
							onClick={pm.handleVerify}
							disabled={pm.code.length !== 6 || pm.isVerifying}
							className='w-full'
						>
							Verify
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
```

> **Por que uma faixa flex (e não o `Alert`).** O `Alert` do shadcn é um card alinhado à esquerda (grid + ação `absolute`) — não encaixa numa barra full-width centralizada. Uma `div` `flex flex-col items-center` resolve: ícone+título, descrição e botão **empilhados e centralizados**, ocupando a largura da tela (`w-full`), com as cores do tema (`bg-card`/`border-b`). O OTP poderia ser inline, mas cresceria a faixa e empurraria o layout — um `Dialog` mantém o banner enxuto e dá foco ao código. O botão `Verify` só habilita com os 6 dígitos (`pm.code.length !== 6`).

9 - Mostre o banner. Abra a **`src/pages/_layouts/app-layout/app-layout.tsx`**, importe e renderize entre o `</header>` e o `<main>`:

```tsx
// nos imports (junto dos outros @/components):
import { VerifyEmailBanner } from '@/components/auth/verify-email-banner/verify-email-banner'
```

```tsx
// Depois de:
</header>
// Adicione:
<VerifyEmailBanner />
```

10 - Rode (o e2e prova que o banner não quebrou o fluxo de login da P5/P6) e comite:

```sh
pnpm lint:fix
pnpm test:run
pnpm build
pnpm e2e
```

```sh
git add src
git commit -m "feat: add email verification banner and otp dialog"
git push
```

> **Por que o e2e segue verde.** Após o login, o usuário mock nasce `is_verified: false` → o banner aparece na Home. Mas ele só **adiciona** elementos; os seletores dos specs existentes (`getByText`, `getByRole('button')`) continuam únicos. 4/4 segue passando.

---

### 6 - Verificação de email: a landing do link

- A outra porta da verificação. O link cai em `/users/verify-email?token=…`; a página dispara o `GET /users/verify-email` **no mount**, mostra um spinner, e resolve em **sucesso** ("Email verified ✓") ou **erro** (link inválido/expirado).

1 - Crie a pasta:

```sh
mkdir src/pages/auth/verify-email
```

2 - Vá na pasta **`src/pages/auth/verify-email`** e crie **`use-verify-email-pm.ts`** (usa `useQuery` — dispara uma vez, dedupe nativo; se logado, `reloadUser` limpa o banner):

```ts
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'

import { verifyEmailByToken } from '@/api/verify-email'
import { useAuth } from '@/components/auth/auth-hooks'

export type VerifyEmailStatus = 'verifying' | 'success' | 'error'

export function useVerifyEmailPM() {
	const [searchParams] = useSearchParams()
	const token = searchParams.get('token')
	const auth = useAuth()
	const reloaded = useRef(false)

	const query = useQuery({
		queryKey: ['verify-email', token],
		queryFn: async () => {
			await verifyEmailByToken(token as string)
			// React Query forbids an undefined return; signal success explicitly.
			return true
		},
		enabled: Boolean(token),
		retry: false,
	})

	// Once verified, refresh the profile so the banner clears for a logged-in
	// user. Guarded so it runs a single time despite re-renders / StrictMode.
	useEffect(() => {
		if (query.isSuccess && auth.status === 'authed' && !reloaded.current) {
			reloaded.current = true
			auth.reloadUser()
		}
	}, [query.isSuccess, auth])

	const status: VerifyEmailStatus = !token
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

> **Por que `useQuery` e não um `useEffect` cru.** O `GET /users/verify-email` consome o token — chamar duas vezes daria `409 Already verified` na segunda. O `useQuery` (com `queryKey` no token) **deduplica** e não re-dispara à toa, inclusive sob o duplo-render do StrictMode. O `retry: false` evita re-tentar um token inválido. O `reloaded` (ref) garante que o `reloadUser` rode só uma vez.
>
> **O `return true` não é decorativo.** O backend responde `204 No Content` e a `verifyEmailByToken` não devolve nada — mas o **React Query proíbe** uma `queryFn` que resolve `undefined` (lança "Query data cannot be undefined", e a query cai em `isError`). Retornar um valor qualquer (`true`) marca o sucesso. `useMutation` não tem essa regra — por isso o reset de senha, que usa mutation, não precisa disso.

3 - Vá na pasta **`src/pages/auth/verify-email`** e crie **`verify-email.tsx`** (três estados; botão leva pra Home se logado, ou pro sign-in se guest):

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

import { useVerifyEmailPM } from './use-verify-email-pm'

export function VerifyEmail() {
	const pm = useVerifyEmailPM()

	return (
		<>
			<PageTitle title='Verify email' />

			<div className='flex flex-1 items-center justify-center p-8'>
				<Card className='w-full max-w-sm text-center'>
					{pm.status === 'verifying' && (
						<CardHeader>
							<LoaderCircle className='text-muted-foreground mx-auto size-10 animate-spin' />
							<CardTitle>Verifying your email…</CardTitle>
							<CardDescription>
								Hold on while we confirm your link.
							</CardDescription>
						</CardHeader>
					)}

					{pm.status === 'success' && (
						<>
							<CardHeader>
								<CheckCircle2 className='mx-auto size-10 text-emerald-500' />
								<CardTitle>Email verified</CardTitle>
								<CardDescription>
									Your email address is now confirmed.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link to={pm.isAuthed ? '/' : '/sign-in'}>
										{pm.isAuthed ? 'Go to app' : 'Sign in'}
									</Link>
								</Button>
							</CardContent>
						</>
					)}

					{pm.status === 'error' && (
						<>
							<CardHeader>
								<XCircle className='text-destructive mx-auto size-10' />
								<CardTitle>Verification failed</CardTitle>
								<CardDescription>
									This link is invalid or has expired.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link to={pm.isAuthed ? '/' : '/sign-in'}>
										{pm.isAuthed ? 'Go to app' : 'Sign in'}
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

4 - Registre a rota (path exato). Abra a **`src/routes.tsx`**:

```tsx
// nos imports:
import { VerifyEmail } from './pages/auth/verify-email/verify-email'
```

```tsx
// Adicione no final das rotas
{
	path: '/users/verify-email',
	element: <AuthLayout />,
	children: [{ index: true, element: <VerifyEmail /> }],
},
```

5 - Rode e comite:

```sh
pnpm lint:fix
pnpm test:run
pnpm build
```

```sh
git add src
git commit -m "feat: add verify-email link page"
git push
```

---

### 7 - Testes

- Os fluxos por **link** são determinísticos e perfeitos pro e2e: navegue pra uma URL com token, afirme o resultado. Cobrimos as duas landings (reset + verify) no Playwright e a validação do form de forgot no Vitest. Os fluxos com **OTP digitado** (dialog do banner, passo 2 do forgot) ficam pro smoke manual da seção 8 — digitar num `input-otp` é frágil de automatizar e o valor do teste seria baixo.

1 - Vá na pasta **`test`** e crie **`reset-password.spec.ts`**:

```ts
import { expect, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

test('resets the password from a valid link', async ({ page }) => {
	await page.goto('/users/reset-password?token=valid-token')

	await page.getByLabel('New password').fill('Password1!')
	await page.getByLabel('Confirm password').fill('Password1!')
	await page.getByRole('button', { name: 'Reset password' }).click()

	await expect(
		page.getByText('Password reset. You can sign in now.'),
	).toBeVisible()
	await expect(page).toHaveURL('/sign-in')

	await waitForUIInspection(page)
})

test('shows a fallback when the link has no token', async ({ page }) => {
	await page.goto('/users/reset-password')

	await expect(
		page.getByText('This reset link is invalid or incomplete.'),
	).toBeVisible()
	await expect(
		page.getByRole('link', { name: 'Request a new link' }),
	).toBeVisible()

	await waitForUIInspection(page)
})
```

2 - Vá na pasta **`test`** e crie **`verify-email.spec.ts`**:

```ts
import { expect, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

test('confirms the email from a valid link', async ({ page }) => {
	await page.goto('/users/verify-email?token=valid-token')

	await expect(page.getByText('Email verified')).toBeVisible()
	await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()

	await waitForUIInspection(page)
})

test('shows an error for an invalid link', async ({ page }) => {
	await page.goto('/users/verify-email?token=nope')

	await expect(page.getByText('Verification failed')).toBeVisible()

	await waitForUIInspection(page)
})
```

3 - Vá na pasta **`src/pages/auth/forgot-password`** e crie **`forgot-password.spec.tsx`** (unit, no padrão do `sign-in.spec`):

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../../../../test/utils'
import { ForgotPassword } from './forgot-password'

describe('ForgotPassword form', () => {
	it('requires an email before sending the code', async () => {
		const user = userEvent.setup()
		renderWithProviders(<ForgotPassword />, { route: '/forgot-password' })

		await user.click(
			screen.getByRole('button', { name: /send reset code/i }),
		)

		expect(
			await screen.findByText('Enter a valid email.'),
		).toBeInTheDocument()
	})
})
```

> **Por que estes seletores (e o submit vazio).** No reset-link, `getByLabel('New password')` e `'Confirm password'` são únicos (sem a ambiguidade do register). No verify-link, o texto do `CardTitle` (`Email verified` / `Verification failed`) é a asserção mais estável. O unit do forgot **submete vazio** (igual o `register.spec`) em vez de digitar um email malformado: sob o **happy-dom**, um `<input type='email'>` não aceita um valor inválido via `userEvent.type` (o e2e em Chromium real aceita) — submeter vazio testa a mesma regra (`z.email` exige email) sem esbarrar nesse detalhe. Reusa o `renderWithProviders` (MemoryRouter + QueryClient), sem `AuthProvider` — o forgot não usa `useAuth`.

4 - Rode tudo e comite os testes:

```sh
pnpm lint:fix
pnpm test:run
pnpm e2e
```

```sh
git add src test
git commit -m "test: cover account link flows (e2e + unit)"
git push
```

> **`git add src test`** — os specs de e2e vivem em `test/`, então aqui o `add` inclui as duas pastas (o unit do forgot fica em `src/`). Continua sem `git add .` pra não varrer o README.

---

### 8 - Smoke manual no backend real

- O e2e roda contra o MSW. O smoke prova o que o mock não cobre: o **console do backend** imprimindo código e link, o `APP_URL` mandando o link pro SPA, e a transição real de `is_verified`. Backend no ar (`APP_URL=http://localhost:3001`) + `pnpm dev` (porta **3001**).

1 - **Crie um usuário e logue** (ele nasce não verificado). Em `/register` cadastre estes dados fictícios:

- **Username:** `peter_parker`
- **Email:** `peter.parker@example.com`
- **Password and Confirm:** `Peter@12345`

Depois logue em `/sign-in`:

- **Email or username:** `peter.parker@example.com`
- **Password:** `Peter@12345`

Na Home, o **banner** "Verify your email" aparece.

2 - **Verificação via OTP (porta in-app).** Clique em **Send code** no banner. Olhe o **console do backend**: ele imprime o **código de 6 dígitos** (e o link). Copie o código, cole no dialog, **Verify**:

- Esperado: toast `Email verified.` → o banner **some** (o `reloadUser` re-buscou o `/auth/me`).

3 - **Verificação via link (porta do email).** Pra testar a outra porta, precisa de uma conta não verificada de novo. Em `/register` crie um segundo usuário:

- **Username:** `mary_jane`
- **Email:** `mary.jane@example.com`
- **Password and Confirm:** `Mary@12345`

Logue com ela:

- **Email or username:** `mary.jane@example.com`
- **Password:** `Mary@12345`

Desta vez, **copie o link** que o backend imprime no console (algo como `http://localhost:3001/users/verify-email?token=…`) e cole numa **aba nova**:

- Esperado: a página mostra **"Email verified"** + botão. Como é a mesma sessão (mesmo navegador, cookie de refresh presente), o boot te traz logado e o botão diz **Go to app** → na Home, o banner já está limpo.

4 - **Reset de senha (porta "esqueci").** Faça **Sign out**. Em `/sign-in` clique em **Forgot your password?**. No passo 1, informe o email:

- **Email:** `peter.parker@example.com`

**Send reset code** → o console do backend imprime o **código de 6 dígitos**. No passo 2, cole o código e defina a nova senha:

- **New password:** `Peter@54321`
- **Confirm password:** `Peter@54321`

**Reset password** → vai pro `/sign-in`. Logue com a senha nova:

- **Email or username:** `peter.parker@example.com`
- **Password:** `Peter@54321`

5 - **Reset via link (porta do email).** Repita o **Forgot your password?**, agora com a Mary. No passo 1, informe o email:

- **Email:** `mary.jane@example.com`

**Send reset code** → mas desta vez, em vez do código, **copie o link** do console (`…/users/reset-password?token=…`) e abra numa **aba nova**. Na página, defina a nova senha:

- **New password:** `Mary@54321`
- **Confirm password:** `Mary@54321`

Confirme que loga com ela:

- **Email or username:** `mary.jane@example.com`
- **Password:** `Mary@54321`

> **Por que na mão, além do e2e.** O e2e mocka os endpoints e usa tokens fixos (`valid-token`, `123456`). O smoke valida a **mecânica real**: o `ConsoleEmailProvider` imprimindo, o `APP_URL` roteando o link pro `:3001`, o token/OTP de verdade sendo aceito uma única vez, e o `is_verified` virando no banco. Se algo só falha aqui, o suspeito é o `APP_URL`, o CORS com credenciais, ou o cookie cross-origin.

---

### 9 - Fechando a Parte 7

A conta agora se auto-atende. O usuário confirma o email (por **código** ou por **link**) e recupera a senha (pela página **"esqueci"** ou pelo **link**) — cada fluxo com as duas portas que uma app real precisa. O `/auth/me` carrega `is_verified` e `role`, o banner reage ao estado, e o mock continua honesto (unit/e2e offline contra o MSW).

**O que entrou:**

- `src/api/` — `forgot-password.ts`, `reset-password.ts` (união token/OTP), `send-verification.ts`, `verify-email.ts` (token + OTP)
- `src/api/mocks/` — `verified-state.ts` (estado do mock) + handlers de forgot/reset/send/verify; `profile-mock` devolvendo `is_verified`/`role`
- `get-profile.ts` + `AuthContext` — `User` com `isVerified`/`role`, `reloadUser`
- `src/pages/auth/` — `forgot-password/` (2 passos), `reset-password/` (landing do link), `verify-email/` (landing do link)
- `src/components/auth/verify-email-banner/` — banner (faixa flex centralizada) + dialog OTP (`input-otp`)
- 2 componentes shadcn (`input-otp`, `dialog`); link **Forgot your password?** no sign-in
- testes: e2e das duas landings + unit do forgot

**As duas portas, lado a lado:**

| Fluxo                | Porta in-app                             | Porta por link                          |
| -------------------- | ---------------------------------------- | --------------------------------------- |
| Verificação de email | banner → **Send code** → dialog OTP      | `/users/verify-email?token=` (feedback) |
| Reset de senha       | `/forgot-password` (email → OTP → senha) | `/users/reset-password?token=` (senha)  |

Por fim, comite este tutorial:

```sh
git add README_7_email_password.md
git commit -m "docs: add part 7 tutorial (email verification + password reset)"
git push
```

> **A seguir (Parte 8).** Com a conta verificada, entram as **academias**: buscar, achar as próximas (via `navigator.geolocation`) e — pra quem é `ADMIN` — criar. É onde o `app-layout` ganha o **sidebar** (com itens por `role`), e o `role` que carregamos aqui no `/auth/me` começa a valer.

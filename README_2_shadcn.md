# Tutorial Frontend Setup — Parte 2: shadcn/ui

Continuação da Parte 1 (**README.md**). Pré-requisito: o projeto já configurado até o final da Parte 1 — Vite, ESLint + Prettier, organização de imports, path alias, React Router DOM, títulos, Tailwind CSS v4, Lucide React e os componentes de exemplo em **components/ui-sample**.

Nesta parte vamos adicionar:

- **shadcn/ui** (componentes prontos, Radix + Tailwind, código dentro do projeto)
- **Tema claro/escuro** com seletor (dropdown Claro/Escuro/Sistema)
- **Tokens semânticos** de cor nos layouts (sem `dark:` espalhado)
- **Formulários** com React Hook Form + Zod, no padrão **Presentation Model**

**Hierarquia de componentes adotada no projeto:**

1. Primeiro tentar usar componentes do **shadcn/ui**
2. Se não tiver, usar os primitivos do **[Radix UI](https://www.radix-ui.com/primitives)** e estilizar
3. Se ainda não tiver, criar com **Tailwind** (+ `tailwind-merge`/`tailwind-variants`, como nos exemplos de `ui-sample`)
4. Em último caso, CSS personalizado no **global.css**

> shadcn/ui **é** Radix + Tailwind: os componentes são primitivos do Radix já estilizados. Por isso a hierarquia acima é só descer um nível na mesma stack.

---

### Instalação e configuração do shadcn/ui

- O **shadcn/ui** não é uma biblioteca de dependência: ele copia o código do componente para dentro do seu projeto, em **components/ui**. Você passa a ser dono do código e pode customizar.  
  [ui.shadcn.com](https://ui.shadcn.com/docs/installation/vite)

1 - Rode o inicializador:

```sh
pnpm dlx shadcn@latest init
```

- Ele detecta Vite + Tailwind v4 e o path alias `@/*` (já configurado na Parte 1).
- O fluxo novo do CLI faz só **2 perguntas** (não pede mais a cor base num passo separado — o preset já define):

  1. **Select a component library** → escolha **`Radix`** (alternativa: `Base`).
  2. **Which preset would you like to use?** → escolha **`Nova — Lucide / Geist`**.

- O **preset** é só um pacote de defaults visuais (cor base, radius, espaçamento, fonte e biblioteca de ícones) — tudo editável depois no `components.json` e no CSS. **Nova** já casa com **Lucide** (instalado na Parte 1) e usa a base de cor `neutral`. Outros presets: `Vega`, `Maia`, `Lyra`, `Mira`, `Luma`, `Sera`, `Rhea`, `Custom`.

> **Dica — base color.** O `baseColor` define o tom neutro (cinza) do tema. As opções atuais são `neutral`, `stone`, `zinc`, `mauve`, `olive`, `mist`, `taupe` (o antigo `slate` foi removido). Vamos de **`neutral`** aqui. Pra ver os tons ao vivo antes de decidir: [ui.shadcn.com/create](https://ui.shadcn.com/create). Trocar depois **não** é só mudar o `components.json` — os tokens já ficam "assados" no `global.css`; re-rode o `init` pra regenerar, ou substitua os blocos `:root`/`.dark` à mão.

O init instala as dependências (`class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, **`radix-ui`** — o pacote unificado dos primitivos, e **`@fontsource-variable/geist`** — a fonte que o preset Nova usa), cria o **components.json**, o **src/lib/utils.ts** (com a função `cn`) e **regenera o global.css** com os tokens de cor e a fonte.

> **Fonte Geist.** O preset **Nova** já configura a fonte **Geist** sozinho: instala `@fontsource-variable/geist`, importa no `global.css` e aplica `--font-sans: 'Geist Variable'` no `<html>`. Não precisa fazer nada — a tipografia do app já muda.

2 - Veja o **components.json** criado. O importante:

```json
{
	"style": "radix-nova",
	"tailwind": {
		"config": "",
		"css": "src/global.css",
		"baseColor": "neutral",
		"cssVariables": true
	},
	"aliases": {
		"components": "@/components",
		"utils": "@/lib/utils",
		"ui": "@/components/ui"
	},
	"iconLibrary": "lucide"
}
```

- O `style` (`radix-nova`) e o `baseColor` (`neutral`) vêm das escolhas do init (lib `Radix` + preset `Nova`). Quer outra cor base depois? Edite aqui ou troque os tokens no `global.css`.

> **Aviso — erro de schema no components.json.** A aba PROBLEMS pode mostrar:
> `Unable to load schema from 'https://ui.shadcn.com/schema.json': Location ... is untrusted.`
> É só o validador JSON do VSCode bloqueando download de schema de domínio não confiável (não quebra nada). Pra resolver de forma reproduzível, crie **`.vscode/settings.json`** na raiz do projeto:
>
> ```json
> {
> 	"json.schemaDownload.trustedDomains": {
> 		"https://ui.shadcn.com/": true
> 	}
> }
> ```
>
> Alternativa rápida: passe o mouse no erro → quick-fix **"Trust ui.shadcn.com"** (grava no seu User Settings).

- O shadcn vai instalar os componentes em **components/ui**. Nossos exemplos da Parte 1 ficam em **components/ui-sample** — sem conflito.

3 - Abra o **global.css**. Ele foi reescrito pelo shadcn e agora contém bastante coisa:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import 'shadcn/tailwind.css';
@import '@fontsource-variable/geist';

@custom-variant dark (&:is(.dark *));

@theme inline {
	--font-sans: 'Geist Variable', sans-serif;
	--font-heading: var(--font-sans);
	/* mapeia os tokens para utilities: --color-background, --color-primary, ... */
	/* + escala de radius: --radius-sm ... --radius-4xl */
}

:root {
	/* tokens do tema claro: --background, --foreground, --primary, --radius, sidebar, chart... */
}

.dark {
	/* tokens do tema escuro (mesmos nomes, valores invertidos) */
}

@layer base {
	* {
		@apply border-border outline-ring/50;
	}
	body {
		@apply bg-background text-foreground;
	}
	html {
		@apply font-sans;
	}
}
```

- Repare nos imports a mais que o init novo adiciona: **`shadcn/tailwind.css`** (estilos base do shadcn) e **`@fontsource-variable/geist`** (a fonte do preset Nova).
- O shadcn **já adiciona** o `@custom-variant dark` — não precisamos mais adicionar manualmente.
- O `@layer base` deixa o `body` com `bg-background text-foreground` e o `html` com `font-sans` (Geist), então a página inteira já responde ao tema e usa a fonte nova.

4 - O global.css vai mostrar **erros falsos** na aba PROBLEMS (`@custom-variant`, `@theme`, `@apply` não são reconhecidos pelo validador de CSS padrão do VSCode). Para resolver, instale a extensão:  
[PostCSS Language Support](https://marketplace.visualstudio.com/items?itemName=csstools.postcss)

- Com isso os erros somem.

5 - Abra o **src/lib/utils.ts**. Ele tem um erro de organização de imports (do plugin da Parte 1). Basta **salvar** o arquivo que o `simple-import-sort` formata.

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
```

6 - Os componentes do shadcn (ex: `button.tsx`) exportam o componente **e** uma constante (`buttonVariants`, resultado de `cva`). Isso fere a regra `react-refresh/only-export-components` (vem do template Vite) — e cai como **erro**, fazendo o `pnpm lint` falhar.

> Por que só `components/ui`: nossos exemplos em `ui-sample` exportam o componente + um **tipo** (`ButtonProps`) — a regra ignora export de tipo, então não dão erro. Só os do shadcn (que exportam um **valor**) precisam do ajuste.

A solução recomendada é desativar essa regra apenas dentro de **components/ui**. No **eslint.config.js**, adicione um objeto novo no array do `defineConfig` (depois da config principal):

```js
export default defineConfig([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		// ... toda a config principal já existente
	},
	// novo: relaxa o Fast Refresh nos componentes do shadcn
	{
		files: ['src/components/ui/**/*.{ts,tsx}'],
		rules: {
			'react-refresh/only-export-components': 'off',
		},
	},
])
```

- Com isso o `pnpm lint` volta a passar limpo quando instalarmos componentes.

7 - Comite como:

```sh
git add .
git commit -m "feat: install and configure shadcn/ui"
git push
```

---

### Instalando um componente para teste

1 - Instale o **button**, que também é usado pelos próximos passos:  
[ui.shadcn/button](https://ui.shadcn.com/docs/components/button)

```sh
pnpm dlx shadcn@latest add button
```

- Foi criado o **src/components/ui/button.tsx**. Graças ao override do passo anterior, ele não acusa erro de lint.

2 - Para testar, use o botão temporariamente na **pages/app/home.tsx**:

```tsx
import { Button } from '@/components/ui/button'

// dentro do return
<Button variant='outline'>Teste</Button>
```

3 - Rode e veja o botão:

```sh
pnpm dev
```

4 - Pode remover o botão de teste da Home depois de validar. Comite como:

```sh
git add .
git commit -m "feat: add shadcn button component"
git push
```

---

### Alternância de tema claro e escuro

- Vamos usar a abordagem oficial do shadcn para Vite, com um seletor de **dropdown** (Claro / Escuro / Sistema).  
  [Dark Mode — Vite](https://ui.shadcn.com/docs/dark-mode/vite)
- O `global.css` já tem o suporte a dark mode (passo da seção anterior), então não precisa mexer no CSS.

1 - Instale o componente **dropdown-menu** (usado pelo seletor):

```sh
pnpm dlx shadcn@latest add dropdown-menu
```

2 - Crie a pasta **components/theme**. Vamos separar em 4 arquivos para não conflitar com o **Fast Refresh** do React (o mesmo motivo da Parte 1): context e hook ficam em **.ts** (sem JSX), provider e toggle em **.tsx**.

Crie **src/components/theme/theme-context.ts**:

```ts
import { createContext } from 'react'

export type Theme = 'dark' | 'light' | 'system'

export type ThemeProviderState = {
	theme: Theme
	setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
	theme: 'system',
	setTheme: () => null,
}

export const ThemeProviderContext =
	createContext<ThemeProviderState>(initialState)
```

3 - Crie **src/components/theme/theme-hooks.ts** (note as chaves no `throw`, exigidas pela regra `curly` da Parte 1):

```ts
import { useContext } from 'react'

import { ThemeProviderContext } from './theme-context'

export function useTheme() {
	const context = useContext(ThemeProviderContext)

	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider')
	}

	return context
}
```

4 - Crie **src/components/theme/theme-provider.tsx**:

```tsx
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { type Theme, ThemeProviderContext } from './theme-context'

type ThemeProviderProps = {
	children: ReactNode
	defaultTheme?: Theme
	storageKey?: string
}

export function ThemeProvider({
	children,
	defaultTheme = 'system',
	storageKey = 'vite-ui-theme',
	...props
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(
		() => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
	)

	useEffect(() => {
		const root = window.document.documentElement

		root.classList.remove('light', 'dark')

		if (theme === 'system') {
			const systemTheme = window.matchMedia(
				'(prefers-color-scheme: dark)',
			).matches
				? 'dark'
				: 'light'

			root.classList.add(systemTheme)
			return
		}

		root.classList.add(theme)
	}, [theme])

	const value = {
		theme,
		setTheme: (theme: Theme) => {
			localStorage.setItem(storageKey, theme)
			setTheme(theme)
		},
	}

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	)
}
```

5 - Crie **src/components/theme/mode-toggle.tsx** (o seletor em dropdown):

```tsx
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useTheme } from './theme-hooks'

export function ModeToggle() {
	const { setTheme } = useTheme()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='outline' size='icon'>
					<Sun className='h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
					<Moon className='absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
					<span className='sr-only'>Alternar tema</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem onClick={() => setTheme('light')}>
					Claro
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme('dark')}>
					Escuro
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme('system')}>
					Sistema
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
```

6 - Envolva a aplicação com o `ThemeProvider`. No **src/app.tsx**:

```tsx
import { RouterProvider } from 'react-router'

import { ThemeProvider } from './components/theme/theme-provider'
import { TitleProvider } from './components/title/title-provider'
import { router } from './routes'

export function App() {
	return (
		<ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
			<TitleProvider titleTemplate='%s | FrontEnd' defaultTitle='FrontEnd'>
				<RouterProvider router={router} />
			</TitleProvider>
		</ThemeProvider>
	)
}
```

7 - Evite o **flash de tema errado** (FOUT). O provider aplica a classe no `useEffect`, que roda **depois** do primeiro paint — no reload em modo escuro pode piscar branco. A solução é um script inline no `<head>` do **index.html**, que roda **antes** do React e da primeira pintura:

```html
<head>
	<!-- ... meta, title ... -->

	<!-- Evita o flash de tema errado no primeiro carregamento. -->
	<script>
		;(function () {
			const theme = localStorage.getItem('vite-ui-theme') || 'system'
			const prefersDark = window.matchMedia(
				'(prefers-color-scheme: dark)',
			).matches
			const isDark =
				theme === 'dark' || (theme === 'system' && prefersDark)
			document.documentElement.classList.add(isDark ? 'dark' : 'light')
		})()
	</script>

	<script type="module" src="/src/main.tsx"></script>
</head>
```

- A chave `vite-ui-theme` e os 3 estados (light/dark/system) batem com o `ThemeProvider`.

8 - Comite como:

```sh
git add .
git commit -m "feat: add light/dark theme with shadcn ThemeProvider and ModeToggle"
git push
```

---

### Migrando os layouts para tokens semânticos

- Agora que temos os tokens do shadcn (`background`, `foreground`, `card`, `border`, `muted-foreground`, etc.), trocamos as cores fixas (`bg-slate-800`...) por tokens. A vantagem: **zero `dark:`** nos componentes — a classe `.dark` no `<html>` inverte todos os tokens de uma vez.

1 - No **pages/\_layouts/app-layout.tsx**, use tokens e adicione o `ModeToggle` no header:

```tsx
import { Outlet } from 'react-router'

import { ModeToggle } from '@/components/theme/mode-toggle'

export function AppLayout() {
	return (
		<div className='flex h-screen flex-col bg-background text-foreground'>
			<header className='flex h-20 items-center justify-between border-b px-8'>
				<h1 className='text-3xl font-bold'>AppLayout Header</h1>
				<ModeToggle />
			</header>
			<main className='flex flex-1'>
				{/* Content will change here */}
				<Outlet />
			</main>
			<footer className='flex h-12 items-center border-t px-8 text-muted-foreground'>
				<p>AppLayout Footer</p>
			</footer>
		</div>
	)
}
```

2 - No **pages/app/home.tsx**, o `body` já está com `bg-background text-foreground` (via `@layer base`), então a Home só precisa do espaçamento:

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

3 - Aplique o mesmo nos outros layouts (**auth-layout.tsx** e **register-layout.tsx**): troque `bg-slate-*`/`text-slate-*` por `bg-background`/`text-foreground` e bordas por `border`.

4 - Rode e teste o seletor:

```sh
pnpm dev
```

- Clique no ícone do header → Claro / Escuro / Sistema.
- Recarregue em modo escuro → sem flash.
- DevTools → Application → Local Storage → a chave `vite-ui-theme`.

5 - Comite como:

```sh
git add .
git commit -m "refactor: migrate layouts to semantic color tokens"
git push
```

---

### Formulários com React Hook Form, Zod e Presentation Model

- Vamos refazer os formulários (**sign-in** e **register**) com **React Hook Form** (estado/submit) + **Zod** (validação tipada), no padrão **Presentation Model**: o `.tsx` fica só com a marcação e toda a lógica vai para um hook `useXPM`.

> **Presentation Model:** componente **com lógica** vira uma pasta própria com `x.tsx` (marcação) + `use-x-pm.ts` (lógica). Componente **sem lógica** (Home, páginas de erro, layouts) continua um `.tsx` simples. Bônus: o hook em `.ts` (sem componente) + a marcação em `.tsx` (só componente) satisfazem o Fast Refresh por construção, e o RHF dispensa tipar o evento de submit (nada de `React.FormEvent`, que é deprecated no React 19).

1 - Instale as dependências:

```sh
pnpm add react-hook-form zod @hookform/resolvers
```

2 - Instale os componentes shadcn de formulário:

```sh
pnpm dlx shadcn@latest add input label
```

3 - Mova o **sign-in** para uma pasta própria. Crie **src/pages/auth/sign-in/use-sign-in-pm.ts** (a lógica):

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const signInForm = z.object({
	email: z.email('Informe um e-mail válido.'),
	password: z.string().min(6, 'Mínimo de 6 caracteres.'),
})

type SignInForm = z.infer<typeof signInForm>

export function useSignInPM() {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignInForm>({
		resolver: zodResolver(signInForm),
	})

	function onSubmit(data: SignInForm) {
		// sem backend ainda — aqui chamaria um service de autenticação
		console.log(data)
	}

	return {
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}
```

- O `z.infer<typeof signInForm>` deriva o tipo do schema — uma única fonte de verdade para validação e tipagem.

4 - Crie **src/pages/auth/sign-in/sign-in.tsx** (só marcação, consumindo o hook):

```tsx
import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useSignInPM } from './use-sign-in-pm'

export function SignIn() {
	const pm = useSignInPM()

	return (
		<>
			<PageTitle title='Sign In' />

			<div className='flex flex-1 items-center justify-center p-8'>
				<div className='w-full max-w-md space-y-6'>
					<h2 className='text-center text-2xl font-semibold tracking-tight'>
						Acessar conta
					</h2>

					<form onSubmit={pm.handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='email'>E-mail</Label>
							<Input
								id='email'
								type='email'
								{...pm.register('email')}
							/>
							{pm.errors.email && (
								<p className='text-sm text-destructive'>
									{pm.errors.email.message}
								</p>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='password'>Senha</Label>
							<Input
								id='password'
								type='password'
								{...pm.register('password')}
							/>
							{pm.errors.password && (
								<p className='text-sm text-destructive'>
									{pm.errors.password.message}
								</p>
							)}
						</div>

						<Button
							type='submit'
							disabled={pm.isSubmitting}
							className='w-full'
						>
							Entrar
						</Button>
					</form>
				</div>
			</div>
		</>
	)
}
```

- Apague o antigo **src/pages/auth/sign-in.tsx** (foi substituído pela pasta).

5 - Faça o mesmo com o **register**. A pasta **pages/register** já existe — só adicione o hook **src/pages/register/use-register-pm.ts** (note o `.refine` checando se as senhas conferem):

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const registerForm = z
	.object({
		name: z.string().min(2, 'Informe seu nome.'),
		email: z.email('Informe um e-mail válido.'),
		password: z.string().min(6, 'Mínimo de 6 caracteres.'),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'As senhas não conferem.',
		path: ['confirmPassword'],
	})

type RegisterForm = z.infer<typeof registerForm>

export function useRegisterPM() {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterForm>({
		resolver: zodResolver(registerForm),
	})

	function onSubmit(data: RegisterForm) {
		// sem backend ainda
		console.log(data)
	}

	return {
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}
```

6 - Reescreva **src/pages/register/register.tsx** (só marcação):

```tsx
import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useRegisterPM } from './use-register-pm'

export function Register() {
	const pm = useRegisterPM()

	return (
		<>
			<PageTitle title='Register' />

			<div className='flex flex-1 items-center justify-center p-8'>
				<div className='w-full max-w-md space-y-6'>
					<h2 className='text-center text-2xl font-semibold tracking-tight'>
						Criar conta
					</h2>

					<form onSubmit={pm.handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='name'>Nome</Label>
							<Input id='name' type='text' {...pm.register('name')} />
							{pm.errors.name && (
								<p className='text-sm text-destructive'>
									{pm.errors.name.message}
								</p>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='email'>E-mail</Label>
							<Input
								id='email'
								type='email'
								{...pm.register('email')}
							/>
							{pm.errors.email && (
								<p className='text-sm text-destructive'>
									{pm.errors.email.message}
								</p>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='password'>Senha</Label>
							<Input
								id='password'
								type='password'
								{...pm.register('password')}
							/>
							{pm.errors.password && (
								<p className='text-sm text-destructive'>
									{pm.errors.password.message}
								</p>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='confirmPassword'>Confirmar senha</Label>
							<Input
								id='confirmPassword'
								type='password'
								{...pm.register('confirmPassword')}
							/>
							{pm.errors.confirmPassword && (
								<p className='text-sm text-destructive'>
									{pm.errors.confirmPassword.message}
								</p>
							)}
						</div>

						<Button
							type='submit'
							disabled={pm.isSubmitting}
							className='w-full'
						>
							Cadastrar
						</Button>
					</form>
				</div>
			</div>
		</>
	)
}
```

7 - Ajuste os imports no **src/routes.tsx**:

```ts
// sign-in foi para uma subpasta:
import { SignIn } from './pages/auth/sign-in/sign-in'
// register continua no mesmo caminho (a pasta já existia):
import { Register } from './pages/register/register'
```

8 - Rode e teste a validação (submeta vazio, e-mail inválido, senha curta, senhas diferentes):

```sh
pnpm dev
```

- Sem backend, o submit válido só faz `console.log(data)` — veja no console do navegador.

9 - Comite como:

```sh
git add .
git commit -m "feat: add sign-in and register forms with React Hook Form, Zod and Presentation Model"
git push
```

---

- Com isso o setup de um projeto FrontEnd está completo: configuração, roteamento, títulos, tema, design system com shadcn/ui e formulários validados.
- A partir daqui, basta adicionar os componentes necessários conforme o projeto pedir:  
  [Componentes shadcn/ui](https://ui.shadcn.com/docs/components)

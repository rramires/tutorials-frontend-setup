# Tutorial Frontend Setup — Parte 5: testes end-to-end com Playwright

Continuação da Parte 4 (**TUTORIAL_04_vitest.md**). Pré-requisito: o projeto até o final da Parte 4 — formulários **sign-in** e **register** conectados (`useMutation` + toast + navigate), o **MSW** mockando a API e os **testes unitários** com Vitest.

Na Parte 4 testamos a UI **isolada** (a validação do Zod, sem rede). Agora subimos um nível: testes **end-to-end** com **Playwright**, num navegador real, exercitando o **caminho completo** — preencher o form → request → toast → navegação — **contra o MSW**.

- **Playwright** como runner de e2e (sobe o app sozinho via `webServer`)
- **Navegador real** (Chromium) clicando e digitando como um usuário
- Roda contra o **`pnpm dev:test`** (porta 5001, MSW ativo no `--mode test`)
- Specs por **papel acessível** (`getByLabel`/`getByRole`) — nada de seletor frágil
- Asserções de **toast** (feedback) e **navegação** (URL pós-submit)
- Um **helper** opcional pra desacelerar a UI e assistir o teste rodar

**Onde isto entra no fluxo (mock-first):**

```
telas (P2) → MSW deixa clicável (P3) → testes garantem que não quebra (P4 unit, P5 e2e) → backend real (P6)
```

> **Unit x e2e — a fronteira.** A Parte 4 testou **validação isolada** (falha antes da rede, sem MSW). A Parte 5 testa o **caminho de rede de verdade**: o form válido dispara a request, o MSW responde, e a gente verifica o **toast** e o **redirect**. Os caminhos de **erro** (credencial inválida = 401, username tomado = 409) também passam pela rede mockada. Unit e e2e **se complementam**, não se sobrepõem.

**O que vamos testar (contra o MSW):**

| Spec       | Arquivo                 | Cenários                                                          |
| ---------- | ----------------------- | ----------------------------------------------------------------- |
| `sign-in`  | `test/sign-in.spec.ts`  | login ok → toast + vai pra `/` · senha errada → toast de erro     |
| `register` | `test/register.spec.ts` | cadastro ok → toast + vai pra `/sign-in` · username `admin` → 409 |

> Lembrete das regras do mock (definidas na Parte 3): a senha **`Password1!`** autentica qualquer identifier; o username **`admin`** já está cadastrado (409).

---

### 1 - Instalando o Playwright

- O **Playwright** instala em dois passos: o **pacote** (runner + API, via pnpm) e os **navegadores** (binários do Chromium, baixados à parte num cache fora do projeto). O segundo passo não é uma dependência do `package.json` — é um download de browser.

1 - Instale o pacote em `devDependencies`:

```sh
pnpm add -D @playwright/test
```

2 - Baixe o navegador (só o Chromium — é o que vamos usar):

```sh
npx playwright install chromium
```

> **Nota (Linux/WSL).** Se o navegador reclamar de bibliotecas do sistema faltando, rode `npx playwright install --with-deps chromium` (instala as libs via apt; pode pedir senha do sudo). No macOS/Windows o primeiro comando basta.

3 - Comite como:

```sh
git add .
git commit -m "chore: add playwright"
git push
```

---

### 2 - Configurando o Playwright

- A config diz ao Playwright **onde estão os specs** (`test/`), **qual URL** abrir (`baseURL`) e **como subir o app** antes da suíte (`webServer`). O pulo do gato: o `webServer` roda o **`pnpm dev:test`** — o mesmo servidor mockado da Parte 3 (porta 5001, MSW ligado) —, então os testes batem na API fake, de forma determinística, sem backend de verdade.

1 - Vá na **raiz do projeto** e crie **`playwright.config.ts`**:

```ts
import { defineConfig, devices } from '@playwright/test'

// https://playwright.dev/docs/test-configuration
export default defineConfig({
	testDir: './test',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	use: {
		baseURL: 'http://localhost:5001',
		trace: 'on-first-retry',
	},
	// Boots the mock app (MSW active in --mode test) before the suite runs.
	webServer: {
		command: 'pnpm dev:test',
		url: 'http://localhost:5001',
		reuseExistingServer: !process.env.CI,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
})
```

> **Linha a linha.** `testDir` = pasta dos specs; `baseURL` = deixa `page.goto('/sign-in')` virar a URL absoluta; `webServer.command` sobe o `dev:test` e `webServer.url` espera ele responder antes de começar; `reuseExistingServer` reaproveita um servidor já aberto no seu terminal (em CI, sempre sobe um limpo); `trace: 'on-first-retry'` guarda um trace pra depurar falha intermitente. Deixamos **só o Chromium** — dá pra ligar Firefox/WebKit depois.

> **O IDE vai reclamar agora — é esperado.** Vai aparecer `Cannot find name 'process'` neste arquivo (ele usa `process.env`, que é do Node). O `playwright.config.ts` ainda não pertence a nenhum projeto do TypeScript; isso se resolve no **passo 4** abaixo, quando ele entra no `tsconfig.node.json` (que tem os tipos do Node). Se o aviso insistir depois do passo 4, é cache do editor: _TypeScript: Restart TS Server_.

2 - **Separe os domínios do Vitest e do Playwright.** Os dois usam a extensão `.spec`, mas vivem em mundos diferentes: o **Vitest** roda specs de componente (em `src/`), o **Playwright** roda specs de navegador (em `test/`). Sem escopo, o Vitest tentaria rodar os e2e e quebraria (o `test` do `@playwright/test` não é o do Vitest). Abra a **`vite.config.ts`** e **substitua o bloco `test` inteiro** por isto (a linha nova é o `include`, logo após `setupFiles`):

```ts
// substitua todo o bloco test por:
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./test/setup.ts'],
		// Unit tests live next to the code; Playwright owns `test/*.spec.ts`.
		include: ['src/**/*.spec.{ts,tsx}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/**/*.spec.{ts,tsx}',
				'src/main.tsx',
				'src/vite-env.d.ts',
			],
		},
	},
```

> **Por quê.** Por padrão o Vitest varre `**/*.spec.*` (pegaria `test/*.spec.ts`). Com o `include` apontando só pra `src/`, cada runner cuida do seu: `pnpm test:run` = unit (src), `pnpm e2e` = e2e (test). Não confunda os dois `include`: o de **`test`** diz **quais specs rodar**; o de **`coverage`** diz **quais arquivos medir** de cobertura (esse veio da Parte 4, não mexa).

3 - Os arquivos do Playwright (config + helper + specs) são **código Node**, não código de navegador. O projeto **app** (TypeScript) é DOM-puro (`types: ["vite/client", "vitest/globals"]`) e não conhece `process`. O projeto **node** (`tsconfig.node.json`) já tem `types: ["node"]` — é onde os configs vivem. Mova os e2e pra lá. Abra a **`tsconfig.app.json`** e exclua os arquivos e2e do typecheck do app:

```jsonc
// no final subistitua o include existente e adicione o exclude:
  "include": ["src", "test"],
  "exclude": ["test/e2e-utils.ts", "test/*.spec.ts"]
```

4 - Abra a **`tsconfig.node.json`** e inclua os e2e (junto do `vite.config.ts`):

```jsonc
// no final subistitua o include
  "include": [
    "vite.config.ts",
    "playwright.config.ts",
    "test/e2e-utils.ts",
    "test/*.spec.ts"
  ]
```

> **Por quê.** Sem isso, o `pnpm build` (`tsc -b`) quebra com `TS2591: Cannot find name 'process'` no helper e2e — o `test/` inteiro caía no projeto app (que não tem os tipos do Node). Agora o app continua DOM-puro e os e2e são checados no projeto node, com os tipos certos. (`test/setup.ts` e `test/utils.tsx`, que são do Vitest, **continuam** no app.)

5 - Adicione os scripts de e2e na **`package.json`**:

```jsonc
// depois de:
    "test:coverage": "vitest run --coverage",
// adicione:
    "pree2e": "fuser -k 5001/tcp 2>/dev/null || true",
    "e2e": "playwright test",
    "e2e:ui": "PLAYWRIGHT_SLOW_UI=true playwright test --ui",
    "killapp": "fuser -k 3001/tcp 5001/tcp 4173/tcp 2>/dev/null; pkill -f '[p]laywright.*test-server' 2>/dev/null; pkill -f '[m]s-playwright' 2>/dev/null; echo 'killapp: freed 3001/5001/4173 + killed stray playwright procs'",
```

> **Dois jeitos de rodar.** `e2e` = headless, rápido, pro dia a dia/CI. `e2e:ui` = o **Playwright UI** — abre **sem disparar** os testes, você clica ▶ pra rodar e navega os **snapshots** do DOM (detalhes na seção 4).
>
> **O `pree2e` é um pre-hook.** O pnpm roda automaticamente qualquer script `pre<nome>` antes do `<nome>` — então, **antes de todo `pnpm e2e`**, o `pree2e` libera a porta **5001** matando um servidor que tenha ficado preso de uma run anterior (`fuser -k 5001/tcp`; o `|| true` garante que ele não falhe quando a porta já está livre). Resolve aquele "ficou um processo aberto" sem você lembrar de matar na mão.
>
> **`pnpm killapp` — faxina manual.** Às vezes você fecha o VS Code com um `dev`/`dev:test`/UI rodando e o processo fica preso. O `killapp` libera **todas as portas da app** (`3001` dev, `5001` dev:test, `4173` preview) e mata os processos do Playwright órfãos (test-server do UI + browsers). Rode `pnpm killapp` quando algo travar. (Linux/WSL: usa `fuser`/`pkill`; no macOS troque `fuser -k PORTA/tcp` por `lsof -ti tcp:PORTA | xargs kill`.) O `[p]`/`[m]` nos padrões é truque pra o `pkill` **não matar o próprio comando** — sem isso, ele casaria com a própria linha que contém "playwright".

6 - O Playwright gera relatórios e artefatos. Mande pro lixo do git. Abra a **`.gitignore`** e adicione:

```gitignore
# Playwright
/test-results/
/playwright-report/
/playwright/.cache/
```

7 - E tire essas pastas geradas do ESLint também (mesma lição do `coverage` na Parte 4). Abra a **`eslint.config.js`** e amplie o `globalIgnores`:

```js
// substitua no início o globalIgnores:
	globalIgnores([
		'dist',
		'coverage',
		'test-results',
		'playwright-report',
		'public/mockServiceWorker.js',
	]),
```

8 - Confira que nada quebrou e comite. O `pnpm test:run` prova que o escopo do Vitest está certo (só os unit), e o `pnpm build` prova que o split de tsconfig está certo:

```sh
pnpm test:run
pnpm lint
pnpm build
```

```sh
git add .
git commit -m "chore: configure playwright"
git push
```

---

### 3 - Helper de inspeção da UI

- Por padrão o Playwright voa — clica e assere em milissegundos, sem dar pra acompanhar. Esse helper insere uma **pausa opcional**, ligada só por uma variável de ambiente (`PLAYWRIGHT_SLOW_UI`, que o script `e2e:ui` define). Em rodada normal/CI é **no-op** (zero impacto na velocidade); quando você quer **assistir** o teste, roda `pnpm e2e:ui`.

1 - Vá na pasta **`test`** e crie **`e2e-utils.ts`**:

```ts
import { type Page } from '@playwright/test'

/**
 * Optional pause to watch the UI react during a run.
 * Enabled only when PLAYWRIGHT_SLOW_UI=true (see the `e2e:ui` script);
 * a no-op in normal/CI runs so the suite stays fast.
 */
export async function waitForUIInspection(page: Page, ms = 250) {
	if (process.env.PLAYWRIGHT_SLOW_UI === 'true') {
		await page.waitForTimeout(ms)
	}
}
```

> **Nome do arquivo.** É `e2e-utils.ts`, **não** `utils.ts` — o `test/utils.tsx` já existe e é o `renderWithProviders` do Vitest (Parte 4). Mundos separados, nomes separados.

2 - Confira o build (agora o helper é typechecado no projeto node) e comite:

```sh
pnpm lint
pnpm build
```

```sh
git add .
git commit -m "test: add e2e ui-inspection helper"
git push
```

---

### 4 - Teste e2e do sign-in

- Aqui o teste age como gente: abre `/sign-in`, preenche os campos **pelo label** (`getByLabel`), clica no botão **pelo papel** (`getByRole`) e verifica o resultado — o **toast** apareceu e a **URL** mudou. Dois cenários: login bom (senha `Password1!` → sucesso → vai pra `/`) e login ruim (senha errada → o MSW devolve 401 → toast de erro, fica em `/sign-in`).

1 - Vá na pasta **`test`** e crie **`sign-in.spec.ts`**:

```ts
import { expect, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

test('signs in and redirects home', async ({ page }) => {
	await page.goto('/sign-in')

	await page.getByLabel('Email or username').fill('johndoe')
	await page.getByLabel('Password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign in' }).click()

	await expect(page.getByText('Signed in successfully.')).toBeVisible()
	await expect(page).toHaveURL('/')

	await waitForUIInspection(page)
})

test('shows error on wrong credentials', async ({ page }) => {
	await page.goto('/sign-in')

	await page.getByLabel('Email or username').fill('johndoe')
	await page.getByLabel('Password').fill('WrongPass1!')
	await page.getByRole('button', { name: 'Sign in' }).click()

	await expect(page.getByText('Invalid credentials.')).toBeVisible()
	await expect(page).toHaveURL('/sign-in')

	await waitForUIInspection(page)
})
```

> **Detalhes.** `getByLabel`/`getByRole` resolvem pelo texto acessível (o mesmo que um leitor de tela vê), não por classe ou id. As asserções são **web-first**: `toBeVisible()` e `toHaveURL()` **re-tentam sozinhas** até passar (ou estourar o timeout), então não precisa esperar a rede na mão — quando o MSW responde e o toast aparece, a asserção resolve. `toHaveURL('/')` é relativo ao `baseURL`. O toast sobrevive ao redirect porque o `<Toaster>` mora no layout raiz (Parte 3).

> **Por que `goto` puro (sem `{ waitUntil: 'networkidle' }`).** O Playwright [desencoraja o `networkidle`](https://playwright.dev/docs/api/class-page#page-goto) — é instável e quase sempre desnecessário, porque as asserções **web-first** acima já re-tentam até a UI reagir. Então `page.goto('/sign-in')` puro basta.

2 - Rode a suíte. Na **primeira vez**, o Playwright sobe o `dev:test` sozinho:

```sh
pnpm e2e
```

> **A 1ª run demora (~2 min), as seguintes são rápidas (~13s).** Não são os testes (cada um ~400-500ms): na primeira vez o **Vite otimiza as dependências** (`Re-optimizing dependencies`), o que é lento com cache frio — mais ainda no WSL. Depois disso o cache fica quente e o `pnpm e2e` roda em ~13s (o resto é boot + teardown do servidor). É o mesmo comportamento de qualquer setup com `command: 'pnpm dev:test'` (o curso de referência inclusive).
>
> **Iteração ainda mais rápida:** deixe um **`pnpm dev:test` aberto** num terminal e rode o `pnpm e2e` noutro. Com `reuseExistingServer`, o Playwright **reaproveita** esse servidor — não sobe nem derruba nada. (Nesse fluxo o `pree2e` atrapalha: ele mata o servidor que você quer reusar. Use o `pree2e` pro caso "rodada única e limpa"; pro loop de dev, mantenha o `dev:test` vivo.)

Quer **ver** o teste rodando? Use o **Playwright UI**:

```sh
pnpm e2e:ui
```

> **Como funciona o UI mode.** Ele **abre sem disparar** os testes — você escolhe e clica **▶** pra rodar (esse "abre e espera eu mandar" é justamente a graça dele). Depois da run ele mostra **snapshots** do DOM pra você navegar no tempo: clique **no nome do teste** → as **Actions** (`goto`/`fill`/`click`/`expect`) aparecem → clique numa ação → o snapshot renderiza (alterne *Before/Action/After*).
>
> **Se o preview ficar em `about:blank`:** desça até **Settings** (canto inferior esquerdo) e marque **"Display canvas content"**. Sem isso o UI não desenha o snapshot do navegador. É o passo que falta na maioria das primeiras vezes.

3 - Verde? Comite:

```sh
git add .
git commit -m "test: add sign-in e2e test"
git push
```

---

### 5 - Teste e2e do register

- Mesma ideia, form maior. Um detalhe de seletor importa: há **dois** campos com "password" no label (`Password` e `Confirm password`). O `getByLabel('Password')` casaria com os dois (busca por substring) e o Playwright reclamaria de ambiguidade — por isso usamos **`{ exact: true }`** no campo `Password`. Cenários: cadastro bom (→ toast + vai pra `/sign-in`) e username `admin` (→ MSW devolve 409 → toast de erro, fica em `/register`).

1 - Vá na pasta **`test`** e crie **`register.spec.ts`**:

```ts
import { expect, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

test('registers and redirects to sign-in', async ({ page }) => {
	await page.goto('/register')

	await page.getByLabel('Username').fill('johndoe')
	await page.getByLabel('Email').fill('john@example.com')
	await page.getByLabel('Password', { exact: true }).fill('Password1!')
	await page.getByLabel('Confirm password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign up' }).click()

	await expect(
		page.getByText('Account created. You can sign in now.'),
	).toBeVisible()
	await expect(page).toHaveURL('/sign-in')

	await waitForUIInspection(page)
})

test('shows error when the username is taken', async ({ page }) => {
	await page.goto('/register')

	await page.getByLabel('Username').fill('admin')
	await page.getByLabel('Email').fill('admin@example.com')
	await page.getByLabel('Password', { exact: true }).fill('Password1!')
	await page.getByLabel('Confirm password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign up' }).click()

	await expect(page.getByText('User already exists.')).toBeVisible()
	await expect(page).toHaveURL('/register')

	await waitForUIInspection(page)
})
```

> **Por que `{ exact: true }`.** O `getByLabel` casa por substring, e `Confirm password` contém `password`. Sem o `exact`, o `getByLabel('Password')` acharia dois campos e o teste falha por ambiguidade (_strict mode violation_). `Confirm password` já é único, não precisa.

2 - Rode tudo (agora são 4 testes):

```sh
pnpm e2e
```

3 - Verde? Comite:

```sh
git add .
git commit -m "test: add register e2e test"
git push
```

---

### 6 - Fechando a Parte 5

Pronto. O app agora tem **duas camadas de teste** sobre os mocks: unit (Parte 4, validação isolada) e e2e (Parte 5, caminho completo no navegador). Tudo ainda contra o **MSW** — nenhum backend de verdade.

**Resumo do que entrou:**

- `@playwright/test` + Chromium
- `playwright.config.ts` subindo o `pnpm dev:test` (5001, MSW)
- Vitest escopado em `src/`; e2e isolados no projeto node do TypeScript
- `test/e2e-utils.ts` (`waitForUIInspection`)
- specs `test/sign-in.spec.ts` e `test/register.spec.ts` (4 testes)
- scripts `e2e` / `e2e:ui` (+ `pree2e` que libera a porta 5001 antes); `test-results/` e `playwright-report/` ignorados (git + eslint)

**Comandos do dia a dia:**

| Comando         | O que faz                                              |
| --------------- | ----------------------------------------------------- |
| `pnpm test:run` | testes unitários (Vitest, sem rede)                   |
| `pnpm e2e`      | testes e2e headless (Playwright, contra o MSW)        |
| `pnpm e2e:ui`   | Playwright UI: abre sem disparar, você clica ▶ e vê snapshots |

Por fim, comite este tutorial:

```sh
git add TUTORIAL_05_playwright.md
git commit -m "docs: add part 5 tutorial (e2e tests with playwright)"
git push
```

> **A seguir — Parte 6.** Trocar o MSW pelo **backend real**: apontar a `.env.local` pra API de verdade, guardar o token retornado no login e proteger as rotas autenticadas. É a virada de mock-first pra integração real.

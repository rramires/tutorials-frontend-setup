import { RouterProvider } from 'react-router'

import { ThemeProvider } from './components/theme/theme-provider'
import { TitleProvider } from './components/title/title-provider'
import { router } from './routes'

export function App() {
	return (
		<ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
			<TitleProvider
				titleTemplate='%s | FrontEnd'
				defaultTitle='FrontEnd'
			>
				<RouterProvider router={router} />
			</TitleProvider>
		</ThemeProvider>
	)
}

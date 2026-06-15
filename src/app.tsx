import { RouterProvider } from 'react-router'

import { TitleProvider } from './components/title/title-provider'
import { router } from './routes'

export function App() {
	return (
		<TitleProvider titleTemplate='%s | FrontEnd' defaultTitle='FrontEnd'>
			<RouterProvider router={router} />
		</TitleProvider>
	)
}

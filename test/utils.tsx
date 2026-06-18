import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { type ReactElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router'

interface RenderOptions {
	route?: string
}

export function renderWithProviders(
	ui: ReactElement,
	{ route = '/' }: RenderOptions = {},
) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	})

	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<MemoryRouter initialEntries={[route]}>
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			</MemoryRouter>
		)
	}

	return render(ui, { wrapper: Wrapper })
}

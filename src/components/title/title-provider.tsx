import type { ReactNode } from 'react'

import { TitleContext } from './title-context'

interface TitleProviderProps {
	titleTemplate?: string
	defaultTitle?: string
	children: ReactNode
}

export function TitleProvider({
	titleTemplate = '%s',
	defaultTitle = '',
	children,
}: TitleProviderProps) {
	return (
		<TitleContext.Provider value={{ titleTemplate, defaultTitle }}>
			{children}
		</TitleContext.Provider>
	)
}

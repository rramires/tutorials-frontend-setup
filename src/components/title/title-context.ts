import { createContext } from 'react'

interface TitleContextValue {
	titleTemplate: string
	defaultTitle: string
}

export const TitleContext = createContext<TitleContextValue>({
	titleTemplate: '%s',
	defaultTitle: '',
})

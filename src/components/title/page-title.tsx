import { useContext } from 'react'

import { TitleContext } from './title-context'

interface PageTitleProps {
	title?: string
}

export function PageTitle({ title }: PageTitleProps) {
	const { titleTemplate, defaultTitle } = useContext(TitleContext)
	const resolved = title ? titleTemplate.replace('%s', title) : defaultTitle
	return <title>{resolved}</title>
}

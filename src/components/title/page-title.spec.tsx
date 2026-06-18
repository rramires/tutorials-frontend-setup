import { render } from '@testing-library/react'

import { PageTitle } from './page-title'
import { TitleProvider } from './title-provider'

describe('PageTitle', () => {
	it('applies the template when a title is given', () => {
		render(
			<TitleProvider titleTemplate='%s | My App' defaultTitle='My App'>
				<PageTitle title='Sign in' />
			</TitleProvider>,
		)

		expect(document.title).toBe('Sign in | My App')
	})

	it('falls back to the default title when none is given', () => {
		render(
			<TitleProvider titleTemplate='%s | My App' defaultTitle='My App'>
				<PageTitle />
			</TitleProvider>,
		)

		expect(document.title).toBe('My App')
	})
})

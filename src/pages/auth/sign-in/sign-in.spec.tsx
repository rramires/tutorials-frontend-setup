import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../../../../test/utils'
import { SignIn } from './sign-in'

describe('SignIn form', () => {
	it('shows validation errors when submitting empty', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SignIn />, { route: '/sign-in' })

		await user.click(screen.getByRole('button', { name: /sign in/i }))

		expect(
			await screen.findByText('Enter your email or username.'),
		).toBeInTheDocument()
		expect(
			await screen.findByText('Password is required.'),
		).toBeInTheDocument()
	})

	it('validates only the password when the identifier is filled', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SignIn />, { route: '/sign-in' })

		await user.type(screen.getByLabelText('Email or username'), 'johndoe')
		await user.click(screen.getByRole('button', { name: /sign in/i }))

		expect(
			await screen.findByText('Password is required.'),
		).toBeInTheDocument()
		expect(
			screen.queryByText('Enter your email or username.'),
		).not.toBeInTheDocument()
	})
})

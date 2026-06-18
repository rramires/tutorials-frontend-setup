import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../../../test/utils'
import { Register } from './register'

describe('Register form', () => {
	it('shows validation errors when submitting empty', async () => {
		const user = userEvent.setup()
		renderWithProviders(<Register />, { route: '/register' })

		await user.click(screen.getByRole('button', { name: /sign up/i }))

		expect(
			await screen.findByText('Minimum of 3 characters.'),
		).toBeInTheDocument()
		expect(
			await screen.findByText('Enter a valid email.'),
		).toBeInTheDocument()
	})

	it('rejects mismatched passwords', async () => {
		const user = userEvent.setup()
		renderWithProviders(<Register />, { route: '/register' })

		await user.type(screen.getByLabelText('Username'), 'john_doe')
		await user.type(screen.getByLabelText('Email'), 'john@example.com')
		await user.type(screen.getByLabelText('Password'), 'Password1!')
		await user.type(screen.getByLabelText('Confirm password'), 'Password2!')
		await user.click(screen.getByRole('button', { name: /sign up/i }))

		expect(
			await screen.findByText('Passwords do not match.'),
		).toBeInTheDocument()
	})

	it('rejects a weak password', async () => {
		const user = userEvent.setup()
		renderWithProviders(<Register />, { route: '/register' })

		await user.type(screen.getByLabelText('Username'), 'john_doe')
		await user.type(screen.getByLabelText('Email'), 'john@example.com')
		await user.type(screen.getByLabelText('Password'), 'password')
		await user.type(screen.getByLabelText('Confirm password'), 'password')
		await user.click(screen.getByRole('button', { name: /sign up/i }))

		expect(
			await screen.findByText(
				'Must include upper- and lowercase, a number and a special character.',
			),
		).toBeInTheDocument()
	})
})

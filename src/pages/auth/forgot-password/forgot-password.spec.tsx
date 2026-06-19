import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../../../../test/utils'
import { ForgotPassword } from './forgot-password'

describe('ForgotPassword form', () => {
	it('requires an email before sending the code', async () => {
		const user = userEvent.setup()
		renderWithProviders(<ForgotPassword />, { route: '/forgot-password' })

		await user.click(
			screen.getByRole('button', { name: /send reset code/i }),
		)

		expect(
			await screen.findByText('Enter a valid email.'),
		).toBeInTheDocument()
	})
})

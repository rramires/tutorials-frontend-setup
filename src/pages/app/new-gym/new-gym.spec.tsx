import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../../../../test/utils'
import { NewGym } from './new-gym'

describe('NewGym form', () => {
	it('requires title and coordinates before creating', async () => {
		const user = userEvent.setup()
		renderWithProviders(<NewGym />, { route: '/gyms/new' })

		await user.click(screen.getByRole('button', { name: 'Create gym' }))

		expect(
			await screen.findByText('Title is required.'),
		).toBeInTheDocument()
		expect(screen.getByText('Latitude is required.')).toBeInTheDocument()
		expect(screen.getByText('Longitude is required.')).toBeInTheDocument()
	})
})

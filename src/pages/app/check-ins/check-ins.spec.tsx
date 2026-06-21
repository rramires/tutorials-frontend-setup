import { screen } from '@testing-library/react'
import { vi } from 'vitest'

import {
	AuthContext,
	type AuthContextValue,
	type Role,
} from '@/components/auth/auth-context'

import { renderWithProviders } from '../../../../test/utils'
import { CheckIns } from './check-ins'

// One pending check-in, so the Validate button is eligible to render.
vi.mock('@/api/get-check-ins-history', () => ({
	getCheckInsHistory: vi.fn().mockResolvedValue([
		{
			id: 'c1',
			created_at: '2026-06-19T12:00:00.000Z',
			validated_at: null,
			user_id: 'u1',
			gym_id: 'g1',
		},
	]),
}))

function renderAs(role: Role) {
	const value: AuthContextValue = {
		status: 'authed',
		user: { id: 'u1', username: 'tester', isVerified: true, role },
		signIn: async () => {},
		signOut: async () => {},
		reloadUser: async () => {},
	}

	return renderWithProviders(
		<AuthContext.Provider value={value}>
			<CheckIns />
		</AuthContext.Provider>,
		{ route: '/check-ins' },
	)
}

describe('CheckIns page', () => {
	it('hides the Validate button from members', async () => {
		renderAs('MEMBER')

		expect(await screen.findByText('Pending')).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Validate' }),
		).not.toBeInTheDocument()
	})

	it('shows the Validate button to admins on a pending check-in', async () => {
		renderAs('ADMIN')

		expect(await screen.findByText('Pending')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Validate' }),
		).toBeInTheDocument()
	})
})

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import {
	AuthContext,
	type AuthContextValue,
	type Role,
} from '@/components/auth/auth-context'

import { RoleRoute } from './role-route'

function renderWithRole(role: Role) {
	const value: AuthContextValue = {
		status: 'authed',
		user: { id: 'u1', username: 'tester', isVerified: true, role },
		signIn: async () => {},
		signOut: async () => {},
		reloadUser: async () => {},
	}

	return render(
		<AuthContext.Provider value={value}>
			<MemoryRouter initialEntries={['/secret']}>
				<Routes>
					<Route element={<RoleRoute allow={['ADMIN']} />}>
						<Route
							path='/secret'
							element={<div>secret content</div>}
						/>
					</Route>
				</Routes>
			</MemoryRouter>
		</AuthContext.Provider>,
	)
}

describe('RoleRoute', () => {
	it('shows Forbidden when the role is not allowed', () => {
		renderWithRole('MEMBER')

		expect(screen.getByText('403 — Admins only')).toBeInTheDocument()
		expect(screen.queryByText('secret content')).not.toBeInTheDocument()
	})

	it('renders the child route when the role is allowed', () => {
		renderWithRole('ADMIN')

		expect(screen.getByText('secret content')).toBeInTheDocument()
	})
})

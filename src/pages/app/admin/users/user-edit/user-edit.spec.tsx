import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { vi } from 'vitest'

import {
	AuthContext,
	type AuthContextValue,
} from '@/components/auth/auth-context'

import { renderWithProviders } from '../../../../../../test/utils'
import { UserEdit } from './user-edit'

// The edit page fetches the user by id; return a verified member.
vi.mock('@/api/get-user', () => ({
	getUser: vi.fn(async (id: string) => ({
		id,
		username: 'memberx',
		email: 'memberx@example.com',
		role: 'MEMBER',
		is_verified: true,
		created_at: '2026-03-01T12:00:00.000Z',
		password_changed_at: null,
	})),
}))

function renderEdit({
	selfId,
	targetId,
}: {
	selfId: string
	targetId: string
}) {
	const value: AuthContextValue = {
		status: 'authed',
		user: {
			id: selfId,
			username: 'admin',
			isVerified: true,
			role: 'ADMIN',
		},
		signIn: async () => {},
		signOut: async () => {},
		reloadUser: async () => {},
	}

	return renderWithProviders(
		<AuthContext.Provider value={value}>
			<Routes>
				<Route path='/admin/users/:userId' element={<UserEdit />} />
			</Routes>
		</AuthContext.Provider>,
		{ route: `/admin/users/${targetId}` },
	)
}

describe('UserEdit page', () => {
	it('disables the role select when editing your own account', async () => {
		renderEdit({ selfId: 'me', targetId: 'me' })

		expect(
			await screen.findByText("You can't change your own role."),
		).toBeInTheDocument()
		expect(screen.getByRole('combobox')).toBeDisabled()
	})

	it('allows changing the role of another user', async () => {
		renderEdit({ selfId: 'admin-id', targetId: 'other-id' })

		expect(await screen.findByLabelText('Username')).toHaveValue('memberx')
		expect(
			screen.queryByText("You can't change your own role."),
		).not.toBeInTheDocument()
		expect(screen.getByRole('combobox')).toBeEnabled()
	})

	it('forces the verified toggle off when the email changes', async () => {
		renderEdit({ selfId: 'admin-id', targetId: 'other-id' })

		const email = await screen.findByLabelText('Email')
		expect(screen.getByRole('switch')).toBeEnabled()

		await userEvent.clear(email)
		await userEvent.type(email, 'changed@example.com')

		expect(
			await screen.findByText(
				'Changing the email will unverify this account.',
			),
		).toBeInTheDocument()
		expect(screen.getByRole('switch')).toBeDisabled()
	})
})

import { HttpResponse } from 'msw'

import type { PublicUser } from '../get-users'

const ADMIN_TOKEN = 'Bearer mock-admin-jwt-token'

// Mutable mock state: the user directory the admin area reads and edits. Seeded
// with the two demo accounts (admin + johndoe, matching the profile mock) plus
// filler members so the list has a second page (page 1 = 20, page 2 = 3).
export const users: PublicUser[] = [
	{
		id: 'mock-admin-id',
		username: 'admin',
		email: 'admin@example.com',
		role: 'ADMIN',
		is_verified: true,
		created_at: '2026-01-01T12:00:00.000Z',
		password_changed_at: null,
	},
	{
		id: 'mock-user-id',
		username: 'johndoe',
		email: 'johndoe@example.com',
		role: 'MEMBER',
		is_verified: false,
		created_at: '2026-02-01T12:00:00.000Z',
		password_changed_at: null,
	},
	...Array.from({ length: 21 }, (_, index) => {
		const n = index + 3
		return {
			id: `mock-user-${n}`,
			username: `member${n}`,
			email: `member${n}@example.com`,
			role: 'MEMBER' as const,
			is_verified: n % 2 === 0,
			created_at: `2026-03-${String(n).padStart(2, '0')}T12:00:00.000Z`,
			password_changed_at: null,
		}
	}),
]

// Mirror the backend role guard: admin routes answer 401 without a token and
// 403 for a non-admin token. Returns a response to short-circuit with, or null
// when the caller is an admin.
export function requireAdmin(authHeader: string | null) {
	if (!authHeader) {
		return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
	}
	if (authHeader !== ADMIN_TOKEN) {
		return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
	}
	return null
}

export function findUser(id: string) {
	return users.find((user) => user.id === id)
}

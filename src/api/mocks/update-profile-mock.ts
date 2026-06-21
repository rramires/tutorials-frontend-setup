import { http, HttpResponse } from 'msw'

import { findUser, users } from './users-data'
import { isVerified } from './verified-state'

interface UpdateProfileBody {
	username: string
}

export const updateProfileMock = http.patch<never, UpdateProfileBody>(
	'/auth/me',
	async ({ request }) => {
		const auth = request.headers.get('Authorization')
		if (!auth) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		const isAdmin = auth === 'Bearer mock-admin-jwt-token'
		const id = isAdmin ? 'mock-admin-id' : 'mock-user-id'

		const { username: raw } = await request.json()
		const username = raw.toLowerCase()

		// Username uniqueness across the directory (excluding self).
		if (
			users.some((user) => user.username === username && user.id !== id)
		) {
			return HttpResponse.json(
				{ message: 'E-mail already exists.' },
				{ status: 409 },
			)
		}

		// Persist so the profile mock (and the admin list) reflect the change.
		const self = findUser(id)
		if (self) {
			self.username = username
		}

		return HttpResponse.json({
			user: {
				id,
				username,
				is_verified: isAdmin ? true : isVerified(),
				role: isAdmin ? 'ADMIN' : 'MEMBER',
			},
		})
	},
)

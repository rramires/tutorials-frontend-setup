import { http, HttpResponse } from 'msw'

import type { SignInBody } from '../sign-in'

export const signInMock = http.post<never, SignInBody>(
	'/auth/login',
	async ({ request }) => {
		const { identifier, password } = await request.json()

		// Mock rule: the demo password authenticates any identifier. Signing in
		// as "admin" yields an admin token so you can reach role-gated screens.
		if (password === 'Password1!') {
			const token =
				identifier === 'admin'
					? 'mock-admin-jwt-token'
					: 'mock-jwt-token'
			return HttpResponse.json({ token })
		}

		return HttpResponse.json(
			{ message: 'Invalid credentials.' },
			{ status: 401 },
		)
	},
)

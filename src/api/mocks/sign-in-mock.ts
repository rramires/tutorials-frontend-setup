import { http, HttpResponse } from 'msw'

import type { SignInBody } from '../sign-in'

export const signInMock = http.post<never, SignInBody>(
	'/auth/login',
	async ({ request }) => {
		const { password } = await request.json()

		// Mock rule: the demo password authenticates any identifier.
		if (password === 'Password1!') {
			return HttpResponse.json({ token: 'mock-jwt-token' })
		}

		return HttpResponse.json(
			{ message: 'Invalid credentials.' },
			{ status: 401 },
		)
	},
)

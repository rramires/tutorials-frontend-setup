import { http, HttpResponse } from 'msw'

import type { RegisterAccountBody } from '../register'

export const registerMock = http.post<never, RegisterAccountBody>(
	'/users',
	async ({ request }) => {
		const { username, email } = await request.json()

		// Mock rule: this username is already taken.
		if (username === 'admin') {
			return HttpResponse.json(
				{ message: 'User already exists.' },
				{ status: 409 },
			)
		}

		return HttpResponse.json(
			{ user: { id: 'mock-user-id', username, email, role: 'member' } },
			{ status: 201 },
		)
	},
)

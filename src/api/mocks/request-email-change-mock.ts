import { http, HttpResponse } from 'msw'

import { users } from './users-data'

interface RequestEmailChangeBody {
	email: string
}

export const requestEmailChangeMock = http.post<never, RequestEmailChangeBody>(
	'/auth/me/email',
	async ({ request }) => {
		const auth = request.headers.get('Authorization')
		if (!auth) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		const { email } = await request.json()

		// Demo trigger: this sentinel address simulates the resend cooldown.
		if (email === 'cooldown@example.com') {
			return HttpResponse.json(
				{
					message:
						'Please wait before requesting another verification email.',
					retryAfter: 60,
				},
				{ status: 429 },
			)
		}

		// An address already taken returns the conflict the backend would.
		if (users.some((user) => user.email === email)) {
			return HttpResponse.json(
				{ message: 'E-mail already exists.' },
				{ status: 409 },
			)
		}

		return new HttpResponse(null, { status: 204 })
	},
)

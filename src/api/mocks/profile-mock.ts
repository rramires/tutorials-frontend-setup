import { http, HttpResponse } from 'msw'

import { isVerified } from './verified-state'

export const profileMock = http.get('/auth/me', ({ request }) => {
	// Mock rule: the demo access token identifies the seeded user.
	if (request.headers.get('Authorization') === 'Bearer mock-jwt-token') {
		return HttpResponse.json({
			user: {
				id: 'mock-user-id',
				username: 'johndoe',
				is_verified: isVerified(),
				role: 'MEMBER',
			},
		})
	}

	return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
})

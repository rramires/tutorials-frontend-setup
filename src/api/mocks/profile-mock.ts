import { http, HttpResponse } from 'msw'

export const profileMock = http.get('/auth/me', ({ request }) => {
	// Mock rule: the demo access token identifies the seeded user.
	if (request.headers.get('Authorization') === 'Bearer mock-jwt-token') {
		return HttpResponse.json({
			user: { id: 'mock-user-id', username: 'johndoe' },
		})
	}

	return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
})

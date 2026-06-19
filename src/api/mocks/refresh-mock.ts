import { http, HttpResponse } from 'msw'

export const refreshMock = http.patch('/auth/refresh', () => {
	// Mock mode keeps no refresh session, so boot always lands on "guest"
	// and you sign in on every load. The real backend rotates a cookie here.
	return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
})

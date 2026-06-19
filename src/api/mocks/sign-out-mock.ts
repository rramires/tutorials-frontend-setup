import { http, HttpResponse } from 'msw'

export const signOutMock = http.post('/auth/logout', () => {
	return new HttpResponse(null, { status: 204 })
})

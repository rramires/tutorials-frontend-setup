import { http, HttpResponse } from 'msw'

export const forgotPasswordMock = http.post('/users/forgot-password', () => {
	// Always 202 with the same body — never reveal whether the email exists.
	return HttpResponse.json(
		{ message: 'If the email exists, reset instructions were sent.' },
		{ status: 202 },
	)
})

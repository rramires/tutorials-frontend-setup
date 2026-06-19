import { http, HttpResponse } from 'msw'

import { setVerified } from './verified-state'

// Public link landing — token comes in the query string.
export const verifyEmailByLinkMock = http.get(
	'/users/verify-email',
	({ request }) => {
		const url = new URL(request.url)
		const token = url.searchParams.get('token')

		if (token === 'valid-token') {
			setVerified(true)
			return new HttpResponse(null, { status: 204 })
		}

		return HttpResponse.json({ message: 'Invalid token.' }, { status: 400 })
	},
)

// In-app OTP — 6-digit code in the body.
export const verifyEmailByOtpMock = http.post<never, { code: string }>(
	'/users/verify-email/otp',
	async ({ request }) => {
		const { code } = await request.json()

		if (code === '123456') {
			setVerified(true)
			return new HttpResponse(null, { status: 204 })
		}

		return HttpResponse.json({ message: 'Invalid code.' }, { status: 400 })
	},
)

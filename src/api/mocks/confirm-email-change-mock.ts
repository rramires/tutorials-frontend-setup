import { http, HttpResponse } from 'msw'

const INVALID_TOKEN = {
	message: 'Verification token is invalid or has already been used.',
}

// Door A — the authenticated user types the 6-digit code from the email.
export const confirmEmailChangeByOtpMock = http.post<never, { code: string }>(
	'/auth/me/email/confirm',
	async ({ request }) => {
		const auth = request.headers.get('Authorization')
		if (!auth) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		const { code } = await request.json()
		if (code === '123456') {
			return new HttpResponse(null, { status: 204 })
		}

		return HttpResponse.json(INVALID_TOKEN, { status: 400 })
	},
)

// Door B — the public link landing forwards its token (no auth needed).
export const confirmEmailChangeByLinkMock = http.get(
	'/users/confirm-email-change',
	({ request }) => {
		const url = new URL(request.url)
		const token = url.searchParams.get('token')
		if (token === 'valid-token') {
			return new HttpResponse(null, { status: 204 })
		}

		return HttpResponse.json(INVALID_TOKEN, { status: 400 })
	},
)

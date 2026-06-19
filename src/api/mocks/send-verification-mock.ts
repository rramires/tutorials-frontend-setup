import { http, HttpResponse } from 'msw'

export const sendVerificationMock = http.post(
	'/users/send-verification',
	() => {
		// Backend prints the code/link to its console in dev. Here we just 204.
		return new HttpResponse(null, { status: 204 })
	},
)

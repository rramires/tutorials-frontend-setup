import { api } from '@/lib/api'

// Self-service email change, step 1: ask the backend to send a confirmation to
// the NEW address. The current email stays valid until the change is confirmed.
export interface RequestEmailChangeBody {
	email: string
}

export async function requestEmailChange(body: RequestEmailChangeBody) {
	await api.post('/auth/me/email', body)
}

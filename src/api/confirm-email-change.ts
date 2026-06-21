import { api } from '@/lib/api'

export interface ConfirmEmailChangeOtpBody {
	code: string
}

// Step 2, door A: the authenticated user types the 6-digit code from the email.
export async function confirmEmailChangeByOtp(body: ConfirmEmailChangeOtpBody) {
	await api.post('/auth/me/email/confirm', body)
}

// Step 2, door B: the public link landing forwards its token to the backend.
export async function confirmEmailChangeByToken(token: string) {
	await api.get('/users/confirm-email-change', { params: { token } })
}

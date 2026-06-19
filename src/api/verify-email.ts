import { api } from '@/lib/api'

// Public link landing: the SPA forwards the token to the backend GET route.
export async function verifyEmailByToken(token: string) {
	await api.get('/users/verify-email', { params: { token } })
}

export interface VerifyEmailOtpBody {
	code: string
}

// In-app flow: the authenticated user types the 6-digit code from the email.
export async function verifyEmailByOtp({ code }: VerifyEmailOtpBody) {
	await api.post('/users/verify-email/otp', { code })
}

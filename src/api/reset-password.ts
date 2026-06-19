import { api } from '@/lib/api'

// Two ways to reset, mirroring the backend union: a link token (from the
// emailed link) or an email + 6-digit OTP code (from the forgot-password form).
export type ResetPasswordBody =
	| { token: string; newPassword: string }
	| { email: string; code: string; newPassword: string }

export async function resetPassword(body: ResetPasswordBody) {
	await api.post('/users/reset-password', body)
}

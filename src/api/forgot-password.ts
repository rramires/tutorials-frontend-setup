import { api } from '@/lib/api'

export interface ForgotPasswordBody {
	email: string
}

export async function forgotPassword({ email }: ForgotPasswordBody) {
	await api.post('/users/forgot-password', { email })
}

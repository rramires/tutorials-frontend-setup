import { api } from '@/lib/api'

export async function sendVerification() {
	await api.post('/users/send-verification')
}

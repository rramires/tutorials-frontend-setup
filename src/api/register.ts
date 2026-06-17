import { api } from '@/lib/api'

export interface RegisterAccountBody {
	username: string
	email: string
	password: string
}

export async function registerAccount({
	username,
	email,
	password,
}: RegisterAccountBody) {
	await api.post('/users', { username, email, password })
}

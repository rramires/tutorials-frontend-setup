import { api } from '@/lib/api'

export interface SignInBody {
	identifier: string
	password: string
}

export interface SignInResponse {
	token: string
}

export async function signIn({ identifier, password }: SignInBody) {
	const response = await api.post<SignInResponse>('/auth/login', {
		identifier,
		password,
	})

	return response.data
}

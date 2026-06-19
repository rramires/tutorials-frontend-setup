import { api } from '@/lib/api'

export interface GetProfileResponse {
	user: {
		id: string
		username: string
	}
}

export async function getProfile() {
	const response = await api.get<GetProfileResponse>('/auth/me')

	return response.data.user
}

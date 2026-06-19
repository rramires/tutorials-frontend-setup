import { api } from '@/lib/api'

export interface GetProfileResponse {
	user: {
		id: string
		username: string
		is_verified: boolean
		role: 'MEMBER' | 'ADMIN'
	}
}

export async function getProfile() {
	const response = await api.get<GetProfileResponse>('/auth/me')

	// Map the wire DTO (snake_case) to the app's User model (camelCase).
	const { id, username, is_verified, role } = response.data.user

	return { id, username, isVerified: is_verified, role }
}

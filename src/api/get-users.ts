import { api } from '@/lib/api'

// The admin-facing user shape. Mirrors the backend's PublicUser exactly — it is
// User without password_hash, so the hash never reaches the client.
export interface PublicUser {
	id: string
	username: string
	email: string
	role: 'MEMBER' | 'ADMIN'
	is_verified: boolean
	created_at: string
	password_changed_at: string | null
}

interface GetUsersResponse {
	users: PublicUser[]
}

export interface GetUsersParams {
	page?: number
}

// Admin-only listing (20/page). A non-admin gets 403 from the backend guard.
export async function getUsers({ page = 1 }: GetUsersParams = {}) {
	const response = await api.get<GetUsersResponse>('/users', {
		params: { page },
	})

	return response.data.users
}

import { api } from '@/lib/api'

import type { PublicUser } from './get-users'

// Admin edit. All fields optional, but the backend requires at least one and
// rejects unknown keys. Changing the email unverifies the account server-side.
export interface UpdateUserBody {
	username?: string
	email?: string
	role?: 'MEMBER' | 'ADMIN'
	is_verified?: boolean
}

interface UpdateUserResponse {
	user: PublicUser
}

export async function updateUser(userId: string, body: UpdateUserBody) {
	const response = await api.patch<UpdateUserResponse>(
		`/users/${userId}`,
		body,
	)

	return response.data.user
}

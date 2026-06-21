import { api } from '@/lib/api'

import type { PublicUser } from './get-users'

interface GetUserResponse {
	user: PublicUser
}

// Admin-only fetch by id. Lets the edit page stand on its own (survive a refresh
// / direct link) instead of depending on data passed from the list.
export async function getUser(userId: string) {
	const response = await api.get<GetUserResponse>(`/users/${userId}`)

	return response.data.user
}

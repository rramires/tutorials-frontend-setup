import { api } from '@/lib/api'

export interface RefreshResponse {
	token: string
}

export async function refresh() {
	const response = await api.patch<RefreshResponse>('/auth/refresh')

	return response.data.token
}

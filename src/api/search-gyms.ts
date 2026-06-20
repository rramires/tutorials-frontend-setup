import { api } from '@/lib/api'

export interface Gym {
	id: string
	title: string
	description: string | null
	phone: string | null
	latitude: number
	longitude: number
}

interface SearchGymsResponse {
	gyms: Gym[]
}

export interface SearchGymsParams {
	query: string
	page?: number
}

export async function searchGyms({ query, page = 1 }: SearchGymsParams) {
	const response = await api.get<SearchGymsResponse>('/gyms/search', {
		params: { query, page },
	})

	return response.data.gyms
}

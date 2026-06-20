import { api } from '@/lib/api'

export interface Gym {
	id: string
	title: string
	description: string | null
	phone: string | null
	latitude: number
	longitude: number
}

// The API serializes latitude/longitude as strings (Prisma Decimal). Coerce
// them to numbers so the rest of the app can treat coordinates as numbers.
export function normalizeGym(gym: Gym): Gym {
	return {
		...gym,
		latitude: Number(gym.latitude),
		longitude: Number(gym.longitude),
	}
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

	return response.data.gyms.map(normalizeGym)
}

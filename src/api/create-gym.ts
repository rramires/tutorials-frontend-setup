import { api } from '@/lib/api'

import { type Gym, normalizeGym } from './search-gyms'

export interface CreateGymBody {
	title: string
	description: string | null
	phone: string | null
	latitude: number
	longitude: number
}

interface CreateGymResponse {
	gym: Gym
}

export async function createGym(body: CreateGymBody) {
	const response = await api.post<CreateGymResponse>('/gyms', body)

	return normalizeGym(response.data.gym)
}

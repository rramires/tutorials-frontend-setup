import { api } from '@/lib/api'
import type { Coordinates } from '@/lib/geolocation'

import type { Gym } from './search-gyms'

interface NearbyGymsResponse {
	gyms: Gym[]
}

export async function getNearbyGyms({ latitude, longitude }: Coordinates) {
	const response = await api.get<NearbyGymsResponse>('/gyms/nearby', {
		params: { latitude, longitude },
	})

	return response.data.gyms
}

import { api } from '@/lib/api'

import { type CheckIn } from './get-check-ins-history'

export interface CreateCheckInParams {
	gymId: string
	latitude: number
	longitude: number
}

interface CreateCheckInResponse {
	checkIn: CheckIn
}

export async function createCheckIn({
	gymId,
	latitude,
	longitude,
}: CreateCheckInParams) {
	const response = await api.post<CreateCheckInResponse>(
		`/gyms/${gymId}/check-ins`,
		{ latitude, longitude },
	)

	return response.data.checkIn
}

import { api } from '@/lib/api'

import { type CheckIn } from './get-check-ins-history'

interface ValidateCheckInResponse {
	checkIn: CheckIn
}

export async function validateCheckIn(checkInId: string) {
	const response = await api.patch<ValidateCheckInResponse>(
		`/check-ins/${checkInId}/validate`,
	)

	return response.data.checkIn
}

import { http, HttpResponse } from 'msw'

import { checkIns, nextCheckInId, userIdFromAuth } from './check-ins-data'
import { gyms } from './gyms-data'

interface CheckInBody {
	latitude: number
	longitude: number
}

function isSameDay(iso: string, reference: Date) {
	const date = new Date(iso)
	return (
		date.getFullYear() === reference.getFullYear() &&
		date.getMonth() === reference.getMonth() &&
		date.getDate() === reference.getDate()
	)
}

export const checkInMock = http.post<{ gymId: string }, CheckInBody>(
	'/gyms/:gymId/check-ins',
	({ params, request }) => {
		const userId = userIdFromAuth(request.headers.get('Authorization'))
		if (!userId) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		// Gym must exist (real backend → 404 ResourceNotFoundError).
		const gym = gyms.find((candidate) => candidate.id === params.gymId)
		if (!gym) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// One check-in per day per user (real backend → 409 MaxCheckInsReached).
		// The mock skips the 100m-distance rule: it can't know the gym's real
		// coordinates relative to the browser's geolocation.
		const now = new Date()
		const already = checkIns.some(
			(checkIn) =>
				checkIn.user_id === userId &&
				isSameDay(checkIn.created_at, now),
		)
		if (already) {
			return HttpResponse.json(
				{ message: 'Max check-ins reached.' },
				{ status: 409 },
			)
		}

		const checkIn = {
			id: nextCheckInId(),
			created_at: now.toISOString(),
			validated_at: null,
			user_id: userId,
			gym_id: params.gymId,
		}
		checkIns.push(checkIn)

		return HttpResponse.json({ checkIn }, { status: 201 })
	},
)

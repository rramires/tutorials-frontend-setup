import { http, HttpResponse } from 'msw'

import { checkIns } from './check-ins-data'

export const validateCheckInMock = http.patch<{ checkInId: string }>(
	'/check-ins/:checkInId/validate',
	({ params, request }) => {
		// Mirror the backend RBAC: only an admin may validate (real backend →
		// 403 via verifyUserRole(ADMIN)).
		if (
			request.headers.get('Authorization') !==
			'Bearer mock-admin-jwt-token'
		) {
			return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
		}

		const checkIn = checkIns.find(
			(candidate) => candidate.id === params.checkInId,
		)
		if (!checkIn) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// The mock skips the 20-minute window (real backend → 409 on a late
		// validation); a time-based rule can't be exercised deterministically.
		checkIn.validated_at = new Date().toISOString()

		return HttpResponse.json({ checkIn })
	},
)

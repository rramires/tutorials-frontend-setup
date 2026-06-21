import { http, HttpResponse } from 'msw'

import { checkIns, userIdFromAuth } from './check-ins-data'

export const checkInsMetricsMock = http.get(
	'/check-ins/metrics',
	({ request }) => {
		const userId = userIdFromAuth(request.headers.get('Authorization'))
		if (!userId) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		const checkInsCount = checkIns.filter(
			(checkIn) => checkIn.user_id === userId,
		).length

		return HttpResponse.json({ checkInsCount })
	},
)

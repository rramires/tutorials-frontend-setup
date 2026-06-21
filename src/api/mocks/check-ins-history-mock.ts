import { http, HttpResponse } from 'msw'

import { checkIns, userIdFromAuth } from './check-ins-data'

const PAGE_SIZE = 20

export const checkInsHistoryMock = http.get(
	'/check-ins/history',
	({ request }) => {
		const userId = userIdFromAuth(request.headers.get('Authorization'))
		if (!userId) {
			return HttpResponse.json(
				{ message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		const url = new URL(request.url)
		const page = Number(url.searchParams.get('page') ?? '1')

		const mine = checkIns
			.filter((checkIn) => checkIn.user_id === userId)
			.sort((a, b) => b.created_at.localeCompare(a.created_at))

		const start = (page - 1) * PAGE_SIZE
		const paged = mine.slice(start, start + PAGE_SIZE)

		return HttpResponse.json({ checkIns: paged })
	},
)

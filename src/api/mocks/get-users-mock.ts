import { http, HttpResponse } from 'msw'

import { requireAdmin, users } from './users-data'

const PAGE_SIZE = 20

export const getUsersMock = http.get('/users', ({ request }) => {
	const denied = requireAdmin(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}

	const url = new URL(request.url)
	const page = Number(url.searchParams.get('page') ?? '1')
	const start = (page - 1) * PAGE_SIZE

	return HttpResponse.json({ users: users.slice(start, start + PAGE_SIZE) })
})

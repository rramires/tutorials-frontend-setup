import { http, HttpResponse } from 'msw'

import { gyms } from './gyms-data'

const PAGE_SIZE = 20

export const searchGymsMock = http.get('/gyms/search', ({ request }) => {
	const url = new URL(request.url)
	const query = (url.searchParams.get('query') ?? '').toLowerCase()
	const page = Number(url.searchParams.get('page') ?? '1')

	const matches = gyms.filter((gym) =>
		gym.title.toLowerCase().includes(query),
	)
	const start = (page - 1) * PAGE_SIZE
	const paged = matches.slice(start, start + PAGE_SIZE)

	return HttpResponse.json({ gyms: paged })
})

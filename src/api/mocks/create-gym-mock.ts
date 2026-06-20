import { http, HttpResponse } from 'msw'

import type { CreateGymBody } from '../create-gym'
import { gyms } from './gyms-data'

let nextId = 100

export const createGymMock = http.post<never, CreateGymBody>(
	'/gyms',
	async ({ request }) => {
		// Mirror the backend RBAC: only the admin token may create a gym.
		if (
			request.headers.get('Authorization') !==
			'Bearer mock-admin-jwt-token'
		) {
			return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
		}

		const body = await request.json()
		const gym = { id: `gym-${nextId++}`, ...body }
		gyms.push(gym)

		return HttpResponse.json({ gym }, { status: 201 })
	},
)

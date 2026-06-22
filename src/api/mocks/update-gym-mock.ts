import { http, HttpResponse } from 'msw'

import type { UpdateGymBody } from '../update-gym'
import { gyms } from './gyms-data'

export const updateGymMock = http.patch<{ gymId: string }, UpdateGymBody>(
	'/gyms/:gymId',
	async ({ request, params }) => {
		// Mirror the backend RBAC: only the admin token may edit a gym.
		if (
			request.headers.get('Authorization') !==
			'Bearer mock-admin-jwt-token'
		) {
			return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
		}

		const body = await request.json()
		if (
			body.title === undefined &&
			body.description === undefined &&
			body.phone === undefined
		) {
			return HttpResponse.json(
				{ message: 'Provide at least one field to update.' },
				{ status: 400 },
			)
		}

		const gym = gyms.find((candidate) => candidate.id === params.gymId)
		if (!gym) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		if (body.title !== undefined) {
			gym.title = body.title
		}
		if (body.description !== undefined) {
			gym.description = body.description
		}
		if (body.phone !== undefined) {
			gym.phone = body.phone
		}

		return HttpResponse.json({ gym })
	},
)

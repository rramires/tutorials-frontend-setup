import { http, HttpResponse } from 'msw'

import { gyms } from './gyms-data'

// Mock simplification: every seeded gym counts as "nearby". The real backend
// filters by a ~10km radius around the given latitude/longitude.
export const nearbyGymsMock = http.get('/gyms/nearby', () => {
	return HttpResponse.json({ gyms })
})

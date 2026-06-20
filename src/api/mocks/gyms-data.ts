import type { Gym } from '../search-gyms'

// Mock-only in-memory store. Seeded gyms cluster around São Paulo so the
// "nearby" mock has something to return; newly created gyms are pushed here.
export const gyms: Gym[] = [
	{
		id: 'gym-1',
		title: 'Iron Temple',
		description: 'Heavy lifting in the city center.',
		phone: '+5511970000001',
		latitude: -23.55,
		longitude: -46.63,
	},
	{
		id: 'gym-2',
		title: 'Aqua Fitness',
		description: 'Pool, sauna and cardio.',
		phone: null,
		latitude: -23.56,
		longitude: -46.64,
	},
	{
		id: 'gym-3',
		title: 'Zen Yoga Studio',
		description: null,
		phone: '+5511970000003',
		latitude: -23.54,
		longitude: -46.62,
	},
	{
		id: 'gym-4',
		title: 'Powerhouse Gym',
		description: 'Open 24 hours.',
		phone: '+5511970000004',
		latitude: -23.57,
		longitude: -46.65,
	},
]

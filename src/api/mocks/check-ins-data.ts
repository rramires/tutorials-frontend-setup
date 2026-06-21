import type { CheckIn } from '../get-check-ins-history'

// Mock-only in-memory store for check-ins. Maps the demo tokens to the seeded
// user ids the /auth/me mock returns, so history/metrics scope to "me".
export function userIdFromAuth(authHeader: string | null) {
	if (authHeader === 'Bearer mock-admin-jwt-token') {
		return 'mock-admin-id'
	}
	if (authHeader === 'Bearer mock-jwt-token') {
		return 'mock-user-id'
	}
	return null
}

// ISO timestamp for `n` days ago at noon (noon avoids timezone day-boundary
// flakiness when the chart buckets by calendar day).
function daysAgo(n: number) {
	const date = new Date()
	date.setDate(date.getDate() - n)
	date.setHours(12, 0, 0, 0)
	return date.toISOString()
}

let nextId = 1000

export function nextCheckInId() {
	return `check-in-${nextId++}`
}

// Seeded history for the demo member (mock-user-id). "Today" is left empty so
// the member can create a fresh check-in in the e2e flow without hitting the
// one-per-day rule. Spread across the past week so the activity chart has shape.
export const checkIns: CheckIn[] = [
	{
		id: 'check-in-1',
		created_at: daysAgo(1),
		validated_at: daysAgo(1),
		user_id: 'mock-user-id',
		gym_id: 'gym-1',
	},
	{
		id: 'check-in-2',
		created_at: daysAgo(2),
		validated_at: daysAgo(2),
		user_id: 'mock-user-id',
		gym_id: 'gym-2',
	},
	{
		id: 'check-in-3',
		created_at: daysAgo(2),
		validated_at: null,
		user_id: 'mock-user-id',
		gym_id: 'gym-1',
	},
	{
		id: 'check-in-4',
		created_at: daysAgo(4),
		validated_at: daysAgo(4),
		user_id: 'mock-user-id',
		gym_id: 'gym-3',
	},
	{
		id: 'check-in-5',
		created_at: daysAgo(6),
		validated_at: null,
		user_id: 'mock-user-id',
		gym_id: 'gym-4',
	},
]

import type { CheckIn } from '@/api/get-check-ins-history'

import { groupByDay } from './check-in-activity'

// Build a check-in whose created_at round-trips through a *local* date, so the
// test is independent of the machine timezone.
function checkInAt(
	year: number,
	month: number,
	day: number,
	hour = 12,
): CheckIn {
	return {
		id: `c-${year}-${month}-${day}-${hour}`,
		created_at: new Date(year, month, day, hour, 0, 0).toISOString(),
		validated_at: null,
		user_id: 'u1',
		gym_id: 'g1',
	}
}

describe('groupByDay', () => {
	const now = new Date(2026, 5, 20, 12) // 2026-06-20, local noon

	it('returns one bucket per day, oldest first, with today last', () => {
		const result = groupByDay([], 7, now)

		expect(result).toHaveLength(7)
		expect(result.at(-1)?.count).toBe(0)
	})

	it('counts multiple check-ins on the same day', () => {
		const checkIns = [checkInAt(2026, 5, 20, 8), checkInAt(2026, 5, 20, 20)]

		const result = groupByDay(checkIns, 7, now)

		expect(result.at(-1)?.count).toBe(2) // today
	})

	it('buckets a check-in into the right earlier day', () => {
		const result = groupByDay([checkInAt(2026, 5, 18, 10)], 7, now)

		// 2 days ago → third bucket from the end.
		expect(result.at(-3)?.count).toBe(1)
	})

	it('ignores check-ins outside the window', () => {
		const checkIns = [
			checkInAt(2026, 5, 20), // today (in)
			checkInAt(2026, 5, 1), // 19 days ago (out)
		]

		const total = groupByDay(checkIns, 7, now).reduce(
			(sum, day) => sum + day.count,
			0,
		)

		expect(total).toBe(1)
	})
})

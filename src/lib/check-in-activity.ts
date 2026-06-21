import type { CheckIn } from '@/api/get-check-ins-history'

export interface ActivityDay {
	date: string // YYYY-MM-DD (local calendar day)
	label: string // short weekday, e.g. "Mon"
	count: number
}

function dateKey(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' })

// Buckets check-ins into the last `days` calendar days (oldest first), filling
// empty days with zero so the chart shows a continuous week. Pure function —
// `now` is injectable so it can be unit-tested deterministically.
export function groupByDay(
	checkIns: CheckIn[],
	days = 7,
	now: Date = new Date(),
): ActivityDay[] {
	const buckets: ActivityDay[] = []
	const index = new Map<string, ActivityDay>()

	for (let offset = days - 1; offset >= 0; offset--) {
		const date = new Date(now)
		date.setDate(now.getDate() - offset)
		date.setHours(0, 0, 0, 0)

		const bucket: ActivityDay = {
			date: dateKey(date),
			label: weekday.format(date),
			count: 0,
		}
		buckets.push(bucket)
		index.set(bucket.date, bucket)
	}

	for (const checkIn of checkIns) {
		const bucket = index.get(dateKey(new Date(checkIn.created_at)))
		if (bucket) {
			bucket.count++
		}
	}

	return buckets
}

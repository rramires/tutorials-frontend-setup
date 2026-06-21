import { useQuery } from '@tanstack/react-query'

import { getCheckInsHistory } from '@/api/get-check-ins-history'
import { getCheckInsMetrics } from '@/api/get-check-ins-metrics'
import { useAuth } from '@/components/auth/auth-hooks'
import { groupByDay } from '@/lib/check-in-activity'

export function useHomePM() {
	const { user } = useAuth()

	const metrics = useQuery({
		queryKey: ['check-ins', 'metrics'],
		queryFn: getCheckInsMetrics,
	})

	// Page 1 of the history feeds the "recent activity" chart. It's the most
	// recent slice the current backend exposes (no all-time aggregate endpoint).
	const history = useQuery({
		queryKey: ['check-ins', 'history', 1],
		queryFn: () => getCheckInsHistory({ page: 1 }),
	})

	return {
		user,
		total: metrics.data,
		isLoadingTotal: metrics.isLoading,
		activity: groupByDay(history.data ?? []),
		isLoadingActivity: history.isLoading,
	}
}

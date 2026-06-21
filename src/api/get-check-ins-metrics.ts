import { api } from '@/lib/api'

interface MetricsResponse {
	checkInsCount: number
}

export async function getCheckInsMetrics() {
	const response = await api.get<MetricsResponse>('/check-ins/metrics')

	return response.data.checkInsCount
}

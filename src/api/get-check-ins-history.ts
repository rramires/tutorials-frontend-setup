import { api } from '@/lib/api'

export interface CheckIn {
	id: string
	created_at: string
	validated_at: string | null
	user_id: string
	gym_id: string
}

interface HistoryResponse {
	checkIns: CheckIn[]
}

export interface GetCheckInsHistoryParams {
	page?: number
}

export async function getCheckInsHistory({
	page = 1,
}: GetCheckInsHistoryParams = {}) {
	const response = await api.get<HistoryResponse>('/check-ins/history', {
		params: { page },
	})

	return response.data.checkIns
}

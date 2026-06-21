import { api } from '@/lib/api'

// Self-service: changes the current user's own username. The backend whitelist
// is username-only — role/email/is_verified can never be set here.
export interface UpdateProfileBody {
	username: string
}

export async function updateProfile(body: UpdateProfileBody) {
	await api.patch('/auth/me', body)
}

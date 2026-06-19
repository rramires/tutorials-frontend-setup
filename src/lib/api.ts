import axios from 'axios'

import { env } from '@/env'
import { getToken } from '@/lib/auth-store'

export const api = axios.create({
	baseURL: env.VITE_API_URL,
	withCredentials: true,
})

if (env.VITE_ENABLE_API_DELAY) {
	api.interceptors.request.use(async (config) => {
		await new Promise((resolve) =>
			setTimeout(resolve, 1000 + Math.round(Math.random() * 2000)),
		)

		return config
	})
}

// Attach the in-memory access token to every request.
api.interceptors.request.use((config) => {
	const token = getToken()

	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}

	return config
})

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { env } from '@/env'
import { clearToken, getToken, setToken } from '@/lib/auth-store'

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

// Single-flight refresh: concurrent 401s share one refresh call (the cookie
// rotates single-use, so a second refresh would invalidate the first).
let refreshing: Promise<string> | null = null

function refreshAccessToken() {
	if (!refreshing) {
		refreshing = api
			.patch<{ token: string }>('/auth/refresh')
			.then((response) => {
				setToken(response.data.token)

				return response.data.token
			})
			.finally(() => {
				refreshing = null
			})
	}

	return refreshing
}

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean }

// On a 401, refresh the access token once and replay the original request.
api.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const original = error.config as RetriableRequest | undefined
		const status = error.response?.status

		// Never refresh on the auth routes themselves, or we'd loop.
		const isAuthRoute =
			original?.url === '/auth/login' || original?.url === '/auth/refresh'

		if (status === 401 && original && !isAuthRoute && !original._retry) {
			original._retry = true

			try {
				const token = await refreshAccessToken()
				original.headers.Authorization = `Bearer ${token}`

				return api(original)
			} catch {
				// Refresh failed: the session is really dead.
				clearToken()
				window.location.href = '/sign-in'
			}
		}

		return Promise.reject(error)
	},
)

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'

import { verifyEmailByToken } from '@/api/verify-email'
import { useAuth } from '@/components/auth/auth-hooks'

export type VerifyEmailStatus = 'verifying' | 'success' | 'error'

export function useVerifyEmailPM() {
	const [searchParams] = useSearchParams()
	const token = searchParams.get('token')
	const auth = useAuth()
	const reloaded = useRef(false)

	const query = useQuery({
		queryKey: ['verify-email', token],
		queryFn: async () => {
			await verifyEmailByToken(token as string)
			// React Query forbids an undefined return; signal success explicitly.
			return true
		},
		enabled: Boolean(token),
		retry: false,
	})

	// Once verified, refresh the profile so the banner clears for a logged-in
	// user. Guarded so it runs a single time despite re-renders / StrictMode.
	useEffect(() => {
		if (query.isSuccess && auth.status === 'authed' && !reloaded.current) {
			reloaded.current = true
			auth.reloadUser()
		}
	}, [query.isSuccess, auth])

	const status: VerifyEmailStatus = !token
		? 'error'
		: query.isSuccess
			? 'success'
			: query.isError
				? 'error'
				: 'verifying'

	return {
		status,
		isAuthed: auth.status === 'authed',
	}
}

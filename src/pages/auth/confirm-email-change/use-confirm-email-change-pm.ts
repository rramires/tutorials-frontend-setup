import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'

import { confirmEmailChangeByToken } from '@/api/confirm-email-change'
import { useAuth } from '@/components/auth/auth-hooks'

export type ConfirmEmailChangeStatus = 'verifying' | 'success' | 'error'

export function useConfirmEmailChangePM() {
	const [searchParams] = useSearchParams()
	const token = searchParams.get('token')
	const auth = useAuth()
	const reloaded = useRef(false)

	const query = useQuery({
		queryKey: ['confirm-email-change', token],
		queryFn: async () => {
			await confirmEmailChangeByToken(token as string)
			// React Query forbids an undefined return; signal success explicitly.
			return true
		},
		enabled: Boolean(token),
		retry: false,
	})

	// Once confirmed, refresh the profile so a logged-in user sees fresh state.
	// Guarded so it runs once despite re-renders / StrictMode.
	useEffect(() => {
		if (query.isSuccess && auth.status === 'authed' && !reloaded.current) {
			reloaded.current = true
			auth.reloadUser()
		}
	}, [query.isSuccess, auth])

	const status: ConfirmEmailChangeStatus = !token
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

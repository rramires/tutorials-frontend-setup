import { type ReactNode, useEffect, useState } from 'react'

import { getProfile } from '@/api/get-profile'
import { refresh } from '@/api/refresh'
import { signOut as signOutRequest } from '@/api/sign-out'
import { clearToken, setToken } from '@/lib/auth-store'

import { AuthContext, type AuthStatus, type User } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<AuthStatus>('loading')
	const [user, setUser] = useState<User | null>(null)

	// Silent boot: restore the session from the refresh cookie, if any.
	useEffect(() => {
		async function boot() {
			try {
				const token = await refresh()
				setToken(token)

				const profile = await getProfile()
				setUser(profile)
				setStatus('authed')
			} catch {
				// No valid cookie → just a guest. Silent, no error toast.
				clearToken()
				setUser(null)
				setStatus('guest')
			}
		}

		boot()
	}, [])

	// Called after a successful login: store the token and load the profile.
	async function signIn(token: string) {
		setToken(token)

		try {
			const profile = await getProfile()
			setUser(profile)
			setStatus('authed')
		} catch (err) {
			clearToken()
			setStatus('guest')
			throw err
		}
	}

	async function signOut() {
		try {
			await signOutRequest()
		} finally {
			clearToken()
			setUser(null)
			setStatus('guest')
		}
	}

	return (
		<AuthContext.Provider value={{ status, user, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	)
}

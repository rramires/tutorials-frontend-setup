import { useNavigate } from 'react-router'

import { useAuth } from '@/components/auth/auth-hooks'

export function useAppLayoutPM() {
	const { user, signOut } = useAuth()
	const navigate = useNavigate()

	async function handleSignOut() {
		await signOut()
		navigate('/sign-in')
	}

	return {
		user,
		handleSignOut,
	}
}

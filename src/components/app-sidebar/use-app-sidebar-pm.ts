import { Dumbbell, History, LayoutDashboard, UserCog } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'

import { useAuth } from '@/components/auth/auth-hooks'

export function useAppSidebarPM() {
	const { user, signOut } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()

	// Main nav: available to everyone (Account included — it acts on yourself).
	const items = [
		{ to: '/', label: 'Dashboard', icon: LayoutDashboard },
		{ to: '/gyms', label: 'Gyms', icon: Dumbbell },
		{ to: '/check-ins', label: 'Check-ins', icon: History },
		{ to: '/account', label: 'Account', icon: UserCog },
	]

	async function handleSignOut() {
		await signOut()
		navigate('/sign-in')
	}

	return {
		user,
		items,
		pathname: location.pathname,
		handleSignOut,
	}
}

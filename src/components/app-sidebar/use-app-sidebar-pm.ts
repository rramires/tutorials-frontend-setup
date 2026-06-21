import { Dumbbell, History, LayoutDashboard, Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'

import { useAuth } from '@/components/auth/auth-hooks'

export function useAppSidebarPM() {
	const { user, signOut } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()

	// Nav items by role: the "New gym" item only exists for admins. The route
	// itself is still guarded (defense in depth) — hiding the link is just UX.
	const items = [
		{ to: '/', label: 'Dashboard', icon: LayoutDashboard },
		{ to: '/gyms', label: 'Gyms', icon: Dumbbell },
		{ to: '/check-ins', label: 'Check-ins', icon: History },
		...(user?.role === 'ADMIN'
			? [{ to: '/gyms/new', label: 'New gym', icon: Plus }]
			: []),
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

import { Dumbbell, History, LayoutDashboard, Plus, Users } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'

import { useAuth } from '@/components/auth/auth-hooks'

export function useAppSidebarPM() {
	const { user, signOut } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()

	// Main nav: the gym-domain features. Account is self-service (about you), so
	// it lives in the footer next to your identity — not here.
	const items = [
		{ to: '/', label: 'Dashboard', icon: LayoutDashboard },
		{ to: '/gyms', label: 'Gyms', icon: Dumbbell },
		{ to: '/check-ins', label: 'Check-ins', icon: History },
	]

	// Admin nav: a separate, labelled group, only built for admins. The routes
	// are still guarded (defense in depth) — hiding the links is just UX.
	const adminItems =
		user?.role === 'ADMIN'
			? [
					{ to: '/gyms/new', label: 'New gym', icon: Plus },
					{ to: '/admin/users', label: 'Users', icon: Users },
				]
			: []

	async function handleSignOut() {
		await signOut()
		navigate('/sign-in')
	}

	return {
		user,
		items,
		adminItems,
		pathname: location.pathname,
		handleSignOut,
	}
}

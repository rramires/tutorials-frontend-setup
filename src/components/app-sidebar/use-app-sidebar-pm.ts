import {
	Dumbbell,
	History,
	LayoutDashboard,
	Plus,
	UserCog,
	Users,
} from 'lucide-react'
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

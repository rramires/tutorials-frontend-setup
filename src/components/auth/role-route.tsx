import { LoaderCircle } from 'lucide-react'
import { Outlet } from 'react-router'

import { type Role } from './auth-context'
import { useAuth } from './auth-hooks'
import { Forbidden } from './forbidden'

// Sits *inside* ProtectedRoute (so the user is already authed). Renders the
// child route only when the user's role is allowed; otherwise shows Forbidden
// in place — the surrounding layout (sidebar, header) stays put.
export function RoleRoute({ allow }: { allow: Role[] }) {
	const { status, user } = useAuth()

	if (status === 'loading') {
		return (
			<div className='flex flex-1 items-center justify-center p-8'>
				<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
			</div>
		)
	}

	if (!user || !allow.includes(user.role)) {
		return <Forbidden />
	}

	return <Outlet />
}

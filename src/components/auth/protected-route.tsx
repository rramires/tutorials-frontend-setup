import { LoaderCircle } from 'lucide-react'
import { Navigate, Outlet } from 'react-router'

import { useAuth } from './auth-hooks'

export function ProtectedRoute() {
	const { status } = useAuth()

	if (status === 'loading') {
		return (
			<div className='flex h-screen items-center justify-center'>
				<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
			</div>
		)
	}

	if (status === 'guest') {
		return <Navigate to='/sign-in' replace />
	}

	return <Outlet />
}

import { useNavigate } from 'react-router'

import { useAuth } from '@/components/auth/auth-hooks'
import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'

export function Home() {
	const { user, signOut } = useAuth()
	const navigate = useNavigate()

	async function handleSignOut() {
		await signOut()
		navigate('/sign-in')
	}

	return (
		<>
			<PageTitle title='Home' />
			<div className='flex flex-1 flex-col items-start gap-4 px-8 py-4'>
				<h2 className='text-2xl font-medium'>
					Welcome, {user?.username}!
				</h2>
				<Button variant='outline' onClick={handleSignOut}>
					Sign out
				</Button>
			</div>
		</>
	)
}

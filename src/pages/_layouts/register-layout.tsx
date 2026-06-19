import { ArrowLeft, GlobeCheck } from 'lucide-react'
import { Link, Outlet } from 'react-router'

import { ModeToggle } from '@/components/theme/mode-toggle'
import { Button } from '@/components/ui/button'

export function RegisterLayout() {
	return (
		<div className='bg-background text-foreground flex h-screen flex-col'>
			<header className='flex h-20 items-center justify-between border-b px-8'>
				<div className='flex items-center gap-2'>
					<GlobeCheck className='text-primary size-8' />
					<h1 className='text-2xl font-bold'>Gympass Sample App</h1>
				</div>
				<div className='flex items-center gap-4'>
					<Button asChild variant='outline' size='sm'>
						<Link to='/sign-in'>
							<ArrowLeft />
							Back to sign in
						</Link>
					</Button>
					<ModeToggle />
				</div>
			</header>
			<main className='flex flex-1'>
				<Outlet />
			</main>
			<footer className='flex h-8 items-center border-t pl-8'></footer>
		</div>
	)
}

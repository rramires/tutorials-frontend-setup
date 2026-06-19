import { GlobeCheck, LogOut } from 'lucide-react'
import { Outlet } from 'react-router'

import { ModeToggle } from '@/components/theme/mode-toggle'
import { Button } from '@/components/ui/button'

import { useAppLayoutPM } from './use-app-layout-pm'

export function AppLayout() {
	const pm = useAppLayoutPM()

	return (
		<div className='bg-background text-foreground flex h-screen flex-col'>
			<header className='flex h-20 items-center justify-between border-b px-8'>
				<div className='flex items-center gap-2'>
					<GlobeCheck className='text-primary size-8' />
					<h1 className='text-2xl font-bold'>Gympass Sample App</h1>
				</div>
				<div className='flex items-center gap-4'>
					<span className='text-muted-foreground text-sm'>
						Welcome, {pm.user?.username}!
					</span>
					<Button
						variant='outline'
						size='sm'
						onClick={pm.handleSignOut}
					>
						<LogOut />
						Sign out
					</Button>
					<ModeToggle />
				</div>
			</header>
			<main className='flex flex-1'>
				<Outlet />
			</main>
			<footer className='text-muted-foreground flex h-12 items-center border-t px-8'>
				<p>AppLayout Footer</p>
			</footer>
		</div>
	)
}

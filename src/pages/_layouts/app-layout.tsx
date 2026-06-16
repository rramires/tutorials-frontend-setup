import { Outlet } from 'react-router'

import { ModeToggle } from '@/components/theme/mode-toggle'

export function AppLayout() {
	return (
		<div className='bg-background text-foreground flex h-screen flex-col'>
			<header className='flex h-20 items-center justify-between border-b px-8'>
				<h1 className='text-3xl font-bold'>AppLayout Header</h1>
				<ModeToggle />
			</header>
			<main className='flex flex-1'>
				{/* Content will change here */}
				<Outlet />
			</main>
			<footer className='text-muted-foreground flex h-12 items-center border-t px-8'>
				<p>AppLayout Footer</p>
			</footer>
		</div>
	)
}

import { Outlet } from 'react-router'

export function AuthLayout() {
	return (
		<div className='bg-background text-foreground flex h-screen flex-col'>
			<header className='flex h-8 items-center border-b pl-8'></header>
			<main className='flex flex-1'>
				{/* Content will change here */}
				<Outlet />
			</main>
			<footer className='flex h-8 items-center border-t pl-8'></footer>
		</div>
	)
}

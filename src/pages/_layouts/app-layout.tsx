import { Outlet } from 'react-router'

export function AppLayout() {
	return (
		<div className='flex h-screen flex-col'>
			<header className='flex h-20 items-center bg-slate-800 pl-8 text-slate-200'>
				<h1 className='text-3xl font-bold'>AppLayout Header</h1>
			</header>
			<main className='flex flex-1'>
				{/* Content will change here */}
				<Outlet />
			</main>
			<footer className='flex h-12 items-center bg-slate-800 pl-8 text-slate-200'>
				<p>AppLayout Footer</p>
			</footer>
		</div>
	)
}

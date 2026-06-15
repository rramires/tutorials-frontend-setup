import { Outlet } from 'react-router'

export function AuthLayout() {
	return (
		<div className='flex h-screen flex-col'>
			<header className='flex h-8 items-center bg-slate-800 pl-8 text-slate-200'></header>
			<main className='flex flex-1'>
				{/* Content will change here */}
				<Outlet />
			</main>
			<footer className='flex h-8 items-center bg-slate-800 pl-8 text-slate-200'></footer>
		</div>
	)
}

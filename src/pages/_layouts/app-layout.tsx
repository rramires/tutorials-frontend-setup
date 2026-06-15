import { Outlet } from 'react-router'

export function AppLayout() {
	return (
		<>
			<header>
				<h1>AppLayout Header</h1>
			</header>
			<main>
				{/* Content will change here */}
				<Outlet />
			</main>
			<footer>
				<p>AppLayout Footer</p>
			</footer>
		</>
	)
}

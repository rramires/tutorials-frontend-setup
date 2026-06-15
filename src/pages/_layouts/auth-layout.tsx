import { Outlet } from 'react-router'

export function AuthLayout() {
	return (
		<>
			<header>
				<h1>AuthLayout Header</h1>
			</header>
			<main>
				{/* Content will change here */}
				<Outlet />
			</main>
			<footer>
				<p>AuthLayout Footer</p>
			</footer>
		</>
	)
}

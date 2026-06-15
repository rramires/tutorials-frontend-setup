import { Outlet } from 'react-router'

export function RegisterLayout() {
	return (
		<>
			<header>
				<h1>RegisterLayout Header</h1>
			</header>
			<main>
				{/* Content will change here */}
				<Outlet />
			</main>
			<footer>
				<p>RegisterLayout Footer</p>
			</footer>
		</>
	)
}

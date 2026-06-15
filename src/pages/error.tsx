import { useRouteError } from 'react-router'

interface RouteError {
	statusText?: string
	message?: string
}

export function ErrorPage() {
	const error = useRouteError() as RouteError
	console.error(error)

	return (
		<div id='error-page'>
			<h1>Oops!</h1>
			<p>Desculpe, ocorreu um erro.</p>
			<p>
				<i>{error.statusText || error.message}</i>
			</p>
		</div>
	)
}

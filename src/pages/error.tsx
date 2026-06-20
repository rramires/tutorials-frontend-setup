import { useRouteError } from 'react-router'

import { PageTitle } from '@/components/title/page-title'

interface RouteError {
	statusText?: string
	message?: string
}

export function ErrorPage() {
	const error = useRouteError() as RouteError
	console.error(error)

	return (
		<>
			<PageTitle title='Error' />
			<div
				id='error-page'
				className='bg-background text-foreground flex h-screen flex-col items-center justify-center p-8'
			>
				<h1 className='text-3xl font-bold'>Oops!</h1>
				<p className='text-muted-foreground pt-1'>
					Sorry, an error occurred:
				</p>
				<p className='pt-3'>
					<i className='text-destructive'>
						{error.statusText || error.message}
					</i>
				</p>
			</div>
		</>
	)
}

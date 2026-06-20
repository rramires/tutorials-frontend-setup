import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'

export function NotFound() {
	return (
		<>
			<PageTitle title='Not Found' />
			<div className='bg-background text-foreground flex h-screen flex-col items-center justify-center p-8'>
				<h1 className='text-3xl font-bold'>404 - Page not found</h1>
				<p className='text-muted-foreground pt-3'>
					<Link
						to='/'
						className='hover:text-foreground hover:underline'
					>
						Return to homepage
					</Link>
				</p>
			</div>
		</>
	)
}

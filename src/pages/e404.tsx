import { PageTitle } from '@/components/title/page-title'

export function NotFound() {
	return (
		<>
			<PageTitle title='Not Found' />
			<div className='flex h-screen flex-col items-center justify-center bg-slate-900 p-8 text-slate-100'>
				<h1 className='text-3xl font-bold'>404 - Page not found</h1>
				<h3 className='pt-3 font-bold text-slate-500'>
					<a
						className='hover: :hover:text-slate-100 ml-1 hover:underline'
						href='/'
					>
						Return to homepage
					</a>
				</h3>
			</div>
		</>
	)
}

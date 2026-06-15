import { PageTitle } from '@/components/title/page-title'

export function Home() {
	// throw new Error('Error simulation on the Home page.')
	return (
		<>
			<PageTitle title='Home' />
			<div className='flex-1 bg-slate-900 px-8 py-4 text-slate-100'>
				<h2 className='text-2xl font-medium'>Home Page!</h2>
			</div>
		</>
	)
}

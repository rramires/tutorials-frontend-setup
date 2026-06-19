import { PageTitle } from '@/components/title/page-title'

export function Home() {
	return (
		<>
			<PageTitle title='Home' />
			<div className='flex-1 px-8 py-4'>
				<h2 className='text-2xl font-medium'>Home Page!</h2>
			</div>
		</>
	)
}

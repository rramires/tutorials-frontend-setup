import { LoaderCircle } from 'lucide-react'

import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { GymCard } from './gym-card'
import { useGymsPM } from './use-gyms-pm'

export function Gyms() {
	const pm = useGymsPM()

	return (
		<>
			<PageTitle title='Gyms' />

			<div className='flex flex-1 flex-col gap-6 p-8'>
				<div>
					<h2 className='text-2xl font-medium'>Gyms</h2>
					<p className='text-muted-foreground text-sm'>
						Find a gym near you, or search by name.
					</p>
				</div>

				<Input
					placeholder='Search gyms by name…'
					value={pm.query}
					onChange={(event) =>
						pm.handleQueryChange(event.target.value)
					}
					className='max-w-md'
				/>

				{pm.status === 'geo-denied' && (
					<p className='text-muted-foreground text-sm'>
						Couldn&apos;t get your location — search by name above.
					</p>
				)}

				{pm.status === 'locating' && (
					<div className='text-muted-foreground flex items-center gap-2 text-sm'>
						<LoaderCircle className='size-4 animate-spin' />
						Finding gyms near you…
					</div>
				)}

				{pm.status === 'loading' && (
					<div className='text-muted-foreground flex items-center gap-2 text-sm'>
						<LoaderCircle className='size-4 animate-spin' />
						Loading gyms…
					</div>
				)}

				{pm.status === 'empty' && (
					<p className='text-muted-foreground text-sm'>
						{pm.searching
							? 'No gyms match your search.'
							: 'No gyms found near you.'}
					</p>
				)}

				{pm.status === 'list' && (
					<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{pm.gyms.map((gym) => (
							<GymCard key={gym.id} gym={gym} />
						))}
					</div>
				)}

				{pm.searching && (pm.hasPrevPage || pm.hasNextPage) && (
					<div className='flex items-center gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={pm.prevPage}
							disabled={!pm.hasPrevPage}
						>
							Previous
						</Button>
						<span className='text-muted-foreground text-sm'>
							Page {pm.page}
						</span>
						<Button
							variant='outline'
							size='sm'
							onClick={pm.nextPage}
							disabled={!pm.hasNextPage}
						>
							Next
						</Button>
					</div>
				)}
			</div>
		</>
	)
}

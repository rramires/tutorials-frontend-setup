import { CircleCheck, Clock, LoaderCircle } from 'lucide-react'

import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { useCheckInsPM } from './use-check-ins-pm'

export function CheckIns() {
	const pm = useCheckInsPM()

	return (
		<>
			<PageTitle title='Check-ins' />

			<div className='flex flex-1 flex-col gap-6 p-8'>
				<div>
					<h2 className='text-2xl font-medium'>Check-ins</h2>
					<p className='text-muted-foreground text-sm'>
						Your recent gym check-ins.
					</p>
				</div>

				{pm.status === 'loading' && (
					<div className='text-muted-foreground flex items-center gap-2 text-sm'>
						<LoaderCircle className='size-4 animate-spin' />
						Loading check-ins…
					</div>
				)}

				{pm.status === 'empty' && (
					<p className='text-muted-foreground text-sm'>
						No check-ins yet — check in from the Gyms page.
					</p>
				)}

				{pm.status === 'list' && (
					<ul className='divide-y rounded-md border'>
						{pm.items.map((item) => (
							<li
								key={item.id}
								className='flex items-center justify-between gap-4 p-4'
							>
								<div className='flex items-center gap-3'>
									{item.validated ? (
										<CircleCheck className='size-5 shrink-0 text-emerald-600' />
									) : (
										<Clock className='text-muted-foreground size-5 shrink-0' />
									)}
									<span className='text-sm'>{item.date}</span>
								</div>

								<div className='flex items-center gap-3'>
									<Badge
										variant={
											item.validated ? 'default' : 'outline'
										}
									>
										{item.validated ? 'Validated' : 'Pending'}
									</Badge>

									{pm.isAdmin && !item.validated && (
										<Button
											size='sm'
											variant='outline'
											disabled={pm.validatingId === item.id}
											onClick={() =>
												pm.validateCheckIn(item.id)
											}
										>
											{pm.validatingId === item.id ? (
												<LoaderCircle className='size-4 animate-spin' />
											) : null}
											Validate
										</Button>
									)}
								</div>
							</li>
						))}
					</ul>
				)}

				{pm.status === 'list' && (pm.hasPrevPage || pm.hasNextPage) && (
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

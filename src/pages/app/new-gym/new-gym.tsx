import { Crosshair } from 'lucide-react'

import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useNewGymPM } from './use-new-gym-pm'

export function NewGym() {
	const pm = useNewGymPM()

	return (
		<>
			<PageTitle title='New gym' />

			<div className='flex flex-1 justify-center p-8'>
				<Card className='w-full max-w-lg'>
					<CardHeader>
						<CardTitle>New gym</CardTitle>
						<CardDescription>
							Register a gym members can check in to.
						</CardDescription>
					</CardHeader>

					<CardContent>
						<form onSubmit={pm.handleSubmit} noValidate>
							<div className='flex flex-col gap-6'>
								<div className='grid gap-2'>
									<Label htmlFor='title'>Title</Label>
									<Input
										id='title'
										{...pm.register('title')}
									/>
									{pm.errors.title && (
										<p className='text-destructive text-sm'>
											{pm.errors.title.message}
										</p>
									)}
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='description'>
										Description
									</Label>
									<Input
										id='description'
										{...pm.register('description')}
									/>
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='phone'>Phone</Label>
									<Input
										id='phone'
										{...pm.register('phone')}
									/>
									{pm.errors.phone && (
										<p className='text-destructive text-sm'>
											{pm.errors.phone.message}
										</p>
									)}
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div className='grid gap-2'>
										<Label htmlFor='latitude'>
											Latitude
										</Label>
										<Input
											id='latitude'
											{...pm.register('latitude')}
										/>
										{pm.errors.latitude && (
											<p className='text-destructive text-sm'>
												{pm.errors.latitude.message}
											</p>
										)}
									</div>
									<div className='grid gap-2'>
										<Label htmlFor='longitude'>
											Longitude
										</Label>
										<Input
											id='longitude'
											{...pm.register('longitude')}
										/>
										{pm.errors.longitude && (
											<p className='text-destructive text-sm'>
												{pm.errors.longitude.message}
											</p>
										)}
									</div>
								</div>

								<Button
									type='button'
									variant='outline'
									onClick={pm.handleUseMyLocation}
									disabled={pm.locating}
								>
									<Crosshair />
									Use my current location
								</Button>

								<Button
									type='submit'
									disabled={pm.isSubmitting}
									className='w-full'
								>
									Create gym
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	)
}

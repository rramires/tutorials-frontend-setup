import { Pencil } from 'lucide-react'

import type { Gym } from '@/api/search-gyms'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useEditGymPM } from './use-edit-gym-pm'

export function EditGymDialog({ gym }: { gym: Gym }) {
	const pm = useEditGymPM(gym)

	return (
		<Dialog open={pm.open} onOpenChange={pm.onOpenChange}>
			<DialogTrigger asChild>
				<Button variant='outline' className='w-full'>
					<Pencil className='size-4' />
					Edit
				</Button>
			</DialogTrigger>

			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Edit gym</DialogTitle>
					<DialogDescription>
						Update this gym's details. Location can't be changed.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={pm.handleSubmit} noValidate>
					<div className='flex flex-col gap-6'>
						<div className='grid gap-2'>
							<Label htmlFor='edit-title'>Title</Label>
							<Input id='edit-title' {...pm.register('title')} />
							{pm.errors.title && (
								<p className='text-destructive text-sm'>
									{pm.errors.title.message}
								</p>
							)}
						</div>

						<div className='grid gap-2'>
							<Label htmlFor='edit-description'>
								Description
							</Label>
							<Input
								id='edit-description'
								{...pm.register('description')}
							/>
						</div>

						<div className='grid gap-2'>
							<Label htmlFor='edit-phone'>Phone</Label>
							<Input id='edit-phone' {...pm.register('phone')} />
							{pm.errors.phone && (
								<p className='text-destructive text-sm'>
									{pm.errors.phone.message}
								</p>
							)}
						</div>

						<DialogFooter>
							<Button
								type='submit'
								disabled={pm.isSubmitting}
								className='w-full'
							>
								Save changes
							</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

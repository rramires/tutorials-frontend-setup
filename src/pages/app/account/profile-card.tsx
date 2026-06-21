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

import { useProfileCardPM } from './use-profile-card-pm'

export function ProfileCard() {
	const pm = useProfileCardPM()

	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile</CardTitle>
				<CardDescription>Update your account username.</CardDescription>
			</CardHeader>

			<CardContent>
				<form onSubmit={pm.handleSubmit} noValidate>
					<div className='flex flex-col gap-6'>
						<div className='grid gap-2'>
							<Label htmlFor='username'>Username</Label>
							<Input id='username' {...pm.register('username')} />
							{pm.errors.username && (
								<p className='text-destructive text-sm'>
									{pm.errors.username.message}
								</p>
							)}
						</div>

						<Button
							type='submit'
							disabled={pm.isSubmitting || !pm.isDirty}
							className='w-full'
						>
							Save
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}

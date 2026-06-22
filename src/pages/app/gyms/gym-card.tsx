import { CircleCheck, LoaderCircle, MapPin, Phone } from 'lucide-react'

import type { Gym } from '@/api/search-gyms'
import { useAuth } from '@/components/auth/auth-hooks'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useCheckIn } from '@/hooks/use-check-in'

import { EditGymDialog } from './edit-gym-dialog'

export function GymCard({ gym }: { gym: Gym }) {
	const { handleCheckIn, isCheckingIn } = useCheckIn()
	const { user } = useAuth()
	const isAdmin = user?.role === 'ADMIN'

	return (
		<Card className='flex flex-col'>
			<CardHeader>
				<CardTitle>{gym.title}</CardTitle>
				{gym.description && (
					<CardDescription>{gym.description}</CardDescription>
				)}
			</CardHeader>
			<CardContent className='text-muted-foreground flex-1 space-y-1 text-sm'>
				<div className='flex items-center gap-2'>
					<MapPin className='size-4 shrink-0' />
					<span>
						{gym.latitude.toFixed(4)}, {gym.longitude.toFixed(4)}
					</span>
				</div>
				{gym.phone && (
					<div className='flex items-center gap-2'>
						<Phone className='size-4 shrink-0' />
						<span>{gym.phone}</span>
					</div>
				)}
			</CardContent>
			<CardFooter className='flex-col gap-2'>
				<Button
					variant='outline'
					className='w-full'
					disabled={isCheckingIn}
					onClick={() => handleCheckIn(gym.id)}
				>
					{isCheckingIn ? (
						<LoaderCircle className='size-4 animate-spin' />
					) : (
						<CircleCheck className='size-4' />
					)}
					Check in
				</Button>

				{/* Editing a gym is an ADMIN-only action (the route-level guard
				    still protects the API; hiding the button is just UX). */}
				{isAdmin && <EditGymDialog gym={gym} />}
			</CardFooter>
		</Card>
	)
}

import { CircleCheck, LoaderCircle, MapPin, Phone } from 'lucide-react'

import type { Gym } from '@/api/search-gyms'
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

export function GymCard({ gym }: { gym: Gym }) {
	const { handleCheckIn, isCheckingIn } = useCheckIn()

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
			<CardFooter>
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
			</CardFooter>
		</Card>
	)
}

import { MapPin, Phone } from 'lucide-react'

import type { Gym } from '@/api/search-gyms'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

export function GymCard({ gym }: { gym: Gym }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{gym.title}</CardTitle>
				{gym.description && (
					<CardDescription>{gym.description}</CardDescription>
				)}
			</CardHeader>
			<CardContent className='text-muted-foreground space-y-1 text-sm'>
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
		</Card>
	)
}

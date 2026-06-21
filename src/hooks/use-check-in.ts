import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

import { createCheckIn } from '@/api/create-check-in'
import { getCurrentPosition } from '@/lib/geolocation'

// Reusable check-in action: reads the browser's location, posts the check-in,
// then invalidates the check-in queries so the history page and the dashboard
// (metrics + recent activity) refetch. One hook instance per call site, so a
// card's own button is the only one that shows a pending state.
export function useCheckIn() {
	const queryClient = useQueryClient()
	const [locating, setLocating] = useState(false)

	const { mutateAsync, isPending } = useMutation({
		mutationFn: createCheckIn,
	})

	async function handleCheckIn(gymId: string) {
		setLocating(true)
		let position
		try {
			position = await getCurrentPosition()
		} catch {
			toast.error('Could not get your location.')
			return
		} finally {
			setLocating(false)
		}

		try {
			await mutateAsync({
				gymId,
				latitude: position.latitude,
				longitude: position.longitude,
			})
			toast.success('Checked in!')
			await queryClient.invalidateQueries({ queryKey: ['check-ins'] })
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not check in.'
			toast.error(message)
		}
	}

	return {
		handleCheckIn,
		isCheckingIn: locating || isPending,
	}
}

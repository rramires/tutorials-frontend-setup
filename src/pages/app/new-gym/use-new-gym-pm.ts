import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { createGym } from '@/api/create-gym'
import { getCurrentPosition } from '@/lib/geolocation'

// Mirrors the backend: title required; description/phone optional; phone must
// match the API's loose phone pattern; coordinates are required, in range.
const phonePattern = /^\+?[\d\s().-]{7,20}$/

function coordinate(label: string, max: number) {
	return z
		.string()
		.min(1, `${label} is required.`)
		.refine((value) => {
			const parsed = Number(value)
			return !Number.isNaN(parsed) && parsed >= -max && parsed <= max
		}, `Enter a valid ${label.toLowerCase()}.`)
}

const newGymForm = z.object({
	title: z.string().min(1, 'Title is required.'),
	description: z.string(),
	phone: z
		.string()
		.regex(phonePattern, 'Enter a valid phone number.')
		.or(z.literal('')),
	latitude: coordinate('Latitude', 90),
	longitude: coordinate('Longitude', 180),
})
type NewGymForm = z.infer<typeof newGymForm>

export function useNewGymPM() {
	const navigate = useNavigate()
	const [locating, setLocating] = useState(false)

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<NewGymForm>({
		resolver: zodResolver(newGymForm),
		defaultValues: {
			title: '',
			description: '',
			phone: '',
			latitude: '',
			longitude: '',
		},
	})

	const { mutateAsync: submitGym } = useMutation({ mutationFn: createGym })

	async function handleUseMyLocation() {
		setLocating(true)
		try {
			const position = await getCurrentPosition()
			setValue('latitude', String(position.latitude))
			setValue('longitude', String(position.longitude))
		} catch {
			toast.error('Could not get your location.')
		} finally {
			setLocating(false)
		}
	}

	async function onSubmit(data: NewGymForm) {
		try {
			const gym = await submitGym({
				title: data.title,
				description: data.description || null,
				phone: data.phone || null,
				latitude: Number(data.latitude),
				longitude: Number(data.longitude),
			})
			toast.success(`Gym "${gym.title}" created.`)
			navigate('/gyms')
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not create the gym.'
			toast.error(message)
		}
	}

	return {
		register,
		errors,
		isSubmitting,
		locating,
		handleUseMyLocation,
		handleSubmit: handleSubmit(onSubmit),
	}
}

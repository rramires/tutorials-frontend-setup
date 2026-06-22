import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { Gym } from '@/api/search-gyms'
import { updateGym, type UpdateGymBody } from '@/api/update-gym'

// Mirrors the backend's editable fields — no latitude/longitude (fixed at
// creation). Same phone pattern as the create form.
const phonePattern = /^\+?[\d\s().-]{7,20}$/

const editGymForm = z.object({
	title: z.string().min(1, 'Title is required.'),
	description: z.string(),
	phone: z
		.string()
		.regex(phonePattern, 'Enter a valid phone number.')
		.or(z.literal('')),
})
type EditGymForm = z.infer<typeof editGymForm>

export function useEditGymPM(gym: Gym) {
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<EditGymForm>({
		resolver: zodResolver(editGymForm),
		defaultValues: {
			title: gym.title,
			description: gym.description ?? '',
			phone: gym.phone ?? '',
		},
	})

	function onOpenChange(next: boolean) {
		// Reset to the gym's current values each time the dialog opens.
		if (next) {
			reset({
				title: gym.title,
				description: gym.description ?? '',
				phone: gym.phone ?? '',
			})
		}
		setOpen(next)
	}

	const { mutateAsync: saveGym } = useMutation({
		mutationFn: (body: UpdateGymBody) => updateGym(gym.id, body),
	})

	async function onSubmit(data: EditGymForm) {
		try {
			const updated = await saveGym({
				title: data.title,
				description: data.description || null,
				phone: data.phone || null,
			})
			toast.success(`Gym "${updated.title}" updated.`)
			// Refetch the nearby/search lists so the card reflects the change.
			await queryClient.invalidateQueries({ queryKey: ['gyms'] })
			setOpen(false)
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not update the gym.'
			toast.error(message)
		}
	}

	return {
		open,
		onOpenChange,
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}

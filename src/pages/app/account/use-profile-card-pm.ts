import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { updateProfile } from '@/api/update-profile'
import { useAuth } from '@/components/auth/auth-hooks'

// Mirrors the backend: 3-30 chars, letters/numbers/underscore only.
const usernamePattern = /^[a-zA-Z0-9_]+$/

const profileForm = z.object({
	username: z
		.string()
		.min(3, 'Minimum of 3 characters.')
		.max(30, 'Maximum of 30 characters.')
		.regex(usernamePattern, 'Letters, numbers and underscore only.'),
})
type ProfileForm = z.infer<typeof profileForm>

export function useProfileCardPM() {
	const auth = useAuth()

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting, isDirty },
	} = useForm<ProfileForm>({
		resolver: zodResolver(profileForm),
		defaultValues: { username: auth.user?.username ?? '' },
	})

	const { mutateAsync: saveProfile } = useMutation({
		mutationFn: updateProfile,
	})

	async function onSubmit(data: ProfileForm) {
		try {
			await saveProfile({ username: data.username })
			// Refetch the profile so the sidebar (and the rest of the app) pick
			// up the new username.
			await auth.reloadUser()
			toast.success('Profile updated.')
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not update your profile.'
			toast.error(message)
		}
	}

	return {
		register,
		errors,
		isSubmitting,
		isDirty,
		handleSubmit: handleSubmit(onSubmit),
	}
}

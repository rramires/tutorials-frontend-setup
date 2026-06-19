import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { resetPassword } from '@/api/reset-password'
import { env } from '@/env'

const passwordMin = env.VITE_PASSWORD_MIN_LENGTH
const passwordPattern = new RegExp(env.VITE_PASSWORD_PATTERN)
const passwordMessage = env.VITE_PASSWORD_MESSAGE

const resetForm = z
	.object({
		password: z
			.string()
			.min(passwordMin, `Minimum of ${passwordMin} characters.`)
			.max(72, 'Maximum of 72 characters.')
			.regex(passwordPattern, passwordMessage),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match.',
		path: ['confirmPassword'],
	})
type ResetForm = z.infer<typeof resetForm>

export function useResetPasswordPM() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const token = searchParams.get('token')

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ResetForm>({ resolver: zodResolver(resetForm) })

	const { mutateAsync: confirmReset } = useMutation({
		mutationFn: resetPassword,
	})

	async function onSubmit(data: ResetForm) {
		if (!token) {
			return
		}

		try {
			await confirmReset({ token, newPassword: data.password })
			toast.success('Password reset. You can sign in now.')
			navigate('/sign-in')
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error('Too many attempts. Please wait a moment.')
				return
			}
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not reset password. The link may have expired.'
			toast.error(message)
		}
	}

	return {
		hasToken: Boolean(token),
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { registerAccount } from '@/api/register'
import { env } from '@/env'

const passwordMin = env.VITE_PASSWORD_MIN_LENGTH
const passwordPattern = new RegExp(env.VITE_PASSWORD_PATTERN)
const passwordMessage = env.VITE_PASSWORD_MESSAGE

const registerForm = z
	.object({
		username: z
			.string()
			.min(3, 'Minimum of 3 characters.')
			.max(30, 'Maximum of 30 characters.')
			.regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscore only.')
			.transform((s) => s.toLowerCase()),
		email: z.email('Enter a valid email.'),
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

type RegisterForm = z.infer<typeof registerForm>

export function useRegisterPM() {
	const navigate = useNavigate()

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterForm>({
		resolver: zodResolver(registerForm),
	})

	const { mutateAsync: createAccount } = useMutation({
		mutationFn: registerAccount,
	})

	async function onSubmit({ username, email, password }: RegisterForm) {
		try {
			await createAccount({ username, email, password })
			toast.success('Account created. You can sign in now.')
			navigate('/sign-in')
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not create account.'
			toast.error(message)
		}
	}

	return {
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}

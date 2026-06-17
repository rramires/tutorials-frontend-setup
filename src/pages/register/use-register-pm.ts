import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const passwordMin = Number(import.meta.env.VITE_PASSWORD_MIN_LENGTH)
const passwordPattern = new RegExp(import.meta.env.VITE_PASSWORD_PATTERN)
const passwordMessage = import.meta.env.VITE_PASSWORD_MESSAGE

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
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterForm>({
		resolver: zodResolver(registerForm),
	})

	function onSubmit(data: RegisterForm) {
		// no backend yet - here I would call a registration service
		console.log(data)
	}

	return {
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}

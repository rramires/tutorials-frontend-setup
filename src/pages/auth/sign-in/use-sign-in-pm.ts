import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const signInForm = z.object({
	identifier: z.string().min(1, 'Enter your email or username.'),
	password: z
		.string()
		.min(1, 'Password is required.')
		.max(72, 'Maximum of 72 characters.'),
})

type SignInForm = z.infer<typeof signInForm>

export function useSignInPM() {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignInForm>({
		resolver: zodResolver(signInForm),
	})

	function onSubmit(data: SignInForm) {
		// No backend yet - here I would call an authentication service
		console.log(data)
	}

	return {
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}

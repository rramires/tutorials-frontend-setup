import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { signIn } from '@/api/sign-in'

const signInForm = z.object({
	identifier: z.string().min(1, 'Enter your email or username.'),
	password: z
		.string()
		.min(1, 'Password is required.')
		.max(72, 'Maximum of 72 characters.'),
})

type SignInForm = z.infer<typeof signInForm>

export function useSignInPM() {
	const navigate = useNavigate()

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignInForm>({
		resolver: zodResolver(signInForm),
	})

	const { mutateAsync: authenticate } = useMutation({
		mutationFn: signIn,
	})

	async function onSubmit(data: SignInForm) {
		try {
			await authenticate(data)
			toast.success('Signed in successfully.')
			navigate('/')
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not sign in.'
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

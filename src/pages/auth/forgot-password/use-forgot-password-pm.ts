import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { forgotPassword } from '@/api/forgot-password'
import { resetPassword } from '@/api/reset-password'
import { env } from '@/env'

const passwordMin = env.VITE_PASSWORD_MIN_LENGTH
const passwordPattern = new RegExp(env.VITE_PASSWORD_PATTERN)
const passwordMessage = env.VITE_PASSWORD_MESSAGE

const requestForm = z.object({
	email: z.email('Enter a valid email.'),
})
type RequestForm = z.infer<typeof requestForm>

const resetForm = z
	.object({
		code: z.string().length(6, 'Enter the 6-digit code.'),
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

export function useForgotPasswordPM() {
	const navigate = useNavigate()
	const [step, setStep] = useState<'request' | 'reset'>('request')
	const [email, setEmail] = useState('')

	const {
		register,
		handleSubmit: submitRequest,
		formState: { errors, isSubmitting },
	} = useForm<RequestForm>({ resolver: zodResolver(requestForm) })

	const {
		register: resetRegister,
		control: resetControl,
		handleSubmit: submitReset,
		formState: { errors: resetErrors, isSubmitting: resetIsSubmitting },
	} = useForm<ResetForm>({ resolver: zodResolver(resetForm) })

	const { mutateAsync: requestReset } = useMutation({
		mutationFn: forgotPassword,
	})
	const { mutateAsync: confirmReset } = useMutation({
		mutationFn: resetPassword,
	})

	async function onRequest(data: RequestForm) {
		try {
			await requestReset({ email: data.email })
			setEmail(data.email)
			setStep('reset')
			toast.success(
				'If the email exists, a code was sent. Check the backend console (dev).',
			)
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error('Too many attempts. Please wait a moment.')
				return
			}
			toast.error('Could not start password reset.')
		}
	}

	async function onReset(data: ResetForm) {
		try {
			await confirmReset({
				email,
				code: data.code,
				newPassword: data.password,
			})
			toast.success('Password reset. You can sign in now.')
			navigate('/sign-in')
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error('Too many attempts. Please wait a moment.')
				return
			}
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not reset password.'
			toast.error(message)
		}
	}

	return {
		step,
		email,
		backToRequest: () => setStep('request'),
		register,
		errors,
		isSubmitting,
		handleRequest: submitRequest(onRequest),
		resetControl,
		resetRegister,
		resetErrors,
		resetIsSubmitting,
		handleReset: submitReset(onReset),
	}
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { confirmEmailChangeByOtp } from '@/api/confirm-email-change'
import { requestEmailChange } from '@/api/request-email-change'
import { useAuth } from '@/components/auth/auth-hooks'

const requestForm = z.object({ email: z.email('Enter a valid email.') })
type RequestForm = z.infer<typeof requestForm>

const confirmForm = z.object({
	code: z.string().length(6, 'Enter the 6-digit code.'),
})
type ConfirmForm = z.infer<typeof confirmForm>

// idle → editing (type the new email) → confirming (enter the code / click the
// link). Two doors: the OTP here, or the link from the email (landing page).
export type EmailCardState = 'idle' | 'editing' | 'confirming'

export function useEmailCardPM() {
	const auth = useAuth()
	const [state, setState] = useState<EmailCardState>('idle')
	const [pendingEmail, setPendingEmail] = useState('')

	const {
		register,
		handleSubmit: submitRequest,
		reset: resetRequest,
		formState: { errors, isSubmitting },
	} = useForm<RequestForm>({ resolver: zodResolver(requestForm) })

	const {
		control,
		handleSubmit: submitConfirm,
		reset: resetConfirm,
		formState: { errors: confirmErrors, isSubmitting: isConfirming },
	} = useForm<ConfirmForm>({ resolver: zodResolver(confirmForm) })

	const { mutateAsync: requestChange } = useMutation({
		mutationFn: requestEmailChange,
	})
	const { mutateAsync: confirmChange } = useMutation({
		mutationFn: confirmEmailChangeByOtp,
	})

	function startEditing() {
		resetRequest({ email: '' })
		setState('editing')
	}

	function cancel() {
		resetRequest({ email: '' })
		resetConfirm({ code: '' })
		setState('idle')
	}

	async function onRequest(data: RequestForm) {
		try {
			await requestChange({ email: data.email })
			setPendingEmail(data.email)
			resetConfirm({ code: '' })
			setState('confirming')
			toast.success(
				'We sent a confirmation code to your new email. Check the backend console (dev).',
			)
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error('Please wait before requesting another change.')
				return
			}
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not start the email change.'
			toast.error(message)
		}
	}

	async function onConfirm(data: ConfirmForm) {
		try {
			await confirmChange({ code: data.code })
			toast.success('Email updated.')
			// Confirming proves the new address → refetch so is_verified is fresh.
			await auth.reloadUser()
			cancel()
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Invalid or expired code.'
			toast.error(message)
		}
	}

	return {
		state,
		pendingEmail,
		register,
		errors,
		isSubmitting,
		handleRequest: submitRequest(onRequest),
		control,
		confirmErrors,
		isConfirming,
		handleConfirm: submitConfirm(onConfirm),
		startEditing,
		cancel,
	}
}

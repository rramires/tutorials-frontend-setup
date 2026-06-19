import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

import { sendVerification } from '@/api/send-verification'
import { verifyEmailByOtp } from '@/api/verify-email'
import { useAuth } from '@/components/auth/auth-hooks'

export function useVerifyEmailBannerPM() {
	const auth = useAuth()
	const [open, setOpen] = useState(false)
	const [code, setCode] = useState('')

	const { mutateAsync: send, isPending: isSending } = useMutation({
		mutationFn: sendVerification,
	})
	const { mutateAsync: verify, isPending: isVerifying } = useMutation({
		mutationFn: verifyEmailByOtp,
	})

	async function handleSendCode() {
		try {
			await send()
			toast.success(
				'Verification code sent. Check the backend console (dev).',
			)
			setOpen(true)
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				const retryAfter = err.response.data?.retryAfter
				toast.error(
					retryAfter
						? `Please wait ${retryAfter}s before requesting a new code.`
						: 'Please wait before requesting a new code.',
				)
				return
			}
			toast.error('Could not send the verification code.')
		}
	}

	async function handleVerify() {
		try {
			await verify({ code })
			await auth.reloadUser()
			toast.success('Email verified.')
			setOpen(false)
			setCode('')
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Invalid or expired code.'
			toast.error(message)
		}
	}

	const visible =
		auth.status === 'authed' && auth.user !== null && !auth.user.isVerified

	return {
		visible,
		open,
		setOpen,
		code,
		setCode,
		isSending,
		isVerifying,
		handleSendCode,
		handleVerify,
	}
}

import { MailWarning } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp'

import { useVerifyEmailBannerPM } from './use-verify-email-banner-pm'

export function VerifyEmailBanner() {
	const pm = useVerifyEmailBannerPM()

	if (!pm.visible) {
		return null
	}

	return (
		<>
			<div className='bg-card text-card-foreground flex w-full flex-col items-center gap-2 border-b px-8 py-4'>
				<div className='flex items-center gap-2'>
					<MailWarning className='size-5' />
					<p className='font-medium'>Verify your email</p>
				</div>
				<p className='text-muted-foreground text-sm'>
					Confirm your email address to unlock check-ins.
				</p>
				<Button
					size='sm'
					onClick={pm.handleSendCode}
					disabled={pm.isSending}
				>
					Send code
				</Button>
			</div>

			<Dialog open={pm.open} onOpenChange={pm.setOpen}>
				<DialogContent className='sm:max-w-sm'>
					<DialogHeader>
						<DialogTitle>Enter verification code</DialogTitle>
						<DialogDescription>
							Type the 6-digit code we sent to your email.
						</DialogDescription>
					</DialogHeader>

					<div className='flex justify-center py-2'>
						<InputOTP
							maxLength={6}
							value={pm.code}
							onChange={pm.setCode}
						>
							<InputOTPGroup>
								<InputOTPSlot index={0} />
								<InputOTPSlot index={1} />
								<InputOTPSlot index={2} />
								<InputOTPSlot index={3} />
								<InputOTPSlot index={4} />
								<InputOTPSlot index={5} />
							</InputOTPGroup>
						</InputOTP>
					</div>

					<DialogFooter>
						<Button
							onClick={pm.handleVerify}
							disabled={pm.code.length !== 6 || pm.isVerifying}
							className='w-full'
						>
							Verify
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

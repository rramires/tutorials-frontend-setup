import { Controller } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

import { useEmailCardPM } from './use-email-card-pm'

export function EmailCard() {
	const pm = useEmailCardPM()

	return (
		<Card>
			<CardHeader>
				<CardTitle>Email</CardTitle>
				<CardDescription>
					Change the email address for your account.
				</CardDescription>
			</CardHeader>

			<CardContent>
				{pm.state === 'idle' && (
					<Button variant='outline' onClick={pm.startEditing}>
						Change email
					</Button>
				)}

				{pm.state === 'editing' && (
					<form onSubmit={pm.handleRequest} noValidate>
						<div className='flex flex-col gap-6'>
							<div className='grid gap-2'>
								<Label htmlFor='new-email'>New email</Label>
								<Input
									id='new-email'
									type='email'
									placeholder='m@example.com'
									{...pm.register('email')}
								/>
								{pm.errors.email && (
									<p className='text-destructive text-sm'>
										{pm.errors.email.message}
									</p>
								)}
							</div>

							<div className='flex gap-2'>
								<Button
									type='submit'
									disabled={pm.isSubmitting}
									className='flex-1'
								>
									Send confirmation
								</Button>
								<Button
									type='button'
									variant='ghost'
									onClick={pm.cancel}
								>
									Cancel
								</Button>
							</div>
						</div>
					</form>
				)}

				{pm.state === 'confirming' && (
					<form onSubmit={pm.handleConfirm} noValidate>
						<div className='flex flex-col gap-6'>
							<div className='grid gap-2'>
								<Label htmlFor='code'>Confirmation code</Label>
								<p className='text-muted-foreground text-sm'>
									Enter the 6-digit code sent to{' '}
									<span className='font-medium'>
										{pm.pendingEmail}
									</span>
									, or click the link in that email.
								</p>
								<Controller
									control={pm.control}
									name='code'
									render={({ field }) => (
										<InputOTP
											maxLength={6}
											value={field.value ?? ''}
											onChange={field.onChange}
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
									)}
								/>
								{pm.confirmErrors.code && (
									<p className='text-destructive text-sm'>
										{pm.confirmErrors.code.message}
									</p>
								)}
							</div>

							<div className='flex gap-2'>
								<Button
									type='submit'
									disabled={pm.isConfirming}
									className='flex-1'
								>
									Confirm
								</Button>
								<Button
									type='button'
									variant='ghost'
									onClick={pm.cancel}
								>
									Cancel
								</Button>
							</div>
						</div>
					</form>
				)}
			</CardContent>
		</Card>
	)
}

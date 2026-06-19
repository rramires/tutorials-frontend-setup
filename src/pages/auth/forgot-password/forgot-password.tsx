import { Controller } from 'react-hook-form'
import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'
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

import { useForgotPasswordPM } from './use-forgot-password-pm'

export function ForgotPassword() {
	const pm = useForgotPasswordPM()

	return (
		<>
			<PageTitle title='Forgot password' />

			<div className='flex flex-1 items-center justify-center p-8'>
				<Card className='w-full max-w-sm'>
					{pm.step === 'request' ? (
						<>
							<CardHeader>
								<CardTitle>Forgot your password?</CardTitle>
								<CardDescription>
									Enter your email and we'll send a reset
									code.
								</CardDescription>
							</CardHeader>

							<CardContent>
								<form onSubmit={pm.handleRequest}>
									<div className='flex flex-col gap-6'>
										<div className='grid gap-2'>
											<Label htmlFor='email'>Email</Label>
											<Input
												id='email'
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

										<Button
											type='submit'
											disabled={pm.isSubmitting}
											className='w-full'
										>
											Send reset code
										</Button>
									</div>
								</form>
							</CardContent>
						</>
					) : (
						<>
							<CardHeader>
								<CardTitle>Reset your password</CardTitle>
								<CardDescription>
									Enter the code sent to {pm.email} and your
									new password.
								</CardDescription>
							</CardHeader>

							<CardContent>
								<form onSubmit={pm.handleReset}>
									<div className='flex flex-col gap-6'>
										<div className='grid gap-2'>
											<Label htmlFor='code'>
												Verification code
											</Label>
											<Controller
												control={pm.resetControl}
												name='code'
												render={({ field }) => (
													<InputOTP
														maxLength={6}
														value={
															field.value ?? ''
														}
														onChange={
															field.onChange
														}
													>
														<InputOTPGroup>
															<InputOTPSlot
																index={0}
															/>
															<InputOTPSlot
																index={1}
															/>
															<InputOTPSlot
																index={2}
															/>
															<InputOTPSlot
																index={3}
															/>
															<InputOTPSlot
																index={4}
															/>
															<InputOTPSlot
																index={5}
															/>
														</InputOTPGroup>
													</InputOTP>
												)}
											/>
											{pm.resetErrors.code && (
												<p className='text-destructive text-sm'>
													{
														pm.resetErrors.code
															.message
													}
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='password'>
												New password
											</Label>
											<Input
												id='password'
												type='password'
												{...pm.resetRegister(
													'password',
												)}
											/>
											{pm.resetErrors.password && (
												<p className='text-destructive text-sm'>
													{
														pm.resetErrors.password
															.message
													}
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='confirmPassword'>
												Confirm password
											</Label>
											<Input
												id='confirmPassword'
												type='password'
												{...pm.resetRegister(
													'confirmPassword',
												)}
											/>
											{pm.resetErrors.confirmPassword && (
												<p className='text-destructive text-sm'>
													{
														pm.resetErrors
															.confirmPassword
															.message
													}
												</p>
											)}
										</div>

										<Button
											type='submit'
											disabled={pm.resetIsSubmitting}
											className='w-full'
										>
											Reset password
										</Button>

										<button
											type='button'
											onClick={pm.backToRequest}
											className='text-muted-foreground text-sm underline-offset-4 hover:underline'
										>
											Use a different email
										</button>
									</div>
								</form>
							</CardContent>
						</>
					)}

					<div className='text-center text-sm'>
						<Link
							to='/sign-in'
							className='underline-offset-4 hover:underline'
						>
							Back to login
						</Link>
					</div>
				</Card>
			</div>
		</>
	)
}

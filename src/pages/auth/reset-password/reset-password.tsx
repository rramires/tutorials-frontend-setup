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
import { Label } from '@/components/ui/label'

import { useResetPasswordPM } from './use-reset-password-pm'

export function ResetPassword() {
	const pm = useResetPasswordPM()

	return (
		<>
			<PageTitle title='Reset password' />

			<div className='flex flex-1 items-center justify-center p-8'>
				<Card className='w-full max-w-sm'>
					<CardHeader>
						<CardTitle>Reset your password</CardTitle>
						<CardDescription>
							{pm.hasToken
								? 'Choose a new password for your account.'
								: 'This reset link is invalid or incomplete.'}
						</CardDescription>
					</CardHeader>

					<CardContent>
						{pm.hasToken ? (
							<form onSubmit={pm.handleSubmit}>
								<div className='flex flex-col gap-6'>
									<div className='grid gap-2'>
										<Label htmlFor='password'>
											New password
										</Label>
										<Input
											id='password'
											type='password'
											{...pm.register('password')}
										/>
										{pm.errors.password && (
											<p className='text-destructive text-sm'>
												{pm.errors.password.message}
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
											{...pm.register('confirmPassword')}
										/>
										{pm.errors.confirmPassword && (
											<p className='text-destructive text-sm'>
												{
													pm.errors.confirmPassword
														.message
												}
											</p>
										)}
									</div>

									<Button
										type='submit'
										disabled={pm.isSubmitting}
										className='w-full'
									>
										Reset password
									</Button>
								</div>
							</form>
						) : (
							<Button asChild className='w-full'>
								<Link to='/forgot-password'>
									Request a new link
								</Link>
							</Button>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	)
}

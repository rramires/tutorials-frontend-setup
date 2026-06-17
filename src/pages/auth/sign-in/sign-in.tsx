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

import { useSignInPM } from './use-sign-in-pm'

export function SignIn() {
	const pm = useSignInPM()

	return (
		<>
			<PageTitle title='Sign In' />

			<div className='flex flex-1 items-center justify-center p-8'>
				<Card className='w-full max-w-sm'>
					<CardHeader>
						<CardTitle>Sign in</CardTitle>
						<CardDescription>
							Enter your credentials to access your account.
						</CardDescription>
					</CardHeader>

					<CardContent>
						<form onSubmit={pm.handleSubmit}>
							<div className='flex flex-col gap-6'>
								<div className='grid gap-2'>
									<Label htmlFor='identifier'>
										Email or username
									</Label>
									<Input
										id='identifier'
										type='text'
										placeholder='you@example.com or username'
										{...pm.register('identifier')}
									/>
									{pm.errors.identifier && (
										<p className='text-destructive text-sm'>
											{pm.errors.identifier.message}
										</p>
									)}
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='password'>Password</Label>
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

								<Button
									type='submit'
									disabled={pm.isSubmitting}
									className='w-full'
								>
									Sign in
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	)
}

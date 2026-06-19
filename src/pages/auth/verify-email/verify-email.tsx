import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
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

import { useVerifyEmailPM } from './use-verify-email-pm'

export function VerifyEmail() {
	const pm = useVerifyEmailPM()

	return (
		<>
			<PageTitle title='Verify email' />

			<div className='flex flex-1 items-center justify-center p-8'>
				<Card className='w-full max-w-sm text-center'>
					{pm.status === 'verifying' && (
						<CardHeader>
							<LoaderCircle className='text-muted-foreground mx-auto size-10 animate-spin' />
							<CardTitle>Verifying your email…</CardTitle>
							<CardDescription>
								Hold on while we confirm your link.
							</CardDescription>
						</CardHeader>
					)}

					{pm.status === 'success' && (
						<>
							<CardHeader>
								<CheckCircle2 className='mx-auto size-10 text-emerald-500' />
								<CardTitle>Email verified</CardTitle>
								<CardDescription>
									Your email address is now confirmed.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link to={pm.isAuthed ? '/' : '/sign-in'}>
										{pm.isAuthed ? 'Go to app' : 'Sign in'}
									</Link>
								</Button>
							</CardContent>
						</>
					)}

					{pm.status === 'error' && (
						<>
							<CardHeader>
								<XCircle className='text-destructive mx-auto size-10' />
								<CardTitle>Verification failed</CardTitle>
								<CardDescription>
									This link is invalid or has expired.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link to={pm.isAuthed ? '/' : '/sign-in'}>
										{pm.isAuthed ? 'Go to app' : 'Sign in'}
									</Link>
								</Button>
							</CardContent>
						</>
					)}
				</Card>
			</div>
		</>
	)
}

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

import { useConfirmEmailChangePM } from './use-confirm-email-change-pm'

export function ConfirmEmailChange() {
	const pm = useConfirmEmailChangePM()

	return (
		<>
			<PageTitle title='Confirm email change' />

			<div className='flex flex-1 items-center justify-center p-8'>
				<Card className='w-full max-w-sm text-center'>
					{pm.status === 'verifying' && (
						<CardHeader>
							<LoaderCircle className='text-muted-foreground mx-auto size-10 animate-spin' />
							<CardTitle>Confirming your email…</CardTitle>
							<CardDescription>
								Hold on while we confirm your link.
							</CardDescription>
						</CardHeader>
					)}

					{pm.status === 'success' && (
						<>
							<CardHeader>
								<CheckCircle2 className='mx-auto size-10 text-emerald-500' />
								<CardTitle>Email confirmed</CardTitle>
								<CardDescription>
									Your new email address is now active.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link
										to={
											pm.isAuthed
												? '/account'
												: '/sign-in'
										}
									>
										{pm.isAuthed
											? 'Back to account'
											: 'Sign in'}
									</Link>
								</Button>
							</CardContent>
						</>
					)}

					{pm.status === 'error' && (
						<>
							<CardHeader>
								<XCircle className='text-destructive mx-auto size-10' />
								<CardTitle>Confirmation failed</CardTitle>
								<CardDescription>
									This link is invalid or has expired.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link
										to={
											pm.isAuthed
												? '/account'
												: '/sign-in'
										}
									>
										{pm.isAuthed
											? 'Back to account'
											: 'Sign in'}
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

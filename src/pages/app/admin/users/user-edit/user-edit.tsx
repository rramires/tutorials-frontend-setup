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
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import { useUserEditPM } from './use-user-edit-pm'

export function UserEdit() {
	const pm = useUserEditPM()

	return (
		<>
			<PageTitle title='Edit user' />

			<div className='flex flex-1 justify-center p-8'>
				<Card className='w-full max-w-lg'>
					{pm.isLoading && (
						<CardHeader>
							<CardTitle>Loading…</CardTitle>
						</CardHeader>
					)}

					{pm.isError && (
						<>
							<CardHeader>
								<CardTitle>User not found</CardTitle>
								<CardDescription>
									This user does not exist or could not be
									loaded.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild variant='outline'>
									<Link to='/admin/users'>Back to users</Link>
								</Button>
							</CardContent>
						</>
					)}

					{!pm.isLoading && !pm.isError && pm.user && (
						<>
							<CardHeader>
								<CardTitle>Edit user</CardTitle>
								<CardDescription>
									Update {pm.user.username}'s account.
								</CardDescription>
							</CardHeader>

							<CardContent>
								<form onSubmit={pm.handleSubmit} noValidate>
									<div className='flex flex-col gap-6'>
										<div className='grid gap-2'>
											<Label htmlFor='username'>
												Username
											</Label>
											<Input
												id='username'
												{...pm.register('username')}
											/>
											{pm.errors.username && (
												<p className='text-destructive text-sm'>
													{pm.errors.username.message}
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='email'>Email</Label>
											<Input
												id='email'
												type='email'
												{...pm.register('email')}
											/>
											{pm.errors.email && (
												<p className='text-destructive text-sm'>
													{pm.errors.email.message}
												</p>
											)}
											{pm.emailChanged && (
												<p className='text-muted-foreground text-sm'>
													Changing the email will
													unverify this account.
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='role'>Role</Label>
											<Controller
												control={pm.control}
												name='role'
												render={({ field }) => (
													<Select
														value={field.value}
														onValueChange={
															field.onChange
														}
														disabled={pm.isSelf}
													>
														<SelectTrigger id='role'>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='MEMBER'>
																Member
															</SelectItem>
															<SelectItem value='ADMIN'>
																Admin
															</SelectItem>
														</SelectContent>
													</Select>
												)}
											/>
											{pm.isSelf && (
												<p className='text-muted-foreground text-sm'>
													You can't change your own
													role.
												</p>
											)}
										</div>

										<div className='flex items-center justify-between'>
											<Label htmlFor='is_verified'>
												Email verified
											</Label>
											<Controller
												control={pm.control}
												name='is_verified'
												render={({ field }) => (
													<Switch
														id='is_verified'
														checked={field.value}
														onCheckedChange={
															field.onChange
														}
														disabled={
															pm.emailChanged
														}
													/>
												)}
											/>
										</div>

										<div className='flex gap-2'>
											<Button
												type='submit'
												disabled={pm.isSaving}
												className='flex-1'
											>
												Save changes
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
							</CardContent>
						</>
					)}
				</Card>
			</div>
		</>
	)
}

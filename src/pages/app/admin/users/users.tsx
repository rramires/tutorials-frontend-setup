import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

import { useUsersPM } from './use-users-pm'

export function AdminUsers() {
	const pm = useUsersPM()

	return (
		<>
			<PageTitle title='Users' />

			<div className='flex flex-1 flex-col gap-4 p-8'>
				<div>
					<h1 className='text-2xl font-bold'>Users</h1>
					<p className='text-muted-foreground text-sm'>
						Manage member and admin accounts.
					</p>
				</div>

				{pm.status === 'loading' && (
					<p className='text-muted-foreground text-sm'>Loading…</p>
				)}

				{pm.status === 'empty' && (
					<p className='text-muted-foreground text-sm'>
						No users found.
					</p>
				)}

				{pm.status === 'list' && (
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Username</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead className='text-right'>
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pm.rows.map((row) => (
									<TableRow key={row.id}>
										<TableCell className='font-medium'>
											{row.username}
										</TableCell>
										<TableCell>{row.email}</TableCell>
										<TableCell>
											<Badge
												variant={
													row.role === 'ADMIN'
														? 'default'
														: 'secondary'
												}
											>
												{row.role === 'ADMIN'
													? 'Admin'
													: 'Member'}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													row.verified
														? 'default'
														: 'outline'
												}
											>
												{row.verified
													? 'Verified'
													: 'Unverified'}
											</Badge>
										</TableCell>
										<TableCell className='text-muted-foreground'>
											{row.created}
										</TableCell>
										<TableCell className='text-right'>
											<Button
												asChild
												variant='outline'
												size='sm'
											>
												<Link
													to={`/admin/users/${row.id}`}
												>
													Edit
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}

				<div className='flex items-center justify-end gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={pm.prevPage}
						disabled={!pm.hasPrevPage}
					>
						Previous
					</Button>
					<span className='text-muted-foreground text-sm'>
						Page {pm.page}
					</span>
					<Button
						variant='outline'
						size='sm'
						onClick={pm.nextPage}
						disabled={!pm.hasNextPage}
					>
						Next
					</Button>
				</div>
			</div>
		</>
	)
}

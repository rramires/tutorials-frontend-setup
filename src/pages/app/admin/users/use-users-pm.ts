import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { getUsers } from '@/api/get-users'

const PAGE_SIZE = 20

const dateFormatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: 'medium',
})

export type UsersStatus = 'loading' | 'empty' | 'list'

// View model: the PublicUser shaped for the table (formatted date + a flag), so
// the view stays pure markup.
export interface UserRow {
	id: string
	username: string
	email: string
	role: 'MEMBER' | 'ADMIN'
	verified: boolean
	created: string
}

export function useUsersPM() {
	const [page, setPage] = useState(1)

	const { data: users = [], isLoading } = useQuery({
		queryKey: ['users', page],
		queryFn: () => getUsers({ page }),
	})

	const rows: UserRow[] = users.map((user) => ({
		id: user.id,
		username: user.username,
		email: user.email,
		role: user.role,
		verified: user.is_verified,
		created: dateFormatter.format(new Date(user.created_at)),
	}))

	let status: UsersStatus
	if (isLoading) {
		status = 'loading'
	} else if (users.length === 0) {
		status = 'empty'
	} else {
		status = 'list'
	}

	return {
		rows,
		status,
		page,
		hasPrevPage: page > 1,
		hasNextPage: users.length === PAGE_SIZE,
		nextPage: () => setPage((current) => current + 1),
		prevPage: () => setPage((current) => Math.max(1, current - 1)),
	}
}

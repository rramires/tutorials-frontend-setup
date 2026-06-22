import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { getUser } from '@/api/get-user'
import { updateUser, type UpdateUserBody } from '@/api/update-user'
import { useAuth } from '@/components/auth/auth-hooks'

const usernamePattern = /^[a-zA-Z0-9_]+$/

const editForm = z.object({
	username: z
		.string()
		.min(3, 'Minimum of 3 characters.')
		.max(30, 'Maximum of 30 characters.')
		.regex(usernamePattern, 'Letters, numbers and underscore only.'),
	email: z.email('Enter a valid email.'),
	role: z.enum(['MEMBER', 'ADMIN']),
	is_verified: z.boolean(),
})
type EditForm = z.infer<typeof editForm>

export function useUserEditPM() {
	const { userId = '' } = useParams()
	const auth = useAuth()
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	// Fetch the user by id so the page stands alone (refresh / direct link).
	const {
		data: user,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['users', userId],
		queryFn: () => getUser(userId),
		enabled: Boolean(userId),
		retry: false,
	})

	const {
		register,
		control,
		handleSubmit,
		setValue,
		formState: { errors, dirtyFields },
	} = useForm<EditForm>({
		resolver: zodResolver(editForm),
		defaultValues: {
			username: '',
			email: '',
			role: 'MEMBER',
			is_verified: false,
		},
		// `values` (not a post-mount reset) re-seeds the form when the async user
		// load resolves. It refreshes the Controller-bound Select/Switch too — a
		// reset() inside an effect leaves those stale (register inputs seed, the
		// Controllers don't), so on first open Role/verified came up blank.
		values: user
			? {
					username: user.username,
					email: user.email,
					role: user.role,
					is_verified: user.is_verified,
				}
			: undefined,
	})

	// Rule: changing the email unverifies the account, so the verified toggle is
	// forced off (and disabled in the view) while the email differs. dirtyFields
	// (not a watched value) tells us the email diverged from the seeded baseline
	// — no first-render lag that would wrongly clobber the seeded verified flag.
	const emailChanged = Boolean(dirtyFields.email)
	useEffect(() => {
		if (emailChanged) {
			setValue('is_verified', false)
		}
	}, [emailChanged, setValue])

	const update = useMutation({
		mutationFn: (body: UpdateUserBody) => updateUser(userId, body),
		onSuccess: () => {
			toast.success('User updated.')
			queryClient.invalidateQueries({ queryKey: ['users'] })
			navigate('/admin/users')
		},
		onError: (err) => {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not update the user.'
			toast.error(message)
		},
	})

	function onSubmit(data: EditForm) {
		if (!user) {
			return
		}

		// Send only the changed fields — the backend requires at least one and
		// rejects an email+is_verified:true combination.
		const body: UpdateUserBody = {}
		if (data.username !== user.username) {
			body.username = data.username
		}
		if (data.email !== user.email) {
			body.email = data.email
		}
		if (data.role !== user.role) {
			body.role = data.role
		}
		if (!emailChanged && data.is_verified !== user.is_verified) {
			body.is_verified = data.is_verified
		}

		if (Object.keys(body).length === 0) {
			toast.info('No changes to save.')
			return
		}

		update.mutate(body)
	}

	return {
		isLoading,
		isError,
		user,
		register,
		control,
		errors,
		// Rule: an admin cannot change their own role.
		isSelf: auth.user?.id === userId,
		emailChanged,
		isSaving: update.isPending,
		handleSubmit: handleSubmit(onSubmit),
		cancel: () => navigate('/admin/users'),
	}
}

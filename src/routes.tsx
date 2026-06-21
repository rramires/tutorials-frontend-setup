import { createBrowserRouter } from 'react-router'

import { ProtectedRoute } from './components/auth/protected-route'
import { RoleRoute } from './components/auth/role-route'
import { AppLayout } from './pages/_layouts/app-layout/app-layout'
import { AuthLayout } from './pages/_layouts/auth-layout'
import { RegisterLayout } from './pages/_layouts/register-layout'
import { Account } from './pages/app/account/account'
import { UserEdit } from './pages/app/admin/users/user-edit/user-edit'
import { AdminUsers } from './pages/app/admin/users/users'
import { CheckIns } from './pages/app/check-ins/check-ins'
import { Gyms } from './pages/app/gyms/gyms'
import { Home } from './pages/app/home/home'
import { NewGym } from './pages/app/new-gym/new-gym'
import { ConfirmEmailChange } from './pages/auth/confirm-email-change/confirm-email-change'
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password'
import { ResetPassword } from './pages/auth/reset-password/reset-password'
import { SignIn } from './pages/auth/sign-in/sign-in'
import { VerifyEmail } from './pages/auth/verify-email/verify-email'
import { NotFound } from './pages/e404'
import { ErrorPage } from './pages/error'
import { Register } from './pages/register/register'

export const router = createBrowserRouter([
	{
		path: '/',
		errorElement: <ErrorPage />,
		children: [
			{
				path: '/',
				element: <ProtectedRoute />,
				children: [
					{
						element: <AppLayout />,
						children: [
							{ index: true, element: <Home /> },
							{ path: 'gyms', element: <Gyms /> },
							{ path: 'check-ins', element: <CheckIns /> },
							{ path: 'account', element: <Account /> },
							{
								element: <RoleRoute allow={['ADMIN']} />,
								children: [
									{ path: 'gyms/new', element: <NewGym /> },
									{
										path: 'admin/users',
										element: <AdminUsers />,
									},
									{
										path: 'admin/users/:userId',
										element: <UserEdit />,
									},
								],
							},
						],
					},
				],
			},
			{
				path: '/sign-in',
				element: <AuthLayout />,
				children: [{ index: true, element: <SignIn /> }],
			},
			{
				path: '/register',
				element: <RegisterLayout />,
				children: [{ index: true, element: <Register /> }],
			},
			{
				path: '/forgot-password',
				element: <AuthLayout />,
				children: [{ index: true, element: <ForgotPassword /> }],
			},
			{
				path: '/users/reset-password',
				element: <AuthLayout />,
				children: [{ index: true, element: <ResetPassword /> }],
			},
			{
				path: '/users/verify-email',
				element: <AuthLayout />,
				children: [{ index: true, element: <VerifyEmail /> }],
			},
			{
				path: '/users/confirm-email-change',
				element: <AuthLayout />,
				children: [{ index: true, element: <ConfirmEmailChange /> }],
			},
		],
	},
	{
		path: '*',
		element: <NotFound />,
	},
])

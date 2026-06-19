import { createBrowserRouter } from 'react-router'

import { ProtectedRoute } from './components/auth/protected-route'
import { AppLayout } from './pages/_layouts/app-layout'
import { AuthLayout } from './pages/_layouts/auth-layout'
import { RegisterLayout } from './pages/_layouts/register-layout'
import { Home } from './pages/app/home'
import { SignIn } from './pages/auth/sign-in/sign-in'
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
						children: [{ index: true, element: <Home /> }],
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
		],
	},
	{
		path: '*',
		element: <NotFound />,
	},
])

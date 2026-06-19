import { setupWorker } from 'msw/browser'

import { env } from '@/env'

import { forgotPasswordMock } from './forgot-password-mock'
import { profileMock } from './profile-mock'
import { refreshMock } from './refresh-mock'
import { registerMock } from './register-mock'
import { resetPasswordMock } from './reset-password-mock'
import { signInMock } from './sign-in-mock'
import { signOutMock } from './sign-out-mock'

export const worker = setupWorker(
	signInMock,
	registerMock,
	profileMock,
	refreshMock,
	signOutMock,
	forgotPasswordMock,
	resetPasswordMock,
)

export async function enableMSW() {
	if (env.MODE !== 'test') {
		return
	}

	await worker.start({
		onUnhandledRequest: 'bypass',
	})
}

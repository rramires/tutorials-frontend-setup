import { setupWorker } from 'msw/browser'

import { env } from '@/env'

import { profileMock } from './profile-mock'
import { refreshMock } from './refresh-mock'
import { registerMock } from './register-mock'
import { signInMock } from './sign-in-mock'
import { signOutMock } from './sign-out-mock'

export const worker = setupWorker(
	signInMock,
	registerMock,
	profileMock,
	refreshMock,
	signOutMock,
)

export async function enableMSW() {
	if (env.MODE !== 'test') {
		return
	}

	await worker.start({
		onUnhandledRequest: 'bypass',
	})
}

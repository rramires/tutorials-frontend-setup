import { setupWorker } from 'msw/browser'

import { env } from '@/env'

import { registerMock } from './register-mock'
import { signInMock } from './sign-in-mock'

export const worker = setupWorker(signInMock, registerMock)

export async function enableMSW() {
	if (env.MODE !== 'test') {
		return
	}

	await worker.start({
		onUnhandledRequest: 'bypass',
	})
}

import { setupWorker } from 'msw/browser'

import { env } from '@/env'

import { createGymMock } from './create-gym-mock'
import { forgotPasswordMock } from './forgot-password-mock'
import { nearbyGymsMock } from './nearby-gyms-mock'
import { profileMock } from './profile-mock'
import { refreshMock } from './refresh-mock'
import { registerMock } from './register-mock'
import { resetPasswordMock } from './reset-password-mock'
import { searchGymsMock } from './search-gyms-mock'
import { sendVerificationMock } from './send-verification-mock'
import { signInMock } from './sign-in-mock'
import { signOutMock } from './sign-out-mock'
import {
	verifyEmailByLinkMock,
	verifyEmailByOtpMock,
} from './verify-email-mock'

export const worker = setupWorker(
	signInMock,
	registerMock,
	profileMock,
	refreshMock,
	signOutMock,
	forgotPasswordMock,
	resetPasswordMock,
	sendVerificationMock,
	verifyEmailByLinkMock,
	verifyEmailByOtpMock,
	createGymMock,
	nearbyGymsMock,
	searchGymsMock,
)

export async function enableMSW() {
	if (env.MODE !== 'test') {
		return
	}

	await worker.start({
		onUnhandledRequest: 'bypass',
	})
}

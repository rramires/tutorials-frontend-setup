import { setupWorker } from 'msw/browser'

import { env } from '@/env'

import { checkInMock } from './check-in-mock'
import { checkInsHistoryMock } from './check-ins-history-mock'
import { checkInsMetricsMock } from './check-ins-metrics-mock'
import {
	confirmEmailChangeByLinkMock,
	confirmEmailChangeByOtpMock,
} from './confirm-email-change-mock'
import { createGymMock } from './create-gym-mock'
import { forgotPasswordMock } from './forgot-password-mock'
import { getUserMock } from './get-user-mock'
import { getUsersMock } from './get-users-mock'
import { nearbyGymsMock } from './nearby-gyms-mock'
import { profileMock } from './profile-mock'
import { refreshMock } from './refresh-mock'
import { registerMock } from './register-mock'
import { requestEmailChangeMock } from './request-email-change-mock'
import { resetPasswordMock } from './reset-password-mock'
import { searchGymsMock } from './search-gyms-mock'
import { sendVerificationMock } from './send-verification-mock'
import { signInMock } from './sign-in-mock'
import { signOutMock } from './sign-out-mock'
import { updateGymMock } from './update-gym-mock'
import { updateProfileMock } from './update-profile-mock'
import { updateUserMock } from './update-user-mock'
import { validateCheckInMock } from './validate-check-in-mock'
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
	checkInMock,
	checkInsHistoryMock,
	checkInsMetricsMock,
	validateCheckInMock,
	confirmEmailChangeByLinkMock,
	confirmEmailChangeByOtpMock,
	requestEmailChangeMock,
	updateProfileMock,
	getUsersMock,
	getUserMock,
	updateUserMock,
	updateGymMock,
)

export async function enableMSW() {
	if (env.MODE !== 'test') {
		return
	}

	await worker.start({
		onUnhandledRequest: 'bypass',
	})
}

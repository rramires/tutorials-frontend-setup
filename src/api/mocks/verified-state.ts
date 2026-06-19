// Mock-only state: tracks whether the demo user has verified their email.
// The /auth/me mock reads this so is_verified flips to true after a successful
// verification — the banner clears on refetch, exactly like the real backend.
let verified = false

export function isVerified() {
	return verified
}

export function setVerified(value: boolean) {
	verified = value
}

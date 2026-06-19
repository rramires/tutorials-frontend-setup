// In-memory access token. Lives only for the page session — durability comes
// from the httpOnly refresh cookie, not from localStorage (anti-XSS).
let accessToken: string | null = null

export function getToken() {
	return accessToken
}

export function setToken(token: string) {
	accessToken = token
}

export function clearToken() {
	accessToken = null
}

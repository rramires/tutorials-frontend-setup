import { createContext } from 'react'

export type AuthStatus = 'loading' | 'authed' | 'guest'

export interface User {
	id: string
	username: string
}

export interface AuthContextValue {
	status: AuthStatus
	user: User | null
	signIn: (token: string) => Promise<void>
	signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
	status: 'loading',
	user: null,
	signIn: async () => {},
	signOut: async () => {},
})

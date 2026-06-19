import { createContext } from 'react'

export type AuthStatus = 'loading' | 'authed' | 'guest'

export type Role = 'MEMBER' | 'ADMIN'

export interface User {
	id: string
	username: string
	isVerified: boolean
	role: Role
}

export interface AuthContextValue {
	status: AuthStatus
	user: User | null
	signIn: (token: string) => Promise<void>
	signOut: () => Promise<void>
	reloadUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
	status: 'loading',
	user: null,
	signIn: async () => {},
	signOut: async () => {},
	reloadUser: async () => {},
})

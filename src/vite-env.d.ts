/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_PASSWORD_MIN_LENGTH: string
	readonly VITE_PASSWORD_PATTERN: string
	readonly VITE_PASSWORD_MESSAGE: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

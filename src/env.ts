import { z } from 'zod'

const envSchema = z.object({
	MODE: z.enum(['production', 'development', 'test']),
	VITE_API_URL: z.string(),
	VITE_ENABLE_API_DELAY: z.string().transform((value) => value === 'true'),
	VITE_PASSWORD_MIN_LENGTH: z.coerce.number(),
	VITE_PASSWORD_PATTERN: z.string(),
	VITE_PASSWORD_MESSAGE: z.string(),
})

export const env = envSchema.parse(import.meta.env)

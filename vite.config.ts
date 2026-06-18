import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vitest.dev/config/
export default defineConfig({
	server: {
		port: 3001,
	},
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./test/setup.ts'],
	},
})

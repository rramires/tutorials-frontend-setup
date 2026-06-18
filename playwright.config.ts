import { defineConfig, devices } from '@playwright/test'

// https://playwright.dev/docs/test-configuration
export default defineConfig({
	testDir: './test',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	use: {
		baseURL: 'http://localhost:5001',
		trace: 'on-first-retry',
	},
	// Boots the mock app (MSW active in --mode test) before the suite runs.
	webServer: {
		command: 'pnpm dev:test',
		url: 'http://localhost:5001',
		reuseExistingServer: !process.env.CI,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
})

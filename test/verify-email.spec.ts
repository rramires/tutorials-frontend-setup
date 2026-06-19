import { expect, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

test('confirms the email from a valid link', async ({ page }) => {
	await page.goto('/users/verify-email?token=valid-token')

	await expect(page.getByText('Email verified')).toBeVisible()
	await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()

	await waitForUIInspection(page)
})

test('shows an error for an invalid link', async ({ page }) => {
	await page.goto('/users/verify-email?token=nope')

	await expect(page.getByText('Verification failed')).toBeVisible()

	await waitForUIInspection(page)
})

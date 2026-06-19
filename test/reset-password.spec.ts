import { expect, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

test('resets the password from a valid link', async ({ page }) => {
	await page.goto('/users/reset-password?token=valid-token')

	await page.getByLabel('New password').fill('Password1!')
	await page.getByLabel('Confirm password').fill('Password1!')
	await page.getByRole('button', { name: 'Reset password' }).click()

	await expect(
		page.getByText('Password reset. You can sign in now.'),
	).toBeVisible()
	await expect(page).toHaveURL('/sign-in')

	await waitForUIInspection(page)
})

test('shows a fallback when the link has no token', async ({ page }) => {
	await page.goto('/users/reset-password')

	await expect(
		page.getByText('This reset link is invalid or incomplete.'),
	).toBeVisible()
	await expect(
		page.getByRole('link', { name: 'Request a new link' }),
	).toBeVisible()

	await waitForUIInspection(page)
})

import { expect, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

test('registers and redirects to sign-in', async ({ page }) => {
	await page.goto('/register')

	await page.getByLabel('Username').fill('johndoe')
	await page.getByLabel('Email').fill('john@example.com')
	await page.getByLabel('Password', { exact: true }).fill('Password1!')
	await page.getByLabel('Confirm password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign up' }).click()

	await expect(
		page.getByText('Account created. You can sign in now.'),
	).toBeVisible()
	await expect(page).toHaveURL('/sign-in')

	await waitForUIInspection(page)
})

test('shows error when the username is taken', async ({ page }) => {
	await page.goto('/register')

	await page.getByLabel('Username').fill('admin')
	await page.getByLabel('Email').fill('admin@example.com')
	await page.getByLabel('Password', { exact: true }).fill('Password1!')
	await page.getByLabel('Confirm password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign up' }).click()

	await expect(page.getByText('User already exists.')).toBeVisible()
	await expect(page).toHaveURL('/register')

	await waitForUIInspection(page)
})

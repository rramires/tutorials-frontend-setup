import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

async function signIn(page: Page, identifier: string) {
	await page.goto('/sign-in')
	await page.getByLabel('Email or username').fill(identifier)
	await page.getByLabel('Password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign in' }).click()
	await expect(page).toHaveURL('/')
}

test('member updates their username from the account page', async ({
	page,
}) => {
	await signIn(page, 'johndoe')

	await page.getByRole('link', { name: 'Account' }).click()
	await expect(page).toHaveURL('/account')

	await page.getByLabel('Username').fill('johnny')
	await page.getByRole('button', { name: 'Save' }).click()

	await expect(page.getByText('Profile updated.')).toBeVisible()
	// The sidebar reflects the new username after the profile refetch.
	await expect(page.getByText('johnny', { exact: true })).toBeVisible()

	await waitForUIInspection(page)
})

test('member changes their email with the confirmation code', async ({
	page,
}) => {
	await signIn(page, 'johndoe')

	await page.getByRole('link', { name: 'Account' }).click()

	await page.getByRole('button', { name: 'Change email' }).click()
	await page.getByLabel('New email').fill('new@example.com')
	await page.getByRole('button', { name: 'Send confirmation' }).click()

	// The card swaps to the OTP step, naming the pending address.
	await expect(
		page.getByText('new@example.com', { exact: true }),
	).toBeVisible()

	await page.locator('[data-slot="input-otp"]').click()
	await page.keyboard.type('123456')
	await page.getByRole('button', { name: 'Confirm' }).click()

	await expect(page.getByText('Email updated.')).toBeVisible()

	await waitForUIInspection(page)
})

test('confirms an email change from a valid link', async ({ page }) => {
	await page.goto('/users/confirm-email-change?token=valid-token')

	await expect(page.getByText('Email confirmed')).toBeVisible()

	await waitForUIInspection(page)
})

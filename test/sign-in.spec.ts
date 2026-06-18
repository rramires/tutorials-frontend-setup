import { expect, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

test('signs in and redirects home', async ({ page }) => {
	await page.goto('/sign-in')

	await page.getByLabel('Email or username').fill('johndoe')
	await page.getByLabel('Password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign in' }).click()

	await expect(page.getByText('Signed in successfully.')).toBeVisible()
	await expect(page).toHaveURL('/')

	await waitForUIInspection(page)
})

test('shows error on wrong credentials', async ({ page }) => {
	await page.goto('/sign-in')

	await page.getByLabel('Email or username').fill('johndoe')
	await page.getByLabel('Password').fill('WrongPass1!')
	await page.getByRole('button', { name: 'Sign in' }).click()

	await expect(page.getByText('Invalid credentials.')).toBeVisible()
	await expect(page).toHaveURL('/sign-in')

	await waitForUIInspection(page)
})

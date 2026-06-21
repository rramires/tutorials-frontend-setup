import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

// Grant a fixed location so the geolocation-driven check-in resolves.
test.use({
	geolocation: { latitude: -23.55, longitude: -46.63 },
	permissions: ['geolocation'],
})

async function signIn(page: Page, identifier: string) {
	await page.goto('/sign-in')
	await page.getByLabel('Email or username').fill(identifier)
	await page.getByLabel('Password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign in' }).click()
	await expect(page).toHaveURL('/')
}

test('the dashboard greets the user and shows check-in stats', async ({
	page,
}) => {
	await signIn(page, 'johndoe')

	await expect(page.getByText('Welcome back, johndoe!')).toBeVisible()
	await expect(page.getByText('Total check-ins')).toBeVisible()
	await expect(page.getByText('Recent activity')).toBeVisible()

	await waitForUIInspection(page)
})

test('member checks in from a gym and sees it in the history', async ({
	page,
}) => {
	await signIn(page, 'johndoe')

	await page.getByRole('link', { name: 'Gyms' }).click()
	await expect(page).toHaveURL('/gyms')
	await expect(page.getByText('Iron Temple')).toBeVisible()

	await page.getByRole('button', { name: 'Check in' }).first().click()
	await expect(page.getByText('Checked in!')).toBeVisible()

	await page.getByRole('link', { name: 'Check-ins' }).click()
	await expect(page).toHaveURL('/check-ins')
	await expect(page.getByText('Pending').first()).toBeVisible()

	await waitForUIInspection(page)
})

test('member does not see the Validate action', async ({ page }) => {
	await signIn(page, 'johndoe')

	await page.getByRole('link', { name: 'Check-ins' }).click()
	await expect(page).toHaveURL('/check-ins')
	await expect(page.getByText('Pending').first()).toBeVisible()

	await expect(page.getByRole('button', { name: 'Validate' })).toHaveCount(0)

	await waitForUIInspection(page)
})

test('admin checks in and validates the check-in', async ({ page }) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'Gyms' }).click()
	await expect(page.getByText('Iron Temple')).toBeVisible()
	await page.getByRole('button', { name: 'Check in' }).first().click()
	await expect(page.getByText('Checked in!')).toBeVisible()

	await page.getByRole('link', { name: 'Check-ins' }).click()
	await expect(page).toHaveURL('/check-ins')

	await page.getByRole('button', { name: 'Validate' }).first().click()
	await expect(page.getByText('Check-in validated.')).toBeVisible()
	await expect(page.getByText('Validated').first()).toBeVisible()

	await waitForUIInspection(page)
})

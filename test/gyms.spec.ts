import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

// Grant a fixed location so the "nearby" flow resolves deterministically.
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

test('member browses nearby gyms and searches by name', async ({ page }) => {
	await signIn(page, 'johndoe')

	await page.getByRole('link', { name: 'Gyms' }).click()
	await expect(page).toHaveURL('/gyms')

	// Geolocation granted → the seeded "nearby" gyms render.
	await expect(page.getByText('Iron Temple')).toBeVisible()

	// Typing (>= 3 chars) switches to search and filters by name.
	await page.getByPlaceholder('Search gyms by name…').fill('aqua')
	await expect(page.getByText('Aqua Fitness')).toBeVisible()
	await expect(page.getByText('Iron Temple')).toBeHidden()

	await waitForUIInspection(page)
})

test('member does not see the New gym link', async ({ page }) => {
	await signIn(page, 'johndoe')

	await expect(page.getByRole('link', { name: 'New gym' })).toHaveCount(0)

	await waitForUIInspection(page)
})

test('admin creates a gym from the New gym page', async ({ page }) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'New gym' }).click()
	await expect(page).toHaveURL('/gyms/new')

	await page.getByLabel('Title').fill('Night Owl Gym')
	await page.getByLabel('Latitude').fill('-23.5')
	await page.getByLabel('Longitude').fill('-46.6')
	await page.getByRole('button', { name: 'Create gym' }).click()

	await expect(page.getByText('Gym "Night Owl Gym" created.')).toBeVisible()
	await expect(page).toHaveURL('/gyms')
	await expect(page.getByText('Night Owl Gym')).toBeVisible()

	await waitForUIInspection(page)
})

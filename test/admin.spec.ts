import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

// Geolocation granted so the gyms page resolves "nearby" (used by the gym-edit
// test below).
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

test('admin lists users and promotes a member', async ({ page }) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'Users' }).click()
	await expect(page).toHaveURL('/admin/users')
	await expect(page.getByText('member3@example.com')).toBeVisible()

	// Open the dedicated edit page for that member.
	await page
		.getByRole('row')
		.filter({ hasText: 'member3@example.com' })
		.getByRole('link', { name: 'Edit' })
		.click()
	await expect(page).toHaveURL(/\/admin\/users\/.+/)

	// The role select must show the seeded value on load (before any click) —
	// this is the case that broke on a real browser but not in happy-dom.
	await expect(page.getByRole('combobox')).toContainText('Member')

	// Promote MEMBER → ADMIN via the role select.
	await page.getByRole('combobox').click()
	await page.getByRole('option', { name: 'Admin' }).click()
	await page.getByRole('button', { name: 'Save changes' }).click()

	await expect(page.getByText('User updated.')).toBeVisible()
	await expect(page).toHaveURL('/admin/users')

	await waitForUIInspection(page)
})

test('member does not see the admin navigation', async ({ page }) => {
	await signIn(page, 'johndoe')

	await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0)
	await expect(page.getByRole('link', { name: 'New gym' })).toHaveCount(0)

	await waitForUIInspection(page)
})

test('admin edits a gym from the gym card', async ({ page }) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'Gyms' }).click()
	await expect(page.getByText('Iron Temple')).toBeVisible()

	// The Edit button is admin-only; open the dialog on the first card.
	await page.getByRole('button', { name: 'Edit' }).first().click()
	await expect(page.getByRole('dialog')).toBeVisible()

	await page.getByLabel('Title').fill('Iron Temple Reborn')
	await page.getByRole('button', { name: 'Save changes' }).click()

	await expect(
		page.getByText('Gym "Iron Temple Reborn" updated.'),
	).toBeVisible()
	// Exact match: the success toast also contains the new title.
	await expect(
		page.getByText('Iron Temple Reborn', { exact: true }),
	).toBeVisible()

	await waitForUIInspection(page)
})

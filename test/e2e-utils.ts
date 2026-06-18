import { type Page } from '@playwright/test'

/**
 * Optional pause to watch the UI react during a run.
 * Enabled only when PLAYWRIGHT_SLOW_UI=true (see the `e2e:ui` script);
 * a no-op in normal/CI runs so the suite stays fast.
 */
export async function waitForUIInspection(page: Page, ms = 250) {
	if (process.env.PLAYWRIGHT_SLOW_UI === 'true') {
		await page.waitForTimeout(ms)
	}
}

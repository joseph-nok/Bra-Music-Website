import { test, expect } from '@playwright/test'
import { waitForPageReady } from '../../helpers/layout'

test.describe('Admin settings', () => {
  test('renders settings sections and controls', async ({ page }) => {
    await page.goto('/admin-settings')
    await waitForPageReady(page)
    await expect(page.getByRole('heading', { name: 'Site Settings' })).toBeVisible()
    await expect(page.getByText('Market Purchases').first()).toBeVisible()
    await expect(page.getByText('Gallery Manager').first()).toBeVisible()
    await expect(page.getByText('Team Manager').first()).toBeVisible()
  })
})

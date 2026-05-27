import { test, expect } from '@playwright/test'
import { waitForPageReady } from '../../helpers/layout'

test.describe('About page', () => {
  test('loads ministry copy and team section', async ({ page }) => {
    await page.goto('/about')
    await expect(
      page.getByText('Gathering the ministry team...'),
    ).toBeHidden({ timeout: 30_000 })
    await waitForPageReady(page)
    await expect(page.getByText('The Ministry', { exact: true })).toBeVisible()
    await expect(page.getByText('Meet The Team')).toBeVisible()
  })
})

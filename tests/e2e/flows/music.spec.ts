import { test, expect } from '@playwright/test'
import { waitForPageReady } from '../../helpers/layout'

test.describe('Music page interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/music')
    await waitForPageReady(page)
  })

  test('toggles lyrics on first release card', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /view lyrics/i }).first()
    await toggle.scrollIntoViewIfNeeded()
    await toggle.click()
    await expect(page.getByRole('button', { name: /hide lyrics/i }).first()).toBeVisible()
  })

  test('youtube link opens in new tab', async ({ page }) => {
    const youtube = page.getByRole('link', { name: /watch on youtube/i }).first()
    await expect(youtube).toHaveAttribute('target', '_blank')
    await expect(youtube).toHaveAttribute('href', /youtube/)
  })
})

import { test, expect } from '@playwright/test'
import { waitForPageReady } from '../../helpers/layout'

test.describe('Gallery page', () => {
  test('loads albums grid or empty state', async ({ page }) => {
    await page.goto('/gallery')
    await expect(page.getByText('Loading Gallery...')).toBeHidden({
      timeout: 30_000,
    })
    await waitForPageReady(page)

    const album = page.locator('[data-testid^="gallery-album-"]').first()
    const empty = page.getByText(/gallery is currently being curated/i)

    if ((await album.count()) > 0) {
      await expect(album).toBeVisible()
      await expect(page.getByRole('heading', { name: /spiritual journey/i })).toBeVisible()
    } else {
      await expect(empty).toBeVisible()
    }
  })
})

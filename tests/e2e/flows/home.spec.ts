import { test, expect } from '@playwright/test'
import { waitForPageReady } from '../../helpers/layout'

test.describe('Homepage', () => {
  test('shows countdown and hero actions', async ({ page }) => {
    await page.goto('/')
    await waitForPageReady(page)
    const main = page.getByRole('main')
    await expect(main.getByText('Days')).toBeVisible()
    await expect(main.getByRole('link', { name: /listen now/i })).toBeVisible()
    await expect(main.getByRole('link', { name: /invite us/i })).toBeVisible()
    await expect(main.getByRole('link', { name: /read more/i })).toBeVisible()
  })
})

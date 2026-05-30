import { test, expect } from '@playwright/test'
import { waitForPageReady } from '../../helpers/layout'

test.describe('Market and local cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/market')
    await waitForPageReady(page)
    await page.evaluate(() => {
      localStorage.clear()
      window.dispatchEvent(new CustomEvent('cart-updated'))
    })
  })

  test('shows market grid and go to cart link', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Market' })).toBeVisible()
    await expect(page.getByRole('link', { name: /go to cart/i })).toBeVisible()
    await expect(page.locator('.mt-10.grid').first()).toBeVisible()
  })

  test('persists item in localStorage when Add To Cart succeeds', async ({
    page,
  }) => {
    const addButton = page.getByRole('button', { name: /^add to cart$/i }).first()
    if ((await addButton.count()) === 0 || !(await addButton.isEnabled())) {
      test.skip()
      return
    }
    await addButton.click()
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem('bpm_market_cart_v5')),
      )
      .not.toBeNull()
  })
})

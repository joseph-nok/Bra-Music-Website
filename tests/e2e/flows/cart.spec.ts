import { test, expect } from '@playwright/test'
import { waitForPageReady } from '../../helpers/layout'

test.describe('Cart page', () => {
  test('shows empty cart state by default', async ({ page }) => {
    await page.goto('/cart')
    await page.evaluate(() => localStorage.removeItem('bpm_market_cart_v5'))
    await page.reload()
    await waitForPageReady(page)
    await expect(page.getByText(/your cart is empty/i)).toBeVisible()
  })

  test('renders seeded local cart line item', async ({ page }) => {
    await page.goto('/cart')
    await page.evaluate(() => {
      localStorage.setItem(
        'bpm_market_cart_v5',
        JSON.stringify([
          {
            productLine: 'cap',
            productId: 'fallback-cap',
            name: 'Cap',
            image: '/cap.png',
            currency: 'GHS',
            price: 60,
            quantity: 1,
            color: 'Black',
            size: 'M',
          },
        ]),
      )
    })
    await page.reload()
    await waitForPageReady(page)
    await expect(page.getByText(/item details/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cap' })).toBeVisible()
  })
})

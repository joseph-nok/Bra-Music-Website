import { test, expect } from '@playwright/test'
import { waitForPageReady } from '../../helpers/layout'

const footerNav = [
  { label: 'Home', path: '/', expectText: 'Upcoming Event', heading: false },
  { label: 'Music', path: '/music', expectText: /sacred sounds/i, heading: false },
  { label: 'Market', path: '/market', expectText: 'Market', heading: true },
  { label: 'Gallery', path: '/gallery', expectText: /spiritual journey/i, heading: false },
  { label: 'About', path: '/about', expectText: /Voices of prosperity/i, heading: false },
  { label: 'Invite Us', path: '/invite-us', expectText: /Invite Us to/i, heading: false },
] as const

for (const item of footerNav) {
  test(`footer link reaches ${item.path}`, async ({ page }) => {
    await page.goto('/cart')
    await waitForPageReady(page)
    await page.getByRole('contentinfo').getByRole('link', { name: item.label }).click()
    await expect(page).toHaveURL(new RegExp(`${item.path}$`))
    if (item.heading) {
      await expect(
        page.getByRole('heading', { name: item.expectText }),
      ).toBeVisible()
    } else {
      await expect(page.getByText(item.expectText).first()).toBeVisible()
    }
  })
}

test('header home link returns to homepage', async ({ page }) => {
  await page.goto('/music')
  await waitForPageReady(page)
  await page.getByRole('link', { name: 'Baah Prosper Music' }).click()
  await expect(page).toHaveURL('/')
})

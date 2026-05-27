import { test, expect } from '@playwright/test'
import {
  assertHeaderForViewport,
  assertNoHorizontalOverflow,
  expectPageSnapshot,
  waitForPageReady,
} from './helpers/layout'

async function waitForInviteFormHydrated(page: import('@playwright/test').Page) {
  await page.waitForLoadState('load')
  await expect(
    page.getByRole('button', { name: /submit invitation/i }),
  ).toBeVisible()
}

test.describe.configure({ mode: 'serial' })

test.describe('Invite Us Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/invite-us')
    await waitForPageReady(page)
    await waitForInviteFormHydrated(page)
  })

  test('layout, header, and snapshot', async ({ page }, testInfo) => {
    const project = testInfo.project.name

    await assertHeaderForViewport(page, project)
    await expect(page.getByText('Book the Vibe')).toBeVisible()
    await expect(page.getByText('Invite Us to')).toBeVisible()
    await expect(page.locator('form')).toBeVisible()
    await assertNoHorizontalOverflow(page)
    await expectPageSnapshot(page, 'invite-us', project)
  })

  test.describe.configure({ retries: 2 })

  test('validates required fields on submit', async ({ page }) => {
    const submit = page.getByRole('button', { name: /submit invitation/i })
    await submit.scrollIntoViewIfNeeded()

    let sawError = false
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await submit.click()
      if ((await page.getByTestId('field-error-name').count()) > 0) {
        sawError = true
        break
      }
      await page.waitForTimeout(750)
    }
    expect(sawError).toBe(true)
    await expect(page.getByTestId('field-error-name')).toHaveText(
      'Please enter your full name or organization.',
    )

    await page.fill('input#name', 'Jane Doe')
    await page.fill('input#email', 'jane@example.com')
    await page.fill('input#phone', '0241234567')
    await page.fill(
      'textarea#message',
      'Looking to book a private event next month.',
    )
  })
})

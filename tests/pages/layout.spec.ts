import { test, expect } from '@playwright/test'
import {
  assertGridColumnCount,
  assertHeaderForViewport,
  assertNoHorizontalOverflow,
  expectPageSnapshot,
  waitForPageReady,
} from '../helpers/layout'

type PublicPageCase = {
  path: string
  slug: string
  heading: string | RegExp
  headingRole?: 'heading' | 'text'
  snapshot?: boolean
  gridSelector?: string
  laptopGridCols?: number
}

const publicPages: PublicPageCase[] = [
  {
    path: '/',
    slug: 'home',
    heading: 'Upcoming Event',
    snapshot: true,
  },
  {
    path: '/music',
    slug: 'music',
    heading: /sacred sounds/i,
    snapshot: true,
    gridSelector: '.mt-12.grid',
    laptopGridCols: 3,
  },
  {
    path: '/market',
    slug: 'market',
    heading: 'Market',
    headingRole: 'heading' as const,
    snapshot: true,
    gridSelector: '.mt-10.grid',
    laptopGridCols: 3,
  },
  {
    path: '/gallery',
    slug: 'gallery',
    heading: /spiritual journey/i,
    snapshot: true,
  },
  {
    path: '/about',
    slug: 'about',
    heading: /Voices of prosperity/i,
    snapshot: true,
  },
  {
    path: '/cart',
    slug: 'cart',
    heading: 'Checkout',
    headingRole: 'heading' as const,
    snapshot: true,
  },
  {
    path: '/invite-us',
    slug: 'invite-us',
    heading: /Invite Us to/i,
  },
  {
    path: '/momo-payment',
    slug: 'momo-payment',
    heading: /Missing checkout session/i,
  },
  {
    path: '/admin-settings',
    slug: 'admin-settings',
    heading: /Site Settings/i,
  },
]

for (const pageCase of publicPages) {
  test.describe(`${pageCase.slug} page`, () => {
    test('responsive header and content', async ({ page }, testInfo) => {
      await page.goto(pageCase.path)
      await waitForPageReady(page)

      if (pageCase.path === '/gallery') {
        await expect(page.getByText('Loading Gallery...')).toBeHidden({
          timeout: 30_000,
        })
      }

      if (pageCase.path === '/about') {
        await expect(
          page.getByText('Gathering the ministry team...'),
        ).toBeHidden({ timeout: 30_000 })
      }

      await assertHeaderForViewport(page, testInfo.project.name)
      const headingLocator =
        pageCase.headingRole === 'heading'
          ? page.getByRole('heading', { name: pageCase.heading })
          : page.getByText(pageCase.heading)
      await expect(headingLocator.first()).toBeVisible()
      await assertNoHorizontalOverflow(page)

      if (
        testInfo.project.name === 'laptop' &&
        pageCase.gridSelector &&
        pageCase.laptopGridCols
      ) {
        await assertGridColumnCount(
          page.locator(pageCase.gridSelector).first(),
          pageCase.laptopGridCols,
        )
      }

      if (pageCase.snapshot) {
        await expectPageSnapshot(page, pageCase.slug, testInfo.project.name)
      }
    })
  })
}

test.describe('404 page', () => {
  test('shows not found', async ({ page }, testInfo) => {
    await page.goto('/does-not-exist-route')
    await waitForPageReady(page)
    await assertHeaderForViewport(page, testInfo.project.name)
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    await assertNoHorizontalOverflow(page)
  })
})

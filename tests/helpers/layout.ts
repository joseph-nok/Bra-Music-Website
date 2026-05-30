import { expect, type Locator, type Page } from '@playwright/test'

export const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  laptop: { width: 1440, height: 900 },
} as const

export async function assertNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement
    return root.scrollWidth > root.clientWidth + 1
  })
  expect(hasOverflow, 'page should not scroll horizontally').toBe(false)
}

export async function assertMobileHeader(page: Page) {
  await expect(page.getByTestId('header-menu-trigger')).toBeVisible()
  await expect(page.getByTestId('header-desktop-nav')).toBeHidden()
}

export async function assertDesktopHeader(page: Page) {
  await expect(page.getByTestId('header-desktop-nav')).toBeVisible()
  await expect(page.getByTestId('header-menu-trigger')).toBeHidden()
}

export async function assertHeaderForViewport(
  page: Page,
  projectName: string,
) {
  if (projectName === 'mobile') {
    await assertMobileHeader(page)
  } else {
    await assertDesktopHeader(page)
  }
}

export async function assertGridColumnCount(
  grid: Locator,
  expectedCols: number,
) {
  const columnCount = await grid.evaluate((el) => {
    const style = window.getComputedStyle(el)
    const template = style.gridTemplateColumns
    if (!template || template === 'none') return 1
    return template.split(' ').filter((part) => part.trim().length > 0).length
  })
  expect(columnCount).toBe(expectedCols)
}

export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByTestId('header-menu-trigger')).toBeAttached()
}

export async function expectPageSnapshot(
  page: Page,
  name: string,
  projectName: string,
) {
  await expect(page).toHaveScreenshot(`${name}-${projectName}.png`, {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    timeout: 30_000,
  })
}

import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'

const prepare = async (page, preferences = {}) => {
  await installApiMocks(page)
  await installSmokeSession(page)
  await overrideUserPreferences(page, smokePreferences(preferences))
}

const PRIMARY = [
  '/',
  '/today',
  '/all-tasks',
  '/calendar',
  '/projects',
  '/routines',
  '/maintenance',
  '/shopping',
  '/goals',
  '/rewards',
  '/progress',
  '/settings',
]

const box = locator =>
  locator.evaluate(el => {
    const r = el.getBoundingClientRect()
    return { top: r.top, height: r.height, width: r.width, left: r.left }
  })

test('fix05: desktop title anchors + tab geometry + no overflow (EN LTR)', async ({
  page,
}) => {
  await prepare(page, { language: 'en' })
  await page.setViewportSize({ width: 1440, height: 900 })

  const titles = {}
  for (const path of PRIMARY) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const title = page.getByTestId('page-title').first()
    // Quest "/" in focus view renders FocusHome with a title; if the smoke
    // session ever lands on Quest hero there is no page-title by design.
    if ((await title.count()) === 0) continue
    titles[path] = await box(title)
  }

  console.log(`DESKTOP_TITLES ${JSON.stringify(titles)}`)
  const tops = Object.values(titles).map(b => b.top)
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1)

  // Rewards uses the summary foundation below the canonical navigation slot.
  await page.goto('/rewards', { waitUntil: 'networkidle' })
  const hero = page.getByTestId('rewards-hero')
  await expect(hero).toBeVisible()
  const heroBox = await box(hero)

  console.log(`DESKTOP_HERO ${JSON.stringify(heroBox)}`)

  const tabs = {}
  for (const [path, id] of [
    ['/maintenance', 'assets-tabs'],
    ['/shopping', 'shopping-tabs'],
    ['/rewards', 'rewards-tabs'],
  ]) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const el = page.getByTestId(id)
    await expect(el).toBeVisible()
    tabs[path] = await box(el)
    const h = await el.evaluate(node => getComputedStyle(node).height)
    tabs[path].cssHeight = h
  }

  console.log(`DESKTOP_TABS ${JSON.stringify(tabs)}`)
  // Assets + Shopping have no hero so their tab tops must coincide.
  expect(
    Math.abs(tabs['/maintenance'].top - tabs['/shopping'].top),
  ).toBeLessThanOrEqual(1)
  expect(
    Math.abs(tabs['/rewards'].top - tabs['/shopping'].top),
  ).toBeLessThanOrEqual(1)
  expect(heroBox.top).toBeGreaterThan(
    tabs['/rewards'].top + tabs['/rewards'].height,
  )
  // Equivalent instances share height/width/border geometry.
  const tabHeights = Object.values(tabs).map(b => b.height)
  const tabWidths = Object.values(tabs).map(b => b.width)
  expect(Math.max(...tabHeights) - Math.min(...tabHeights)).toBeLessThanOrEqual(
    1,
  )
  expect(Math.max(...tabWidths) - Math.min(...tabWidths)).toBeLessThanOrEqual(1)
  // Content starts from a shared gap beneath the tabs on hero-less pages.
  const gaps = {}
  for (const [path, contentId] of [
    ['/maintenance', 'assets-tabs'],
    ['/shopping', 'shopping-tabs'],
  ]) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const tabsEl = page.getByTestId(contentId)
    const tabsBottom = (await box(tabsEl)).top + (await box(tabsEl)).height
    const contentTop = await page.evaluate(() => {
      const tabsNode =
        document.querySelector('[data-testid="assets-tabs"]') ??
        document.querySelector('[data-testid="shopping-tabs"]')
      const next = tabsNode?.parentElement?.nextElementSibling
      return next ? next.getBoundingClientRect().top : NaN
    })
    gaps[path] = contentTop - tabsBottom
  }

  console.log(`DESKTOP_TABS_CONTENT_GAP ${JSON.stringify(gaps)}`)
  expect(
    Math.abs(gaps['/maintenance'] - gaps['/shopping']),
  ).toBeLessThanOrEqual(1)

  for (const path of PRIMARY) {
    await page.goto(path, { waitUntil: 'networkidle' })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(1440)
  }
})

test('fix05: mobile title anchors + tab geometry + no overflow (EN)', async ({
  page,
}) => {
  await prepare(page, { language: 'en' })
  await page.setViewportSize({ width: 390, height: 900 })

  const titles = {}
  for (const path of PRIMARY) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const title = page.getByTestId('page-title').first()
    if ((await title.count()) === 0) continue
    titles[path] = await box(title)
  }

  console.log(`MOBILE_TITLES ${JSON.stringify(titles)}`)
  const tops = Object.values(titles).map(b => b.top)
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1)

  const tabs = {}
  for (const [path, id] of [
    ['/maintenance', 'assets-tabs'],
    ['/shopping', 'shopping-tabs'],
    ['/rewards', 'rewards-tabs'],
  ]) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const el = page.getByTestId(id)
    await expect(el).toBeVisible()
    tabs[path] = await box(el)
  }

  console.log(`MOBILE_TABS ${JSON.stringify(tabs)}`)
  const heights = Object.values(tabs).map(b => b.height)
  const widths = Object.values(tabs).map(b => b.width)
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1)
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1)
  const tabTops = Object.values(tabs).map(b => b.top)
  expect(Math.max(...tabTops) - Math.min(...tabTops)).toBeLessThanOrEqual(1)
  for (const [path, id] of [
    ['/maintenance', 'assets-tabs'],
    ['/shopping', 'shopping-tabs'],
    ['/rewards', 'rewards-tabs'],
  ]) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const headerBottom = await page
      .locator('.page-header')
      .first()
      .evaluate(el => el.getBoundingClientRect().bottom)
    const tabsTop = await page
      .getByTestId(id)
      .evaluate(el => el.getBoundingClientRect().top)
    // Every primary tab track follows the same header contract.
    {
      expect(Math.abs(tabsTop - headerBottom)).toBeLessThanOrEqual(1)
    }
  }
  for (const label of ['New asset', 'New shopping list', 'New reward']) {
    const btn = page.getByRole('button', { name: label })
    if ((await btn.count()) > 0) await expect(btn.first()).toBeVisible()
  }

  for (const path of PRIMARY) {
    await page.goto(path, { waitUntil: 'networkidle' })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390)
    await expect(page.getByTestId('page-title').first()).toBeVisible()
  }
})

test('fix05: RTL representative pages mirror without overflow', async ({
  page,
}) => {
  await prepare(page, { language: 'ar-SA' })
  const pages = [
    '/today',
    '/all-tasks',
    '/calendar',
    '/maintenance',
    '/shopping',
    '/rewards',
    '/routines',
  ]
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    const tops = []
    for (const path of pages) {
      await page.goto(path, { waitUntil: 'networkidle' })
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      const title = page.getByTestId('page-title').first()
      await expect(title).toBeVisible()
      tops.push((await box(title)).top)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(viewport.width)
    }

    console.log(`RTL_${viewport.width}_TITLES ${JSON.stringify(tops)}`)
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1)
  }
})

test('fix05: empty states share one geometry', async ({ page }) => {
  await prepare(page, { language: 'en' })
  await page.setViewportSize({ width: 1440, height: 900 })

  // Shopping legitimate zero-list state (no duplicate CTA by design).
  await page.route('**/api/v1/shopping-lists**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ res: [] }),
    }),
  )
  await page.goto('/shopping', { waitUntil: 'networkidle' })
  const shoppingEmpty = page.getByTestId('shopping-zero-lists')
  await expect(shoppingEmpty).toBeVisible()
  const shoppingBox = await box(shoppingEmpty)
  const shoppingPad = await shoppingEmpty.evaluate(
    el => getComputedStyle(el).padding,
  )

  // Search with no query renders the canonical empty state.
  await page.goto('/search', { waitUntil: 'networkidle' })
  const searchEmpty = page.getByTestId('search-zero-query')
  await expect(searchEmpty).toBeVisible()
  const searchBox = await box(searchEmpty)
  const searchPad = await searchEmpty.evaluate(
    el => getComputedStyle(el).padding,
  )

  console.log(
    `EMPTY shopping=${JSON.stringify(shoppingBox)} pad=${shoppingPad}`,
  )

  console.log(`EMPTY search=${JSON.stringify(searchBox)} pad=${searchPad}`)
  expect(shoppingPad).toBe(searchPad)
  expect(Math.abs(shoppingBox.width - searchBox.width)).toBeLessThanOrEqual(1)
})

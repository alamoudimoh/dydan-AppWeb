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

test('focus greeting uses the browser timezone at each period boundary', async ({
  browser,
}) => {
  const context = await browser.newContext({
    timezoneId: 'America/Los_Angeles',
  })
  try {
    const page = await context.newPage()
    await prepare(page)
    for (const [utc, greeting] of [
      ['2026-10-07T18:59:00Z', 'Good morning'],
      ['2026-10-07T19:00:00Z', 'Good afternoon'],
      ['2026-10-08T00:59:00Z', 'Good afternoon'],
      ['2026-10-08T01:00:00Z', 'Good evening'],
    ]) {
      await page.clock.setFixedTime(new Date(utc))
      await page.goto('/')
      await expect(
        page.getByRole('heading', { name: new RegExp(greeting) }),
      ).toBeVisible()
    }
  } finally {
    await context.close()
  }
})

test('primary page titles share the same visual anchor on desktop and mobile', async ({
  page,
}) => {
  await prepare(page)
  const paths = [
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
  ]
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    const positions = []
    for (const path of paths) {
      await page.goto(path)
      const title = page.getByTestId('page-title').first()
      await expect(title).toBeVisible()
      positions.push(
        await title.evaluate(element => element.getBoundingClientRect().top),
      )
    }
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(2)
  }
})

test('shopping shares the main header and responsive content grid', async ({
  page,
}) => {
  await prepare(page)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/shopping')
    await expect(
      page.getByRole('heading', { name: 'Shopping', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'New list' })).toBeVisible()
    const columns = await page
      .locator('.shopping-lists-grid')
      .evaluate(
        element =>
          getComputedStyle(element).gridTemplateColumns.split(' ').length,
      )
    expect(columns).toBe(width < 769 ? 1 : 2)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
  }
})

test('settings shows only implemented languages without direction labels', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/settings')
  await page.getByRole('tab', { name: 'Language & region' }).click()
  await page.getByRole('combobox').first().click()
  await expect(page.getByRole('option')).toHaveCount(2)
  await expect(page.getByRole('option', { name: 'English' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'العربية' })).toBeVisible()
  await expect(
    page.getByText(/\bRTL\b|\bLTR\b|Right-to-left layout/),
  ).toHaveCount(0)
})

test('space settings calls the invite code dydan code', async ({ page }) => {
  await prepare(page)
  await page.goto('/settings')
  await page.getByRole('tab', { name: 'Space' }).click()
  await expect(page.getByText('dydan code', { exact: true })).toBeVisible()
  await expect(page.getByText('Regenerate dydan code')).toBeVisible()
  await expect(page.getByText(/Join code/i)).toHaveCount(0)
})

for (const theme of ['dydan', 'sovereign']) {
  for (const appearance of ['light', 'dark']) {
    for (const language of ['en', 'ar-SA']) {
      test(`search placeholder contrast: ${theme} ${appearance} ${language}`, async ({
        page,
      }) => {
        await prepare(page, { theme, appearance, language })
        await page.goto('/')
        const search = page.locator('.top-search input')
        await expect(search).toHaveAttribute(
          'placeholder',
          language === 'en' ? 'Search…' : 'بحث…',
        )
        await expect(page.locator('html')).toHaveAttribute(
          'dir',
          language === 'en' ? 'ltr' : 'rtl',
        )
        const colors = await search.evaluate(element => {
          const input = getComputedStyle(element)
          const shell = getComputedStyle(element.parentElement)
          return {
            placeholder: getComputedStyle(element, '::placeholder').color,
            text: input.color,
            background: shell.backgroundColor,
            border: shell.borderColor,
          }
        })
        const channels = color =>
          color
            .match(/[\d.]+/g)
            .slice(0, 3)
            .map(Number)
        const luminance = color =>
          channels(color)
            .map(value => {
              const c = value / 255
              return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
            })
            .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
        const a = luminance(colors.placeholder)
        const b = luminance(colors.background)
        expect(
          (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        ).toBeGreaterThanOrEqual(4.5)
        expect(colors.text).not.toBe(colors.background)
        expect(colors.border).not.toBe(colors.background)
      })
    }
  }
}

import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { clearSmokeSession, installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const CASES = [
  { path: '/', width: 1440, mode: 'light', language: 'en' },
  { path: '/all-tasks', width: 390, mode: 'dark', language: 'en' },
  { path: '/projects', width: 768, mode: 'light', language: 'ar-SA' },
  { path: '/goals', width: 1440, mode: 'dark', language: 'en' },
  { path: '/routines', width: 390, mode: 'light', language: 'ar-SA' },
  { path: '/calendar', width: 768, mode: 'dark', language: 'en' },
  { path: '/shopping', width: 1440, mode: 'light', language: 'en' },
  { path: '/maintenance', width: 390, mode: 'dark', language: 'en' },
  { path: '/settings', width: 768, mode: 'light', language: 'ar-SA' },
  { path: '/progress', width: 390, mode: 'dark', language: 'ar-SA' },
  { path: '/activity', width: 1440, mode: 'dark', language: 'en' },
]

// Sovereign palette as defined by index.css on html[data-theme='sovereign']
// (light) and html[data-theme='sovereign'][data-joy-color-scheme='dark'].
// These replace the removed legacy --product-* token set.
const PALETTES = {
  light: {
    '--page': '#f6f2e8',
    '--surface-2': '#ebe7de',
    '--surface-3': '#f7edcf',
    '--t-primary': '#071a2c',
    '--t-muted': '#142d40',
    '--line': '#ebe7de',
    '--line-strong': '#4d7794',
    '--brand': '#071a2c',
  },
  dark: {
    '--page': '#071a2c',
    '--surface-2': '#142d40',
    '--surface-3': '#04111d',
    '--t-primary': '#f6f2e8',
    '--t-muted': '#d8c9a8',
    '--line': '#2c6373',
    '--line-strong': '#829fb4',
    '--brand': '#e0b45a',
  },
}

const cssVar = async (page, name) =>
  (
    await page.evaluate(
      value =>
        getComputedStyle(document.documentElement).getPropertyValue(value),
      name,
    )
  ).trim()

const assertSovereignVariables = async (page, mode) => {
  for (const [token, expected] of Object.entries(PALETTES[mode])) {
    expect((await cssVar(page, token)).toLowerCase()).toBe(expected)
  }
}

for (const scenario of CASES) {
  test(`sovereign: ${scenario.path} ${scenario.width}px ${scenario.mode} ${scenario.language}`, async ({
    page,
  }) => {
    const runtimeGuard = attachRuntimeErrorGuard(page)
    await page.setViewportSize({ width: scenario.width, height: 900 })
    await installApiMocks(page)
    await installSmokeSession(page)
    // Sovereign is the saved theme; the fixture keeps it across any reload.
    // Language is server-driven too, so ar-SA cases present it here.
    await overrideUserPreferences(
      page,
      smokePreferences({
        theme: 'sovereign',
        appearance: scenario.mode,
        language: scenario.language,
      }),
    )
    await page.addInitScript(locale => {
      localStorage.setItem('i18nextLng', locale)
      localStorage.setItem('language', JSON.stringify(locale))
    }, scenario.language)

    await page.goto(scenario.path, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)

    await expect(page.locator('#root')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      'sovereign',
    )
    await expect(page.locator('html')).toHaveAttribute(
      'data-joy-color-scheme',
      scenario.mode,
    )
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      scenario.language === 'ar-SA' ? 'rtl' : 'ltr',
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(scenario.width)

    // The removed legacy --product-* token set must not drive the runtime.
    const legacyTokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)
      return ['--product-page', '--product-brand', '--product-surface'].map(
        name => style.getPropertyValue(name).trim(),
      )
    })
    expect(legacyTokens.every(value => value === '')).toBe(true)

    await assertSovereignVariables(page, scenario.mode)
    runtimeGuard.assertClean()
  })
}

test('sovereign: mobile create-task controls stay inside the modal', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await installApiMocks(page)
  await overrideUserPreferences(
    page,
    smokePreferences({ theme: 'sovereign', appearance: 'dark' }),
  )
  await installSmokeSession(page)

  await page.goto('/all-tasks?create=1', { waitUntil: 'networkidle' })
  const panel = page.locator('.modal-panel')
  await expect(panel).toBeVisible()
  await panel.getByRole('button', { name: 'household' }).click()

  expect(
    await panel.evaluate(node => node.scrollWidth <= node.clientWidth),
  ).toBe(true)
  const [panelBox, viewport] = await Promise.all([
    panel.boundingBox(),
    page.viewportSize(),
  ])
  expect(panelBox.x).toBeGreaterThanOrEqual(0)
  expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(viewport.width)
})

test('sovereign: the signed-out surface keeps the default identity until preferences load', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await installApiMocks(page)
  await clearSmokeSession(page)

  // No token yet, so preferences are not fetched and the app renders the
  // default-branded auth identity deterministically.
  await page.goto('/login', { waitUntil: 'networkidle' })
  await expect(
    page.getByRole('heading', { name: 'Welcome back', exact: true }),
  ).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-theme',
    'sovereign',
  )
  await expect(page.locator('html')).toHaveAttribute(
    'data-joy-color-scheme',
    'light',
  )
  expect((await cssVar(page, '--page')).toLowerCase()).toBe('#fff8e8')
  expect((await cssVar(page, '--brand')).toLowerCase()).toBe('#34236d')
  runtimeGuard.assertClean()
})

import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

/**
 * Runtime theme picker: the two product themes (Dydan / Sovereign) × the
 * three colour styles (Light / Dark / Automatic) must all switch live from
 * Settings without a reload, and the persisted choice must survive a reload.
 */
test('settings: theme (Dydan/Sovereign) and mode (Light/Dark/Automatic) switch live', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  const html = page.locator('html')
  await expect(page.getByRole('button', { name: /sovereign/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /automatic/i })).toBeVisible()

  const cssVar = name =>
    page.evaluate(
      value =>
        getComputedStyle(document.documentElement)
          .getPropertyValue(value)
          .trim(),
      name,
    )

  // Defaults: Dydan theme, light style (smoke session persists light).
  await expect(html).toHaveAttribute('data-theme', 'dydan')
  await expect(html).toHaveAttribute('data-joy-color-scheme', 'light')
  expect((await cssVar('--brand')).toLowerCase()).toBe('#4326ea')

  // Switch to Sovereign: data-theme flips and the shell palette follows.
  await page.getByRole('button', { name: /^sovereign$/i }).click()
  await expect(html).toHaveAttribute('data-theme', 'sovereign')
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('dydan.theme')))
    .toBe('sovereign')
  expect((await cssVar('--brand')).toLowerCase()).toBe('#1a1a1a')
  expect((await cssVar('--action-bg')).toLowerCase()).toBe('#ffc107')
  expect((await cssVar('--page')).toLowerCase()).toBe('#ffffff')

  // Dark style over Sovereign: onyx page, gold action, dark palette.
  await page.getByRole('button', { name: /^dark$/i }).click()
  await expect(html).toHaveAttribute('data-joy-color-scheme', 'dark')
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('themeMode')))
    .toBe('"dark"')
  expect((await cssVar('--brand')).toLowerCase()).toBe('#ffc107')
  expect((await cssVar('--page')).toLowerCase()).toBe('#1a1a1a')
  expect((await cssVar('--surface-2')).toLowerCase()).toBe('#2e2e2e')

  // The persisted Sovereign brand survives a reload (dydan.theme is not
  // touched by the smoke fixture). The fixture's addInitScript re-applies
  // themeMode='light' on every navigation, so mode restore on reload is
  // covered by ThemeContext.test.jsx instead.
  await page.reload({ waitUntil: 'networkidle' })
  await expect(html).toHaveAttribute('data-theme', 'sovereign')
  await expect(html).toHaveAttribute('data-joy-color-scheme', 'light')
  expect((await cssVar('--brand')).toLowerCase()).toBe('#1a1a1a')

  // Back to Dydan + Automatic.
  await page.getByRole('button', { name: /^dydan$/i }).click()
  await page.getByRole('button', { name: /^automatic$/i }).click()
  await expect(html).toHaveAttribute('data-theme', 'dydan')
  await expect(html).toHaveAttribute('data-joy-color-scheme', 'light')
  expect((await cssVar('--brand')).toLowerCase()).toBe('#4326ea')

  runtimeGuard.assertClean()
})

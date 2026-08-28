import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

// Sovereign-brand subset: the shell, one workflow list, and one detail surface
// must render with Sovereign tokens (no DayDan violet) in both modes.
const CASES = [
  { path: '/', width: 1440, mode: 'light', language: 'en' },
  { path: '/chores', width: 390, mode: 'dark', language: 'en' },
  { path: '/routines', width: 768, mode: 'light', language: 'ar-SA' },
  { path: '/shopping', width: 1440, mode: 'dark', language: 'en' },
]

for (const scenario of CASES) {
  test(`sovereign: ${scenario.path} ${scenario.width}px ${scenario.mode} ${scenario.language}`, async ({
    page,
  }) => {
    const runtimeGuard = attachRuntimeErrorGuard(page)
    await page.setViewportSize({ width: scenario.width, height: 900 })
    await installApiMocks(page)
    await installSmokeSession(page)
    await page.addInitScript(
      ({ locale, theme }) => {
        localStorage.setItem('joy-mode', theme)
        localStorage.setItem('themeMode', JSON.stringify(theme))
        localStorage.setItem('i18nextLng', locale)
        localStorage.setItem('language', JSON.stringify(locale))
      },
      { locale: scenario.language, theme: scenario.mode },
    )

    await page.goto(scenario.path, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)

    await expect(page.locator('#root')).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(scenario.width)

    const wordmark = await page.evaluate(() => {
      const nodes = document.querySelectorAll('p, span, div')
      for (const node of nodes) {
        const label = node.textContent.trim()
        if (label === 'Sovereign') {
          return { color: getComputedStyle(node).color, label }
        }
      }
      return null
    })
    expect(wordmark).toBeTruthy()
    expect(wordmark.label).toBe('Sovereign')
    expect(wordmark.color).not.toContain('77, 64, 219') // #4D40DB
    expect(wordmark.color).not.toContain('#4D40DB')

    runtimeGuard.assertClean()
  })
}

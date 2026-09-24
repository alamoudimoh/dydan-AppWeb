import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

// Phase 1 responsive matrix across the approved shell: the desktop .sidebar is
// the navigation rail above 768px, the .mobile-nav bottom bar at and below it.
// Cases cover both in light/dark and LTR/RTL.
const CASES = [
  { width: 390, mode: 'light', language: 'en', path: '/' },
  { width: 390, mode: 'dark', language: 'ar-SA', path: '/all-tasks' },
  { width: 768, mode: 'light', language: 'ar-SA', path: '/settings' },
  { width: 768, mode: 'dark', language: 'en', path: '/today' },
  { width: 1440, mode: 'light', language: 'en', path: '/' },
  { width: 1440, mode: 'dark', language: 'ar-SA', path: '/shopping' },
]

const installPresentation = async (page, { language, mode }) => {
  // Language and appearance are server-driven in the approved runtime: the
  // LocalizationContext language and the theme boot effect read the mocked
  // preferences endpoint, not i18next/localStorage keys.
  await overrideUserPreferences(
    page,
    smokePreferences({ appearance: mode, language }),
  )
}

const disableAnimations = async page => {
  await page.addInitScript(() => {
    const inject = () => {
      const style = document.createElement('style')
      style.textContent =
        '*, *::before, *::after { animation: none !important; transition: none !important; }'
      document.documentElement.appendChild(style)
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject)
    } else {
      inject()
    }
  })
}

for (const scenario of CASES) {
  test(`phase 1: ${scenario.width}px ${scenario.mode} ${scenario.language} ${scenario.path}`, async ({
    page,
  }) => {
    const runtimeGuard = attachRuntimeErrorGuard(page)
    await page.setViewportSize({ width: scenario.width, height: 900 })
    await installApiMocks(page)
    await installSmokeSession(page)
    await installPresentation(page, scenario)
    await disableAnimations(page)

    await page.goto(scenario.path, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)

    await expect(page.locator('#root')).toBeVisible()
    const direction = scenario.language.startsWith('ar') ? 'rtl' : 'ltr'
    await expect(page.locator('html')).toHaveAttribute('dir', direction)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(scenario.width)

    if (scenario.width > 768) {
      const sidebar = page.locator('.sidebar')
      await expect(sidebar).toBeVisible()
      const bounds = await sidebar.boundingBox()
      expect(bounds?.width).toBe(244)
      if (direction === 'rtl') expect(bounds?.x).toBe(scenario.width - 244)
      else expect(bounds?.x).toBe(0)
      await expect(page.locator('.mobile-nav')).toBeHidden()
    } else {
      await expect(page.locator('.mobile-nav')).toBeVisible()
      await expect(page.locator('.sidebar')).toBeHidden()
    }

    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(() => document.activeElement !== document.body),
    ).toBe(true)
    runtimeGuard.assertClean()
  })
}

import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

// Phase 2 workflow surfaces on the approved runtime: dense lists, shopping,
// project boards, and the local search surface.
const ROUTES = ['/routines', '/shopping', '/all-tasks', '/projects', '/search']

const CASES = [
  { width: 390, mode: 'light', language: 'en' },
  { width: 390, mode: 'dark', language: 'ar-SA' },
  { width: 768, mode: 'light', language: 'ar-SA' },
  { width: 1024, mode: 'dark', language: 'en' },
  { width: 1440, mode: 'dark', language: 'en' },
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

for (const path of ROUTES) {
  for (const scenario of CASES) {
    test(`phase 2: ${path} ${scenario.width}px ${scenario.mode} ${scenario.language}`, async ({
      page,
    }) => {
      const runtimeGuard = attachRuntimeErrorGuard(page)
      await page.setViewportSize({ width: scenario.width, height: 900 })
      await installApiMocks(page)
      await installSmokeSession(page)
      await installPresentation(page, scenario)
      await disableAnimations(page)

      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => document.fonts.ready)

      await expect(page.locator('#root')).toBeVisible()
      const direction = scenario.language.startsWith('ar') ? 'rtl' : 'ltr'
      await expect(page.locator('html')).toHaveAttribute('dir', direction)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(scenario.width)

      if (scenario.width > 768) {
        await expect(page.locator('.sidebar')).toBeVisible()
      } else {
        await expect(page.locator('.mobile-nav')).toBeVisible()
        await expect(page.locator('.sidebar')).toBeHidden()
      }

      runtimeGuard.assertClean()
    })
  }
}

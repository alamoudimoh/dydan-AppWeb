import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const CASES = [
  { width: 390, mode: 'light', language: 'en', path: '/' },
  { width: 390, mode: 'dark', language: 'ar-SA', path: '/chores' },
  { width: 768, mode: 'light', language: 'ar-SA', path: '/settings' },
  { width: 768, mode: 'dark', language: 'en', path: '/settings/account' },
  { width: 1440, mode: 'light', language: 'en', path: '/' },
  { width: 1440, mode: 'dark', language: 'ar-SA', path: '/settings' },
]

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

const installPresentation = async (page, { language, mode }) => {
  await page.addInitScript(
    ({ locale, theme }) => {
      localStorage.setItem('joy-mode', theme)
      localStorage.setItem('themeMode', JSON.stringify(theme))
      localStorage.setItem('i18nextLng', locale)
      localStorage.setItem('language', JSON.stringify(locale))
    },
    { locale: language, theme: mode },
  )
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

    if (scenario.width >= 900) {
      const sidebar = page.locator('.sidebar')
      await expect(sidebar).toBeVisible()
      const bounds = await sidebar.boundingBox()
      expect(bounds?.width).toBe(244)
      if (direction === 'rtl') expect(bounds?.x).toBe(scenario.width - 244)
      else expect(bounds?.x).toBe(0)
    } else {
      const menu = page.getByRole('button', { name: /open menu|فتح القائمة/i })
      await expect(menu).toBeVisible()
      await menu.click()
      const drawer = page.locator('.figma-mobile-drawer')
      await expect(drawer).toBeVisible()
      const bounds = await drawer.boundingBox()
      if (direction === 'rtl')
        expect(bounds?.x + bounds?.width).toBe(scenario.width)
      else expect(bounds?.x).toBe(0)
      await page.keyboard.press('Escape')
      await expect(drawer).toBeHidden()
    }

    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(() => document.activeElement !== document.body),
    ).toBe(true)
    runtimeGuard.assertClean()
  })
}

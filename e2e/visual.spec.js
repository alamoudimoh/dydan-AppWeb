import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { clearSmokeSession, installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'
import { assertPageShell } from './helpers/smokeRunner.js'
import { BROWSER_SMOKE_PAGES } from './smoke.manifest.js'

// Deterministic wall clock so any rendered date/time output is stable across
// runs and CI. January 15, 2026 12:00 UTC.
const FIXED_NOW = Date.UTC(2026, 0, 15, 12, 0, 0)

// Representative critical surfaces: the 10 original routes in light theme,
// plus a small dark-mode subset.
const LIGHT_ROUTES = BROWSER_SMOKE_PAGES.map(page => page.path)
const DARK_ROUTES = ['/', '/family', '/settings']

const ROUTE_BY_PATH = Object.fromEntries(
  BROWSER_SMOKE_PAGES.map(page => [page.path, page]),
)

const snapshotName = (theme, route) =>
  `${theme}-${route.replace(/\//g, '_') || 'home'}.png`

const freezeClock = async page => {
  await page.clock.install({ time: new Date(FIXED_NOW) })
}

const setThemeMode = async (page, theme) => {
  await page.addInitScript(
    ({ mode }) => {
      // 'joy-mode' is the MUI Joy color-scheme storage key (stored raw);
      // 'themeMode' drives the app's own dark-class logic (stored as JSON).
      // Both must agree for a deterministic theme.
      localStorage.setItem('joy-mode', mode)
      localStorage.setItem('themeMode', JSON.stringify(mode))
    },
    { mode: theme },
  )
}

const disableAnimations = async page => {
  await page.addInitScript(() => {
    const inject = () => {
      if (!document.documentElement) {
        return
      }
      const style = document.createElement('style')
      style.textContent = `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }
      `
      document.documentElement.appendChild(style)
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject)
    } else {
      inject()
    }
  })
}

const prepareRoute = async (page, descriptor, theme) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await freezeClock(page)
  if (descriptor.auth) {
    await installSmokeSession(page)
  } else {
    await clearSmokeSession(page)
  }
  await setThemeMode(page, theme)
  await disableAnimations(page)
  return runtimeGuard
}

const captureRoute = async (page, descriptor, theme) => {
  await page.goto(descriptor.path, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await assertPageShell(page, descriptor)
  await page.evaluate(() => document.fonts.ready)
  // Allow layout to settle after fonts load for stable output.
  await page.waitForTimeout(250)
  await expect(page).toHaveScreenshot(snapshotName(theme, descriptor.path))
}

for (const route of LIGHT_ROUTES) {
  const descriptor = ROUTE_BY_PATH[route]
  test(`visual: light ${route}`, async ({ page }) => {
    const runtimeGuard = await prepareRoute(page, descriptor, 'light')
    await captureRoute(page, descriptor, 'light')
    runtimeGuard.assertClean()
  })
}

for (const route of DARK_ROUTES) {
  const descriptor = ROUTE_BY_PATH[route]
  test(`visual: dark ${route}`, async ({ page }) => {
    const runtimeGuard = await prepareRoute(page, descriptor, 'dark')
    await captureRoute(page, descriptor, 'dark')
    runtimeGuard.assertClean()
  })
}

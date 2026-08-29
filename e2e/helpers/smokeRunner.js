import { expect } from '@playwright/test'

import { installApiMocks } from '../fixtures/apiMocks.js'
import { clearSmokeSession, installSmokeSession } from '../fixtures/auth.js'
import { attachRuntimeErrorGuard } from './runtimeErrors.js'

export const assertPageShell = async (
  page,
  { auth, fullscreen, heading, nav, text },
) => {
  await expect(page.locator('#root')).toBeVisible()
  await expect(page.locator('#root')).not.toBeEmpty()

  if (heading) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }

  if (text) {
    await expect(page.getByText(text)).toBeVisible()
  }

  if (!heading && !text) {
    throw new Error('Smoke routes must assert a heading or primary page text')
  }

  if (nav) {
    const desktopNavigation = page.locator('.sidebar')
    const mobileNavigationTrigger = page.getByRole('button', {
      name: /open menu/i,
    })
    await expect(desktopNavigation.or(mobileNavigationTrigger)).toBeVisible()
  } else if (auth && !fullscreen) {
    throw new Error(
      'Authenticated smoke routes must assert the navigation shell',
    )
  }
}

export const defineRouteSmokeTests = (test, pages) => {
  for (const smokePage of pages) {
    test(`smoke: ${smokePage.path}`, async ({ page }) => {
      const runtimeGuard = attachRuntimeErrorGuard(page)
      await installApiMocks(page)

      if (smokePage.auth) {
        await installSmokeSession(page)
      } else {
        await clearSmokeSession(page)
      }

      await page.goto(smokePage.path, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle')
      await assertPageShell(page, smokePage)
      runtimeGuard.assertClean()
    })
  }
}

import { expect } from '@playwright/test'

import { installApiMocks } from '../fixtures/apiMocks.js'
import { clearSmokeSession, installSmokeSession } from '../fixtures/auth.js'
import { attachRuntimeErrorGuard } from './runtimeErrors.js'

/** Viewport variants every smoke route runs through (desktop + phone portrait). */
export const SMOKE_VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile-390x844', width: 390, height: 844 },
]

/** The approved runtime switches nav at 768px: desktop .sidebar, mobile .mobile-nav. */
export const MOBILE_BREAKPOINT = 768

export const assertPageShell = async (
  page,
  { auth, fullscreen, heading, nav, text },
  { viewportWidth = 1280 } = {},
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
    if (viewportWidth <= MOBILE_BREAKPOINT) {
      await expect(page.locator('.mobile-nav')).toBeVisible()
    } else {
      await expect(page.locator('.sidebar')).toBeVisible()
    }
  } else if (auth && !fullscreen) {
    throw new Error(
      'Authenticated smoke routes must assert the navigation shell',
    )
  }
}

export const defineRouteSmokeTests = (test, pages) => {
  for (const smokePage of pages) {
    for (const viewport of SMOKE_VIEWPORTS) {
      const isDesktop = viewport.name === 'desktop'
      test(`smoke: ${smokePage.path}${isDesktop ? '' : ` (${viewport.name})`}`, async ({
        page,
      }) => {
        const runtimeGuard = attachRuntimeErrorGuard(page)
        await installApiMocks(page)
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        })

        if (smokePage.auth) {
          await installSmokeSession(page)
        } else {
          await clearSmokeSession(page)
        }

        await page.goto(smokePage.path, { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle')
        await assertPageShell(page, smokePage, {
          viewportWidth: viewport.width,
        })
        runtimeGuard.assertClean()
      })
    }
  }
}

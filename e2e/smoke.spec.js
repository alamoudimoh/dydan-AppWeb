import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { clearSmokeSession, installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'
import { BROWSER_SMOKE_PAGES } from './smoke.manifest.js'

const assertPageShell = async (page, { auth, heading, text, nav }) => {
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
    await expect(
      page.getByRole('button', { name: /open menu/i }),
    ).toBeVisible()
  } else if (auth) {
    throw new Error('Authenticated smoke routes must assert the navigation shell')
  }
}

for (const smokePage of BROWSER_SMOKE_PAGES) {
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

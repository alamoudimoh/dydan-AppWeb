import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const installPhaseFiveData = async page => {
  await installApiMocks(page)
  await installSmokeSession(page)
}

test('Phase 5 Figma household routes render their live screen headings', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installPhaseFiveData(page)

  for (const [path, heading] of [
    ['/projects', 'Projects'],
    ['/routines', 'Routines'],
    ['/shopping', 'Shopping'],
    ['/maintenance', 'Assets'],
    ['/goals', 'Goals'],
    ['/activity', 'Activity'],
    ['/notifications', 'Notifications'],
    ['/rewards', 'Rewards'],
    ['/progress', 'Progress'],
  ]) {
    await page.goto(path, { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible()
  }
  runtimeGuard.assertClean()
})

test('Phase 5 household navigation preserves the Progress sidebar link', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installPhaseFiveData(page)
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto('/', { waitUntil: 'networkidle' })
  await page
    .locator('.sidebar')
    .getByRole('button', { name: 'Progress', exact: true })
    .click()
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/progress$/)
  await expect(
    page.getByRole('heading', { name: 'Progress', exact: true }),
  ).toBeVisible()
  runtimeGuard.assertClean()
})

import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

test.beforeEach(async ({ page }) => {
  await installApiMocks(page)
  await installSmokeSession(page)
})

test('legacy maintenance deep link redirects to canonical Assets', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await page.goto('/maintenance', { waitUntil: 'networkidle' })

  await expect(page).toHaveURL(/\/assets$/)
  await expect(
    page.getByRole('heading', { name: 'Assets', exact: true }),
  ).toBeVisible()
  runtimeGuard.assertClean()
})

test('global page headers share one structural contract', async ({ page }) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  const routes = [
    ['/today', 'Today'],
    ['/all-tasks', 'All Tasks'],
    ['/calendar', 'Calendar'],
    ['/projects', 'Projects'],
    ['/routines', 'Routines'],
    ['/assets', 'Assets'],
    ['/shopping', 'Shopping lists'],
    ['/goals', 'Goals'],
    ['/rewards', 'Rewards'],
    ['/progress', 'Progress'],
    ['/activity', 'Activity'],
    ['/notifications', 'Notifications'],
    ['/settings', 'Settings'],
    ['/search', 'Search'],
  ]

  for (const [path, title] of routes) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const header = page.locator('.page-header')
    await expect(header).toHaveCount(1)
    await expect(
      header.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible()
    await expect(header.locator('.page-header-copy')).toHaveCount(1)
  }
  runtimeGuard.assertClean()
})

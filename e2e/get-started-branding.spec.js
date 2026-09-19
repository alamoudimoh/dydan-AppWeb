import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { clearSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

test('get-started renders the canonical dydan identity without legacy Donetick branding', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await clearSmokeSession(page)

  await page.goto('/get-started', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  await expect(
    page.getByRole('heading', { level: 1, name: 'dydan', exact: true }),
  ).toBeVisible()
  await expect(page.locator('#root')).not.toContainText(/donetick/i)
  await expect(page.locator('#root')).toContainText(
    'Create an account to sync everywhere, or sign in and pick up where you left off.',
  )

  runtimeGuard.assertClean()
})

test('get-started navigation still routes to signup and login', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await clearSmokeSession(page)

  await page.goto('/get-started', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Create an account' }).click()
  await expect(page).toHaveURL(/\/signup$/)

  await page.goto('/get-started', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Already have an account?' }).click()
  await expect(page).toHaveURL(/\/login$/)

  runtimeGuard.assertClean()
})

test('get-started keeps the canonical identity valid under Arabic (ar-SA) RTL', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'ar-SA')
    localStorage.setItem('language', JSON.stringify('ar-SA'))
  })
  await installApiMocks(page)
  await clearSmokeSession(page)

  await page.goto('/get-started', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  expect(
    await page.evaluate(() => document.documentElement.getAttribute('dir')),
  ).toBe('rtl')
  expect(
    await page.evaluate(() => document.documentElement.getAttribute('lang')),
  ).toBe('ar-SA')
  await expect(
    page.getByRole('heading', { level: 1, name: 'dydan', exact: true }),
  ).toBeVisible()
  await expect(page.locator('#root')).toContainText(
    'أنشئ حسابًا للمزامنة في كل مكان، أو سجّل الدخول لتكمل من حيث توقفت.',
  )

  runtimeGuard.assertClean()
})

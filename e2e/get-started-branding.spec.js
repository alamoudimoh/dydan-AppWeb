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
    page.getByRole('heading', { level: 1, name: 'Welcome back', exact: true }),
  ).toBeVisible()
  await expect(page.locator('#root')).toContainText('dydan')
  await expect(page.locator('#root')).toContainText('Household Management')
  await expect(page.locator('#root')).not.toContainText(/donetick/i)
  await expect(page.locator('#root')).toContainText(
    'Sign in to manage your household.',
  )

  runtimeGuard.assertClean()
})

test('get-started toggles between the sign-in and account-creation surfaces', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await clearSmokeSession(page)

  await page.goto('/get-started', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Create an account' }).click()
  await expect(
    page.getByRole('heading', {
      name: 'Keep your whole household running smoothly',
      exact: true,
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Sign in instead' }).click()
  await expect(
    page.getByRole('heading', { name: 'Welcome back', exact: true }),
  ).toBeVisible()

  runtimeGuard.assertClean()
})

test('get-started stays on the canonical English identity at ar-SA storage before sign-in', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'ar-SA')
    localStorage.setItem('language', JSON.stringify('ar-SA'))
  })
  await installApiMocks(page)
  await clearSmokeSession(page)

  // Preferences never load while signed out, so direction/language resolve to
  // the default identity (ltr/en) even when storage requests ar-SA. Arabic RTL
  // coverage for authenticated screens lives in smoke.arabic.spec.js.
  await page.goto('/get-started', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(
    page.getByRole('heading', { name: 'Welcome back', exact: true }),
  ).toBeVisible()
  await expect(page.locator('#root')).not.toContainText(/donetick/i)

  runtimeGuard.assertClean()
})

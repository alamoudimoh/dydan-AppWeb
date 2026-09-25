import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

test('settings: email change requires a verified delivery transaction', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.goto('/settings', { waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: /^profile$/i }).click()

  const emailRow = page
    .getByText('Email', { exact: true })
    .locator('xpath=../..')
  await emailRow.getByRole('button', { name: 'Change' }).click()
  const dialog = page
    .getByRole('dialog')
    .or(page.locator('.modal-panel', { hasText: 'Change email address' }))
  await dialog.getByLabel('New email address').fill('new@example.test')
  await dialog.getByLabel('Current password').fill('current-password')
  await dialog.getByRole('button', { name: 'Send verification' }).click()
  await expect(page.getByText(/Verification email sent/)).toBeVisible()
  runtimeGuard.assertClean()
})

test('email change verification link completes through the real public API contract', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.goto('/email-change/verify?token=single-use-token', {
    waitUntil: 'networkidle',
  })
  await page.getByRole('button', { name: 'Confirm new email' }).click()
  await expect(
    page.getByText('Email address updated. Please sign in again.'),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  runtimeGuard.assertClean()
})

test('email change keeps the re-authentication form open when delivery fails', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  runtimeGuard.expectStatusError(503)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.route('**/api/v1/users/email-change', route =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error:
          'Could not send the verification email. Check delivery settings and try again.',
      }),
    }),
  )
  await page.goto('/settings', { waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: /^profile$/i }).click()
  const emailRow = page
    .getByText('Email', { exact: true })
    .locator('xpath=../..')
  await emailRow.getByRole('button', { name: 'Change' }).click()
  const dialog = page.locator('.modal-panel', {
    hasText: 'Change email address',
  })
  await dialog.getByLabel('New email address').fill('new@example.test')
  await dialog.getByLabel('Current password').fill('current-password')
  await dialog.getByRole('button', { name: 'Send verification' }).click()
  await expect(dialog).toBeVisible()
  await expect(
    page.getByText(
      'Could not send the verification email. Check delivery settings and try again.',
    ),
  ).toBeVisible()
  runtimeGuard.assertClean()
})

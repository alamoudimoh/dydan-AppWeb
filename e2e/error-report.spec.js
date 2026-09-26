import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const openReport = async page => {
  await page.goto('/error', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Report this problem' }).click()
  await expect(page.getByText('dydan error report')).toBeVisible()
}

test('error screen submits the displayed diagnostic to the real report endpoint', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  let report
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.route('**/api/v1/users/error-reports', route => {
    report = route.request().postDataJSON()
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ res: { id: 44 } }),
    })
  })

  await openReport(page)
  await page.getByRole('button', { name: 'Send report' }).click()
  await expect
    .poll(() => report)
    .toMatchObject({
      screen: 'error',
      summary: expect.stringContaining('Client error on /error'),
      details: expect.stringContaining('dydan error report'),
    })
  await expect(
    page.getByText('Your administrator can now see this report.'),
  ).toBeVisible()
  runtimeGuard.assertClean()
})

test('error screen never claims a failed report was sent', async ({ page }) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  runtimeGuard.expectStatusError(500)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.route('**/api/v1/users/error-reports', route =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Report service unavailable' }),
    }),
  )

  await openReport(page)
  await page.getByRole('button', { name: 'Send report' }).click()
  await expect(page.getByRole('alert')).toHaveText('Report service unavailable')
  await expect(page.getByRole('button', { name: 'Send report' })).toBeVisible()
  await expect(
    page.getByText('Your administrator can now see this report.'),
  ).toBeHidden()
  runtimeGuard.assertClean()
})

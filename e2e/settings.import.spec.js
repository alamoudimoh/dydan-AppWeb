import { Buffer } from 'node:buffer'

import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

test('settings: imported data restores preferences through the server', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.goto('/settings', { waitUntil: 'networkidle' })

  // Build a portable export document that belongs to this account, with a
  // visible preference change, exactly as the export endpoint would emit it.
  const document = {
    format: 'dydan-user-export/v1',
    exportedAt: '2026-08-24T06:00:00Z',
    account: {
      id: 1,
      username: 'smoke-user',
      displayName: 'Smoke User',
      email: 'smoke@example.test',
      timezone: 'UTC',
      circleId: 3,
      userType: 0,
    },
    preferences: {
      theme: 'dydan',
      appearance: 'light',
      language: 'en',
      currency: 'EUR',
      notifications: { taskReminders: true },
      privacy: { activityVisible: true },
    },
  }

  await page.getByRole('tab', { name: /^advanced$/i }).click()
  await page.getByLabel('Import data file').setInputFiles({
    name: 'dydan-my-data.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(document), 'utf8'),
  })
  await expect(
    page.getByText('Your settings were restored from the export file'),
  ).toBeVisible()

  // The import must be applied by the server, so the restored currency is what
  // a later read returns and survives a reload. The Currency row renders an
  // unlabeled select, so it is scoped through the row's own label text.
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: /language & region/i }).click()
  const currencyRow = page
    .getByText('Currency', { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"min-w-0")]/..')
  await expect(currencyRow.getByRole('combobox')).toContainText('EUR')
  runtimeGuard.assertClean()
})

test('settings: import rejects a document belonging to another account', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  // The 4xx resource load below is provoked on purpose by this negative path.
  runtimeGuard.expectStatusError(403)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.goto('/settings', { waitUntil: 'networkidle' })

  const foreignDocument = {
    format: 'dydan-user-export/v1',
    account: { id: 99, email: 'someone-else@example.test' },
    preferences: { currency: 'GBP' },
  }

  await page.getByRole('tab', { name: /^advanced$/i }).click()
  await page.getByLabel('Import data file').setInputFiles({
    name: 'someone-elses-export.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(foreignDocument), 'utf8'),
  })

  // The server refuses a cross-account restore; the UI must surface the
  // failure rather than claim success.
  await expect(
    page.getByText('This export file belongs to a different account'),
  ).toBeVisible()
  await expect(
    page.getByText('Your settings were restored from the export file'),
  ).toHaveCount(0)
  runtimeGuard.assertClean()
})

import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

test('asset links, readings, tracker state, and metadata persist across reload', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.goto('/maintenance', { waitUntil: 'networkidle' })

  // Asset and meter creation use the real mutation contracts and stateful mock
  // server; both records must remain after a browser reload. Creation fields
  // live inside Project-pattern modals opened from explicit header actions.
  await page.getByRole('button', { name: 'New asset' }).click()
  await page.getByLabel('Asset name').fill('Family car')
  await page.getByRole('button', { name: 'Create asset' }).click()
  await expect(page.getByText('Family car', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Meters \(0\)/ }).click()
  await page.getByRole('button', { name: 'New meter' }).click()
  await page.getByLabel('Meter name').fill('Odometer')
  await page.getByLabel('Unit').selectOption('km')
  await page.getByLabel('Initial reading').fill('100')
  await page.getByRole('button', { name: 'Create meter' }).click()
  await expect(page.getByText('Odometer', { exact: true })).toBeVisible()
  await page.getByLabel('New reading for Odometer').fill('125')
  await page.getByRole('button', { name: 'Save reading' }).click()
  await expect(page.getByText(/125 km/)).toBeVisible()

  await page.getByRole('button', { name: /Assets \(1\)/ }).click()
  const asset = page.locator('.card', { hasText: 'Family car' })
  await asset.getByRole('button', { name: 'Details' }).click()
  await asset
    .getByLabel('Meter to link')
    .selectOption({ label: 'Odometer (km)' })
  // The Link action is shared by the mutually exclusive meter/task selectors.
  await asset.getByRole('button', { name: 'Link' }).click()
  await expect(asset.getByText(/Odometer \(125 km\)/)).toBeVisible()

  await page.getByRole('button', { name: /Trackers \(0\)/ }).click()
  await page.getByRole('button', { name: 'New tracker' }).click()
  await page.getByLabel('Tracker name').fill('Garage light')
  await page.getByLabel('Type').selectOption('boolean')
  await page.getByRole('button', { name: 'Create tracker' }).click()
  await page.getByRole('button', { name: 'Turn on' }).click()
  await expect(page.getByText('on', { exact: true })).toBeVisible()

  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByText('Family car', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Meters \(1\)/ }).click()
  await expect(page.getByText(/125 km/)).toBeVisible()
  await page.getByRole('button', { name: /Trackers \(1\)/ }).click()
  await expect(page.getByText('Garage light', { exact: true })).toBeVisible()
  await expect(page.getByText('on', { exact: true })).toBeVisible()
  runtimeGuard.assertClean()
})

import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

test('settings: integrations report capability status and webhook can be saved and persisted', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.goto('/settings', { waitUntil: 'networkidle' })

  // The rows must reflect true availability instead of hardcoded "Unavailable"
  // text. The fixture mocks the capability endpoint with real per-integration
  // status (googleCalendar/caldav/alexa = not configured, webhooks = editable),
  // and each provider row reports that state as its value.
  await page.getByRole('tab', { name: 'Integrations', exact: true }).click()
  for (const label of ['Google Calendar', 'Apple Calendar', 'Amazon Alexa']) {
    const row = page
      .getByText(label, { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"flex")]')
      .first()
    await expect(row.getByText('Not configured', { exact: true })).toBeVisible()
  }

  // The Save button is a sibling of the input inside the row's flex-shrink-0
  // controls container. Rows render as plain markup, so scope by the labeled
  // input rather than an ARIA row role (which the DOM does not expose).
  const webhookInput = page.getByLabel('Webhook endpoint URL')
  await webhookInput.fill('https://hooks.smoke.test/dydan')
  await webhookInput
    .locator('xpath=ancestor::div[contains(@class,"flex-shrink-0")]')
    .getByRole('button', { name: 'Save' })
    .click()

  // The save invalidates the integrations query and refetches, so the Clear
  // control reappearing proves the stored endpoint round-tripped through the
  // server rather than living in local state.
  await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible()

  // Reload persistence: the endpoint must still be configured after a full
  // reload, and saving an empty draft must remove it server-side.
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: 'Integrations', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible()

  await webhookInput.fill('')
  await webhookInput
    .locator('xpath=ancestor::div[contains(@class,"flex-shrink-0")]')
    .getByRole('button', { name: 'Save' })
    .click()
  await expect(page.getByRole('button', { name: 'Clear' })).toBeHidden()
  await expect(page.getByLabel('Webhook endpoint URL')).toHaveValue('')
  runtimeGuard.assertClean()
})

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
  // status (googleCalendar/caldav/alexa = not configured, webhooks = editable).
  await page.getByRole('tab', { name: 'Integrations', exact: true }).click()
  await expect(
    page.getByText('Google Calendar sync is not configured on this server', {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByText(
      'CalDAV account authorization is not configured on this server',
      {
        exact: true,
      },
    ),
  ).toBeVisible()
  await expect(
    page.getByText(
      'Alexa skill credentials are not configured on this server',
      {
        exact: true,
      },
    ),
  ).toBeVisible()

  // The Save button is a sibling of the input inside the row's flex-shrink-0
  // controls container. Rows render as plain markup, so scope by the labeled
  // input rather than an ARIA row role (which the DOM does not expose).
  const webhookInput = page.getByLabel('Webhook endpoint URL')
  await webhookInput.fill('https://hooks.smoke.test/dydan')
  await webhookInput
    .locator('xpath=ancestor::div[contains(@class,"flex-shrink-0")]')
    .getByRole('button', { name: 'Save' })
    .click()

  // The save invalidates the integrations query and refetches, so seeing the
  // saved URL here proves it round-tripped through the server, not local state.
  const delivering = page.getByText(
    'Delivering events to https://hooks.smoke.test/dydan',
    { exact: true },
  )
  await expect(delivering).toBeVisible()

  // Reload persistence: the endpoint must still be configured after a full
  // reload, and Clear must remove it server-side.
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: 'Integrations', exact: true }).click()
  await expect(
    page.getByText('Delivering events to https://hooks.smoke.test/dydan', {
      exact: true,
    }),
  ).toBeVisible()

  await webhookInput.fill('')
  await webhookInput
    .locator('xpath=ancestor::div[contains(@class,"flex-shrink-0")]')
    .getByRole('button', { name: 'Save' })
    .click()
  await expect(
    page.getByText(
      'Configure an endpoint to receive chore and maintenance events',
      { exact: true },
    ),
  ).toBeVisible()
  runtimeGuard.assertClean()
})

import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

test('settings: export my data downloads the authenticated portable export', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.goto('/settings', { waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: /^advanced$/i }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  const exported = await download
  expect(exported.suggestedFilename()).toBe('dydan-my-data.json')
  const stream = await exported.createReadStream()
  let body = ''
  for await (const chunk of stream) body += chunk
  expect(JSON.parse(body)).toMatchObject({
    format: 'dydan-user-export/v1',
    data: { tasks: [], meters: [], things: [] },
  })
  runtimeGuard.assertClean()
})

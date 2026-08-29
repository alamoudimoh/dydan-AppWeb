import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const installPhaseFiveData = async page => {
  await installApiMocks(page)
  await installSmokeSession(page)
}

test('Phase 5 Figma household routes render their live screen headings', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installPhaseFiveData(page)

  for (const [path, heading] of [
    ['/projects', 'Projects'],
    ['/routines', 'Routines'],
    ['/shopping', 'Shopping'],
    ['/maintenance', 'Maintenance'],
    ['/activities', 'Activity'],
  ]) {
    await page.goto(path, { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible()
  }

  await page.goto('/family', { waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: /Goals/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Goals & Progress' }),
  ).toBeVisible()
  runtimeGuard.assertClean()
})

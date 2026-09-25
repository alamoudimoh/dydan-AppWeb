import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

test('sidebar preference controls persist their live choices across reloads', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.goto('/', { waitUntil: 'networkidle' })

  const sidebar = page.getByRole('navigation', { name: 'Main navigation' })
  const html = page.locator('html')

  // The quick sidebar controls must update the same real preferences document
  // that Settings uses, not a throwaway React-only view state.
  await sidebar
    .getByRole('group', { name: 'View mode' })
    .getByRole('button', { name: 'Quest', exact: true })
    .click()
  await expect(
    sidebar.getByRole('group', { name: 'View mode' }).getByRole('button', {
      name: 'Quest',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true')

  await sidebar.getByRole('button', { name: 'Sovereign', exact: true }).click()
  await expect(html).toHaveAttribute('data-theme', 'sovereign')

  await page.reload({ waitUntil: 'networkidle' })
  await expect(html).toHaveAttribute('data-theme', 'sovereign')
  await expect(
    sidebar.getByRole('group', { name: 'View mode' }).getByRole('button', {
      name: 'Quest',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true')

  await sidebar.getByRole('button', { name: 'Toggle side panel' }).click()
  await expect(sidebar).toHaveClass(/collapsed/)
  await page.reload({ waitUntil: 'networkidle' })
  await expect(sidebar).toHaveClass(/collapsed/)

  // Language remains actionable when the sidebar is collapsed and uses the
  // same persisted `language` field as Settings.
  await sidebar.getByRole('button', { name: /العربية/ }).click()
  await expect(html).toHaveAttribute('dir', 'rtl')
  await page.reload({ waitUntil: 'networkidle' })
  await expect(html).toHaveAttribute('dir', 'rtl')
  runtimeGuard.assertClean()
})

import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

/**
 * Runtime theme picker: the two product themes (Dydan / Sovereign) × the
 * three appearance styles (Light / Dark / Automatic) must all switch live from
 * Settings without a reload, and the persisted choice must survive a reload.
 *
 * The approved runtime exposes theme as `data-theme="sovereign"` (dydan omits
 * the attribute) and the resolved appearance as `data-joy-color-scheme`.
 * Settings persists through PUT /users/preferences, which the fixture keeps in
 * memory across reloads.
 */
const cssVar = async (page, name) =>
  (
    await page.evaluate(
      value =>
        getComputedStyle(document.documentElement).getPropertyValue(value),
      name,
    )
  ).trim()

test('settings: theme (Dydan/Sovereign) and appearance (Light/Dark/Automatic) switch live and persist', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await page.getByRole('tab', { name: /^theme$/i }).click()

  const html = page.locator('html')
  const themePanel = page.locator('.MuiTabPanel-root', {
    hasText: 'Choose your visual identity',
  })
  await expect(themePanel).toBeVisible()

  // Defaults: Dydan theme, light style (smoke preferences default).
  await expect(html).not.toHaveAttribute('data-theme', 'sovereign')
  await expect(html).toHaveAttribute('data-joy-color-scheme', 'light')
  expect((await cssVar(page, '--brand')).toLowerCase()).toBe('#34236d')
  expect((await cssVar(page, '--page')).toLowerCase()).toBe('#fff8e8')

  // Switch to Sovereign: data-theme flips, dark is the native appearance.
  await themePanel
    .getByRole('button', { name: /sovereign navy & brass/i })
    .click()
  await expect(html).toHaveAttribute('data-theme', 'sovereign')
  await expect(html).toHaveAttribute('data-joy-color-scheme', 'dark')
  expect((await cssVar(page, '--page')).toLowerCase()).toBe('#071a2c')
  expect((await cssVar(page, '--brand')).toLowerCase()).toBe('#e0b45a')

  // Light over Sovereign: ivory page, navy brand.
  await themePanel.getByRole('button', { name: 'Light', exact: true }).click()
  await expect(html).toHaveAttribute('data-joy-color-scheme', 'light')
  expect((await cssVar(page, '--page')).toLowerCase()).toBe('#f6f2e8')
  expect((await cssVar(page, '--brand')).toLowerCase()).toBe('#071a2c')

  // The persisted Sovereign + Light choice survives a reload (the fixture
  // keeps the mocked preferences in memory across navigations).
  await page.reload({ waitUntil: 'networkidle' })
  await expect(html).toHaveAttribute('data-theme', 'sovereign')
  await expect(html).toHaveAttribute('data-joy-color-scheme', 'light')
  expect((await cssVar(page, '--brand')).toLowerCase()).toBe('#071a2c')

  // Back to Dydan + Automatic (headless CI resolves Automatic to light).
  await page.getByRole('tab', { name: /^theme$/i }).click()
  const resumedPanel = page.locator('.MuiTabPanel-root', {
    hasText: 'Choose your visual identity',
  })
  await resumedPanel
    .getByRole('button', { name: /^dydan Rhythm Violet \+ Gold$/i })
    .click()
  await expect(html).not.toHaveAttribute('data-theme', 'sovereign')
  await resumedPanel
    .getByRole('button', { name: 'Automatic', exact: true })
    .click()
  await expect(html).toHaveAttribute('data-joy-color-scheme', 'light')
  await expect.poll(() => cssVar(page, '--brand')).toBe('#34236d')

  runtimeGuard.assertClean()
})

test('settings: notification delivery choices persist through reload', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await page.getByRole('tab', { name: /^notifications$/i }).click()

  const notificationPanel = page.locator('.MuiTabPanel-root', {
    hasText: "Choose what you're notified about and how.",
  })
  const taskReminders = notificationPanel
    .getByText('Task reminders', { exact: true })
    .locator('xpath=../..')
    .getByRole('switch')
  const emailChannel = notificationPanel
    .getByText('Email notifications', { exact: true })
    .locator('xpath=../..')
    .getByRole('switch')

  await expect(taskReminders).toBeChecked()
  await expect(emailChannel).not.toBeChecked()
  await taskReminders.click()
  await emailChannel.click()
  await expect(taskReminders).not.toBeChecked()
  await expect(emailChannel).toBeChecked()

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: /^notifications$/i }).click()
  await expect(taskReminders).not.toBeChecked()
  await expect(emailChannel).toBeChecked()
  runtimeGuard.assertClean()
})

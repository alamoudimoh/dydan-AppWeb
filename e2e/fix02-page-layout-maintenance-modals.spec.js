import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const prepare = async (page, preferences = {}) => {
  await installApiMocks(page)
  await installSmokeSession(page)
  await overrideUserPreferences(page, smokePreferences(preferences))
}

const PRIMARY_PATHS = [
  '/',
  '/today',
  '/all-tasks',
  '/calendar',
  '/projects',
  '/routines',
  '/maintenance',
  '/shopping',
  '/goals',
  '/rewards',
]

test('fix02: primary page titles share one visual anchor (desktop)', async ({
  page,
}) => {
  await prepare(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  const positions = []
  for (const path of PRIMARY_PATHS) {
    await page.goto(path)
    const title = page.getByTestId('page-title').first()
    await expect(title).toBeVisible()
    positions.push(
      await title.evaluate(element => element.getBoundingClientRect().top),
    )
  }
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(2)
})

test('fix02: primary page titles share one visual anchor (mobile)', async ({
  page,
}) => {
  await prepare(page)
  await page.setViewportSize({ width: 390, height: 900 })
  const positions = []
  for (const path of PRIMARY_PATHS) {
    await page.goto(path)
    const title = page.getByTestId('page-title').first()
    await expect(title).toBeVisible()
    positions.push(
      await title.evaluate(element => element.getBoundingClientRect().top),
    )
  }
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(2)
})

test('fix02: today eyebrow does not push the title down', async ({ page }) => {
  await prepare(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/all-tasks')
  const allTasksTop = await page
    .getByTestId('page-title')
    .first()
    .evaluate(element => element.getBoundingClientRect().top)
  await page.goto('/today')
  const todayTop = await page
    .getByTestId('page-title')
    .first()
    .evaluate(element => element.getBoundingClientRect().top)
  expect(Math.abs(todayTop - allTasksTop)).toBeLessThan(2)
})

test('fix02: maintenance creation fields are hidden until the dialog opens', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/maintenance')
  await expect(page.getByLabel('New maintenance asset name')).toHaveCount(0)
  await expect(page.getByLabel('New meter name')).toHaveCount(0)
  await expect(page.getByLabel('New thing name')).toHaveCount(0)
  await expect(page.locator('.modal-overlay')).toHaveCount(0)
})

test('fix02: create asset opens a Project-pattern modal', async ({ page }) => {
  await prepare(page)
  await page.goto('/maintenance')
  await page.getByRole('button', { name: 'New asset' }).click()
  const dialog = page.getByRole('dialog', { name: 'New asset' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('.modal-overlay')).toBeVisible()
  await expect(page.locator('.modal-panel')).toBeVisible()
  // Project-pattern structure: form-title header + section-label fields +
  // primary create / secondary cancel footer (not the task popup's flex-1).
  await expect(dialog.locator('.form-title')).toBeVisible()
  await expect(page.getByLabel('New maintenance asset name')).toBeVisible()
  await expect(page.getByLabel('New maintenance asset category')).toBeVisible()
  await expect(
    page.getByLabel('New maintenance asset description'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create asset' })).toBeVisible()
})

test('fix02: create meter opens a Project-pattern modal', async ({ page }) => {
  await prepare(page)
  await page.goto('/maintenance')
  await page.getByRole('button', { name: /Meters \(\d+\)/ }).click()
  await page.getByRole('button', { name: 'New meter' }).click()
  const dialog = page.getByRole('dialog', { name: 'New meter' })
  await expect(dialog).toBeVisible()
  await expect(page.getByLabel('New meter name')).toBeVisible()
  await expect(page.getByLabel('New meter unit')).toBeVisible()
  await expect(page.getByLabel('New meter initial reading')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create meter' })).toBeVisible()
})

test('fix02: create thing opens a Project-pattern modal', async ({ page }) => {
  await prepare(page)
  await page.goto('/maintenance')
  await page.getByRole('button', { name: /Things \(\d+\)/ }).click()
  await page.getByRole('button', { name: 'New thing' }).click()
  const dialog = page.getByRole('dialog', { name: 'New thing' })
  await expect(dialog).toBeVisible()
  await expect(page.getByLabel('New thing name')).toBeVisible()
  await expect(page.getByLabel('New thing type')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create thing' })).toBeVisible()
})

test('fix02: maintenance modals cancel without creating', async ({ page }) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await prepare(page)
  await page.goto('/maintenance')
  await page.getByRole('button', { name: 'New asset' }).click()
  await expect(page.locator('.modal-overlay')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.locator('.modal-overlay')).toHaveCount(0)
  await expect(page.getByLabel('New maintenance asset name')).toHaveCount(0)
  // Overlay + X dismissal also leaves no record behind.
  await page.getByRole('button', { name: 'New asset' }).click()
  await page.getByLabel('New maintenance asset name').fill('Should not save')
  await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } })
  await expect(page.locator('.modal-overlay')).toHaveCount(0)
  await expect(page.getByText('Should not save')).toHaveCount(0)
  runtimeGuard.assertClean()
})

test('fix02: existing project creation still works', async ({ page }) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await prepare(page)
  await page.goto('/projects')
  await expect(page.getByTestId('page-title')).toHaveText('Projects')
  await page.getByRole('button', { name: 'New project' }).click()
  // Project editor keeps its inline card workflow (not converted to a modal).
  await expect(
    page.locator('.form-title', { hasText: 'New project' }),
  ).toBeVisible()
  await page.getByPlaceholder('Project name').fill('Fix02 project')
  await page.getByPlaceholder('Project description').fill('Regression check')
  await expect(
    page.getByRole('button', { name: 'Create project' }),
  ).toBeVisible()
  // Cancel dismisses without creating.
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(
    page.locator('.form-title', { hasText: 'New project' }),
  ).toHaveCount(0)
  runtimeGuard.assertClean()
})

test('fix02: rtl rendering keeps header anchor and maintenance modals valid', async ({
  page,
}) => {
  await prepare(page, { language: 'ar-SA' })
  await page.goto('/maintenance')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByTestId('page-title').first()).toBeVisible()
  // Localized creation action resolves in Arabic.
  await page.getByRole('button', { name: 'أصل جديد' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByLabel('اسم أصل الصيانة الجديد')).toBeVisible()
  await page.getByRole('button', { name: 'إلغاء' }).click()
  await expect(page.locator('.modal-overlay')).toHaveCount(0)
  // Header anchor holds across pages in RTL too.
  await page.setViewportSize({ width: 1440, height: 900 })
  const positions = []
  for (const path of PRIMARY_PATHS) {
    await page.goto(path)
    const title = page.getByTestId('page-title').first()
    await expect(title).toBeVisible()
    positions.push(
      await title.evaluate(element => element.getBoundingClientRect().top),
    )
  }
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(2)
})

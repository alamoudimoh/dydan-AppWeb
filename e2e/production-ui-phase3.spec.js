import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const ROUTES = [
  '/calendar',
  '/archived',
  '/notifications',
  '/meters',
  '/maintenance',
  '/family',
  '/rewards',
  '/chores/42',
]

const CASES = [
  { width: 390, mode: 'light', language: 'en' },
  { width: 390, mode: 'dark', language: 'ar-SA' },
  { width: 768, mode: 'light', language: 'ar-SA' },
  { width: 1024, mode: 'dark', language: 'en' },
  { width: 1440, mode: 'light', language: 'en' },
]

const installPresentation = async (page, { language, mode }) => {
  await page.addInitScript(
    ({ locale, theme }) => {
      localStorage.setItem('joy-mode', theme)
      localStorage.setItem('themeMode', JSON.stringify(theme))
      localStorage.setItem('i18nextLng', locale)
      localStorage.setItem('language', JSON.stringify(locale))
    },
    { locale: language, theme: mode },
  )
}

const preparePage = async (page, scenario) => {
  await page.setViewportSize({ width: scenario.width, height: 900 })
  await installApiMocks(page)
  await installSmokeSession(page)
  await installPresentation(page, scenario)
}

for (const path of ROUTES) {
  for (const scenario of CASES) {
    test(`phase 3: ${path} ${scenario.width}px ${scenario.mode} ${scenario.language}`, async ({
      page,
    }) => {
      const runtimeGuard = attachRuntimeErrorGuard(page)
      await preparePage(page, scenario)

      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => document.fonts.ready)

      await expect(page.locator('#root')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        scenario.language.startsWith('ar') ? 'rtl' : 'ltr',
      )
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(scenario.width)

      runtimeGuard.assertClean()
    })
  }
}

test('phase 3: chore detail uses the shared routine dialog', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await preparePage(page, { width: 390, mode: 'dark', language: 'en' })

  await page.goto('/chores/42', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Save to routine' }).click()

  const dialog = page.getByRole('dialog', { name: 'Save task to routine' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Reusable settings are copied.')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  )
  runtimeGuard.assertClean()
})

test('phase 3: archived tasks use the shared restore toolbar', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await preparePage(page, { width: 390, mode: 'light', language: 'en' })
  await page.route('**/api/v1/chores/archived', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        res: [
          {
            id: 84,
            name: 'Archived smoke chore',
            assignedTo: 2,
            priority: 2,
            isActive: false,
            isArchived: true,
            labels: [],
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-02T00:00:00Z',
          },
        ],
      }),
    }),
  )

  await page.goto('/archived', { waitUntil: 'networkidle' })
  await page.getByTitle('Enable Multi-select Mode (Ctrl+S)').click()
  await page.getByRole('button', { name: 'All', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Restore' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  )
  runtimeGuard.assertClean()
})

import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

// Phase 3 remaining live surfaces: calendar, notifications, maintenance, and
// the family/progress screens, plus preferences-backed settings.
const ROUTES = [
  '/calendar',
  '/notifications',
  '/assets',
  '/goals',
  '/activity',
  '/rewards',
  '/progress',
  '/settings',
]

const CASES = [
  { width: 390, mode: 'light', language: 'en' },
  { width: 390, mode: 'dark', language: 'ar-SA' },
  { width: 768, mode: 'light', language: 'ar-SA' },
  { width: 1024, mode: 'dark', language: 'en' },
  { width: 1440, mode: 'light', language: 'en' },
]

const installPresentation = async (page, { language, mode }) => {
  // Language and appearance are server-driven in the approved runtime: the
  // LocalizationContext language and the theme boot effect read the mocked
  // preferences endpoint, not i18next/localStorage keys.
  await overrideUserPreferences(
    page,
    smokePreferences({ appearance: mode, language }),
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
      const direction = scenario.language.startsWith('ar') ? 'rtl' : 'ltr'
      await expect(page.locator('html')).toHaveAttribute('dir', direction)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(scenario.width)

      if (scenario.width > 768) {
        await expect(page.locator('.sidebar')).toBeVisible()
      } else {
        await expect(page.locator('.mobile-nav')).toBeVisible()
      }

      runtimeGuard.assertClean()
    })
  }
}

test('phase 3: the shared task modal confines its controls at phone widths', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await preparePage(page, { width: 390, mode: 'dark', language: 'en' })

  await page.goto('/all-tasks?create=1', { waitUntil: 'networkidle' })
  const panel = page.locator('.modal-panel')
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('heading', { name: 'new task' })).toBeVisible()

  await panel.getByRole('button', { name: 'household' }).click()
  await panel
    .getByPlaceholder('What needs to be done?')
    .fill('Phase 3 smoke task')

  const bounds = await panel.boundingBox()
  expect(bounds?.x ?? -1).toBeGreaterThanOrEqual(0)
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(390)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
  runtimeGuard.assertClean()
})

test('phase 3: opening a task from All Tasks renders the shared detail surface', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await preparePage(page, { width: 390, mode: 'light', language: 'en' })
  page.route(/\/api\/v1\/chores\/?(?:\?.*)?$/, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        res: [
          {
            id: 42,
            name: 'Detail smoke task',
            description: 'Opened from the All Tasks list',
            assignedTo: 1,
            priority: 4,
            nextDueDate: new Date().toISOString(),
            isActive: true,
            isArchived: false,
            frequencyType: 'once',
            labels: [],
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      }),
    }),
  )

  await page.goto('/all-tasks', { waitUntil: 'networkidle' })
  await page.locator('.task-row', { hasText: 'Detail smoke task' }).click()

  const drawer = page.locator('.drawer-panel')
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('Detail smoke task')
  await expect(drawer).toContainText('Opened from the All Tasks list')
  runtimeGuard.assertClean()
})

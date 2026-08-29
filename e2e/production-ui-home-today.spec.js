import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const HOME_ROUTES = ['/', '/today']

const CASES = [
  { width: 390, mode: 'light', language: 'en' },
  { width: 390, mode: 'dark', language: 'ar-SA' },
  { width: 768, mode: 'light', language: 'ar-SA' },
  { width: 1024, mode: 'dark', language: 'en' },
  { width: 1440, mode: 'light', language: 'en' },
]

const localized = language =>
  language.startsWith('ar')
    ? {
        family: 'العائلة',
        familyProgress: 'تقدّم العائلة اليوم',
        forMe: 'لي',
        markComplete: 'وضع علامة مكتمل',
        today: 'اليوم',
      }
    : {
        family: 'Family',
        familyProgress: 'Family progress today',
        forMe: 'For me',
        markComplete: 'Mark complete',
        today: 'Today',
      }

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

const todayChore = () => ({
  id: 42,
  name: 'Smoke chore today',
  assignedTo: 1,
  priority: 1,
  points: 5,
  isActive: true,
  isArchived: false,
  nextDueDate: new Date().toISOString().slice(0, 10),
  frequencyType: 'daily',
  category: { id: 7, name: 'Chores', color: '#f59e0b' },
  labels: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
})

const installTodayFixture = page => {
  page.route(/\/api\/v1\/chores\/?\??/, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ res: [todayChore()] }),
    }),
  )
  page.route(/\/api\/v1\/chores\/history\??/, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ res: [] }),
    }),
  )
}

const installChildProfile = page =>
  page.route('**/api/v1/users/profile', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        res: {
          id: 1,
          circleID: 3,
          displayName: 'Smoke User',
          email: 'smoke@example.test',
          parentUserId: 2,
          timezone: 'UTC',
          userType: 1,
          username: 'smoke-user',
        },
      }),
    }),
  )

const preparePage = async (page, scenario) => {
  await page.setViewportSize({ width: scenario.width, height: 900 })
  await installApiMocks(page)
  await installSmokeSession(page)
  await installPresentation(page, scenario)
  installTodayFixture(page)
}

for (const path of HOME_ROUTES) {
  for (const scenario of CASES) {
    test(`home-today: ${path} ${scenario.width}px ${scenario.mode} ${scenario.language}`, async ({
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
      await expect(
        page
          .getByRole('heading', {
            name: localized(scenario.language).today,
            exact: true,
          })
          .first(),
      ).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(scenario.width)

      runtimeGuard.assertClean()
    })
  }
}

test('home-today: today shows a due chore and completes it live', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await preparePage(page, { width: 1024, mode: 'light', language: 'en' })

  await page.goto('/today', { waitUntil: 'networkidle' })
  await expect(page.getByText('Smoke chore today')).toBeVisible()

  const responsePromise = page.waitForResponse(
    response =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/v1/chores/42/do'),
  )
  await page.getByRole('button', { name: 'Mark complete', exact: true }).click()
  const response = await responsePromise
  expect(response.status()).toBe(200)
  runtimeGuard.assertClean()
})

test('home-today: family toggle on /today surfaces household cards', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await preparePage(page, { width: 768, mode: 'light', language: 'ar-SA' })

  await page.goto('/today', { waitUntil: 'networkidle' })
  const copy = localized('ar-SA')
  await page.getByRole('button', { name: copy.family }).click()
  await expect(page.getByText(copy.familyProgress)).toBeVisible()
  await expect(page.getByRole('button', { name: /Smoke User/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Family Member/ }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(768)
  runtimeGuard.assertClean()
})

test('home-today: Arabic RTL renders translated Today content', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  const copy = localized('ar-SA')
  await preparePage(page, { width: 390, mode: 'dark', language: 'ar-SA' })

  await page.goto('/today', { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(
    page.getByRole('heading', { name: copy.today, exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: copy.forMe, exact: true }),
  ).toBeVisible()
  await expect(page.getByText('مُسنَدة إليّ')).toBeVisible()
  await expect(
    page.getByRole('button', { name: copy.markComplete, exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Today', exact: true }),
  ).toHaveCount(0)
  runtimeGuard.assertClean()
})

test('home-today: Arabic child persona renders translated Quest content', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await preparePage(page, { width: 390, mode: 'dark', language: 'ar-SA' })
  await installChildProfile(page)

  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByText('مهام اليوم · تبقى 1')).toBeVisible()
  await expect(page.getByText('لا مكافآت بعد')).toBeVisible()
  await expect(page.getByText('أهدافي')).toBeVisible()
  await expect(page.getByText("Today's quests")).toHaveCount(0)
  runtimeGuard.assertClean()
})

test('home-today: sidebar Today link navigates from / to /today', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await preparePage(page, { width: 1440, mode: 'light', language: 'en' })

  await page.goto('/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/today$/)
  await expect(
    page.getByRole('heading', { name: 'Today', exact: true }),
  ).toBeVisible()
  runtimeGuard.assertClean()
})

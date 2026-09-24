import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

// The home and today screens keep hardcoded English headings and copy in every
// language: FocusHome greets "Good morning, {name}", TodayScreen's h1 is the
// literal "Today", and its filter toggles are literal All/Mine/Household
// buttons. These cases cover both routes across widths, modes, and LTR/RTL
// while documenting that identity instead of assuming translated copy.
const HOME_ROUTES = ['/', '/today']

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

// Mark the signed-in user as a managed child member (role never 'admin' and
// isManagedAccount), so the persona resolves to 'child' and '/' renders the
// quest home. Member records drive persona; /users/profile does not.
const installChildProfile = page =>
  page.route('**/api/v1/circles/members', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        res: [
          {
            userId: 1,
            id: 1,
            isActive: true,
            role: 'member',
            isManagedAccount: true,
            name: 'Smoke User',
            displayName: 'Smoke User',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          {
            userId: 2,
            id: 2,
            isActive: true,
            role: 'member',
            isManagedAccount: false,
            name: 'Family Member',
            displayName: 'Family Member',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
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
      // The heading is hardcoded English: FocusHome greets by name, Today's h1
      // is the literal "Today" in both languages.
      const heading = path === '/' ? /Smoke User/ : 'Today'
      await expect(
        page.getByRole('heading', { name: heading }).first(),
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
      response.url().includes('/chores/42/do') &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Mark complete', exact: true }).click()
  const response = await responsePromise
  expect(response.status()).toBe(200)
  runtimeGuard.assertClean()
})

test('home-today: Household toggle on /today surfaces the household section', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await preparePage(page, { width: 768, mode: 'light', language: 'ar-SA' })

  await page.goto('/today', { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  // The toggles are hardcoded English buttons: All / Mine / Household. The
  // family filter hides tasks assigned to the signed-in user.
  await page.getByRole('button', { name: 'Household', exact: true }).click()
  await expect(page.getByText('Smoke chore today')).toHaveCount(0)
  await expect(page.getByText('Household members')).toBeVisible()
  await expect(page.getByText('Family Member', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(768)
  runtimeGuard.assertClean()
})

test('home-today: Arabic RTL keeps the hardcoded English Today content', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await preparePage(page, { width: 390, mode: 'dark', language: 'ar-SA' })

  await page.goto('/today', { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  // The h1, the filter toggles, and the completion control stay in English.
  await expect(
    page.getByRole('heading', { name: 'Today', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'All', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Mine', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Household', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Mark complete', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'اليوم', exact: true }),
  ).toHaveCount(0)
  runtimeGuard.assertClean()
})

test('home-today: Arabic child persona renders the quest home with child nav', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await preparePage(page, { width: 1440, mode: 'light', language: 'ar-SA' })
  await installChildProfile(page)

  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  // A child persona boots the quest home on '/'; its body copy is hardcoded
  // English while the sidebar navigation stays localized.
  await expect(page.getByText('Quest Mode')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: /^Hey, Smoke User!/ }),
  ).toBeVisible()
  await expect(page.getByText('My quests today')).toBeVisible()
  await expect(page.getByText(/Good (morning|afternoon|evening)/)).toHaveCount(
    0,
  )

  const sidebar = page.locator('.sidebar')
  await expect(sidebar).toBeVisible()
  await expect(sidebar.getByRole('button', { name: 'اليوم' })).toBeVisible()
  // childHidden nav items are removed for the child persona.
  await expect(sidebar.getByRole('button', { name: 'المشاريع' })).toHaveCount(0)
  await expect(sidebar.getByRole('button', { name: 'الصيانة' })).toHaveCount(0)
  await expect(sidebar.getByRole('button', { name: 'التقدم' })).toHaveCount(0)
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

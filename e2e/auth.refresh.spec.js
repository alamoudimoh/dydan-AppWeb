import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installRefreshCookie } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const REFRESH_ROUTES = [
  { name: 'Dashboard', url: '/?view=week#summary', heading: /today/i },
  {
    name: 'Tasks',
    url: '/chores?view=all#task-list',
    text: /no tasks match this view/i,
  },
  {
    name: 'Projects',
    url: '/projects/?view=board#projects',
    heading: /^projects$/i,
  },
  {
    name: 'Calendar',
    url: '/calendar?view=month#calendar',
    heading: /^calendar$/i,
  },
  {
    name: 'Profile',
    url: '/profile?section=account#profile',
    heading: /profile settings/i,
  },
]

const expectRouteContent = async (page, route) => {
  if (route.heading) {
    await expect(
      page.getByRole('heading', { name: route.heading }),
    ).toBeVisible()
  } else {
    await expect(page.getByText(route.text)).toBeVisible()
  }
}

for (const route of REFRESH_ROUTES) {
  test(`authenticated refresh preserves ${route.name} session and URL`, async ({
    context,
    page,
  }) => {
    const runtimeGuard = attachRuntimeErrorGuard(page)
    await installApiMocks(page)
    await installRefreshCookie(context)

    await page.goto(route.url, { waitUntil: 'networkidle' })
    await expectRouteContent(page, route)
    const beforeRefresh = page.url()

    await page.reload({ waitUntil: 'networkidle' })

    await expectRouteContent(page, route)
    expect(page.url()).toBe(beforeRefresh)
    expect(new URL(page.url()).pathname).not.toBe('/login')
    runtimeGuard.assertClean()
  })
}

test('protected route waits while authentication is restoring', async ({
  context,
  page,
}) => {
  await installRefreshCookie(context)
  await installApiMocks(page)
  await page.route('**/api/v1/auth/refresh', async route => {
    await new Promise(resolve => setTimeout(resolve, 500))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'smoke-test-token' }),
    })
  })

  const navigation = page.goto('/calendar?view=month#calendar')
  await page.waitForTimeout(150)
  expect(new URL(page.url()).pathname).toBe('/calendar')
  await navigation
  await expect(page.getByRole('heading', { name: /^calendar$/i })).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/calendar')
})

test('confirmed invalid refresh session redirects and retains the complete return URL', async ({
  context,
  page,
}) => {
  await installRefreshCookie(context)
  await installApiMocks(page)
  await page.route('**/api/v1/auth/refresh', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Invalid or expired refresh token' }),
    }),
  )

  await page.goto('/profile?section=account#profile')
  await expect(page).toHaveURL(/\/login\?session=expired$/)
  expect(
    await page.evaluate(() => sessionStorage.getItem('return_path_pending')),
  ).toBe('/profile?section=account#profile')
})

test('authenticated refresh at /today restores the previously selected tab', async ({
  context,
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installRefreshCookie(context)
  page.route(/\/api\/v1\/chores\/?\??/, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ res: [] }),
    }),
  )

  await page.goto('/today', { waitUntil: 'networkidle' })
  const familyTab = page.getByRole('tab', { name: 'Family' })
  await expect(familyTab).toBeVisible()
  await familyTab.click()
  await expect(familyTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Family progress today')).toBeVisible()

  await page.reload({ waitUntil: 'networkidle' })

  await expect(familyTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Family progress today')).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/today')
  runtimeGuard.assertClean()
})

test('transient startup network failure shows a retryable offline state, not a login redirect', async ({
  context,
  page,
}) => {
  await installRefreshCookie(context)
  await installApiMocks(page)
  let refreshAttempts = 0
  await page.route('**/api/v1/auth/refresh', async route => {
    refreshAttempts += 1
    if (refreshAttempts === 1) {
      await route.abort('failed')
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'smoke-test-token' }),
    })
  })

  await page.goto('/calendar?view=month#calendar')

  await expect(
    page.getByRole('heading', { name: "You're offline" }),
  ).toBeVisible()
  await expect(
    page.getByText('Sign-in will resume when your connection is back.'),
  ).toBeVisible()
  // A connectivity hiccup must not be presented as a definitive logout.
  expect(new URL(page.url()).pathname).toBe('/calendar')
  expect(new URL(page.url()).pathname).not.toBe('/login')

  await page.getByRole('button', { name: 'Try again' }).click()

  await expect(page.getByRole('heading', { name: /^calendar$/i })).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/calendar')
  expect(refreshAttempts).toBeGreaterThanOrEqual(2)
})

test('browser back and forward navigation remains correct after an authenticated refresh', async ({
  context,
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installRefreshCookie(context)

  await page.goto('/calendar?view=month#calendar', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: /^calendar$/i })).toBeVisible()

  await page.goto('/today', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: /today/i })).toBeVisible()

  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: /today/i })).toBeVisible()
  expect(new URL(page.url()).pathname).not.toBe('/login')

  await page.goBack()
  expect(new URL(page.url()).pathname).toBe('/calendar')
  expect(page.url()).toContain('#calendar')
  await expect(page.getByRole('heading', { name: /^calendar$/i })).toBeVisible()

  await page.goForward()
  expect(new URL(page.url()).pathname).toBe('/today')
  await expect(page.getByRole('heading', { name: /today/i })).toBeVisible()
  runtimeGuard.assertClean()
})

test('authenticated deep link to a parameterized route restores and survives refresh', async ({
  context,
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installRefreshCookie(context)

  await page.goto('/chores/42', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: 'Smoke Chore' })).toBeVisible()

  await page.reload({ waitUntil: 'networkidle' })

  expect(page.url()).toMatch(/\/chores\/42$/)
  expect(new URL(page.url()).pathname).not.toBe('/login')
  await expect(page.getByRole('heading', { name: 'Smoke Chore' })).toBeVisible()
  runtimeGuard.assertClean()
})

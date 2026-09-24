import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installRefreshCookie } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const REFRESH_ROUTES = [
  { name: 'Home', url: '/?view=focus#summary', heading: /Smoke User/i },
  {
    name: 'Tasks',
    url: '/all-tasks?view=all#task-list',
    heading: /^all tasks$/i,
  },
  {
    name: 'Projects',
    url: '/projects?view=board#projects',
    heading: /^projects$/i,
  },
  {
    name: 'Calendar',
    url: '/calendar?view=month#calendar',
    heading: /^calendar$/i,
  },
  {
    name: 'Shopping',
    url: '/shopping?sort=alpha#lists',
    heading: /^shopping$/i,
  },
  {
    name: 'Settings',
    url: '/settings?tab=profile#profile',
    heading: /^settings$/i,
  },
  {
    name: 'Progress',
    url: '/progress?range=30d#progress',
    heading: /^progress$/i,
  },
]

const expectRouteContent = async (page, route) => {
  await expect(page.getByRole('heading', { name: route.heading })).toBeVisible()
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

test('confirmed invalid refresh session keeps the page and offers in-place sign-in', async ({
  context,
  page,
}) => {
  await installRefreshCookie(context)
  await installApiMocks(page)
  // This device has a signed-in user, so a rejected restore must keep the
  // exact page/tab instead of bouncing it to any auth URL.
  await page.addInitScript(() => {
    localStorage.setItem('dydan.signed-in', '1')
  })
  await page.route('**/api/v1/auth/refresh', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Invalid or expired refresh token' }),
    }),
  )

  await page.goto('/settings?tab=profile#profile')
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()
  // The in-place sign-in form is available; no URL change, no /login redirect.
  await expect(page.getByPlaceholder('your username')).toBeVisible()
  await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible()
  const stayed = new URL(page.url())
  expect(stayed.pathname).toBe('/settings')
  expect(stayed.search).toBe('?tab=profile')
  expect(stayed.hash).toBe('#profile')
})

test('authenticated refresh at /today restores the session and view', async ({
  context,
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installRefreshCookie(context)

  await page.goto('/today', { waitUntil: 'networkidle' })
  const householdFilter = page.getByRole('button', { name: 'Household' })
  await expect(householdFilter).toBeVisible()
  await householdFilter.click()

  await page.reload({ waitUntil: 'networkidle' })

  await expect(
    page.getByRole('heading', { name: 'Today', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Household' })).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/today')
  runtimeGuard.assertClean()
})

test('transient startup network failure reveals in-place sign-in, not a login redirect', async ({
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

  // A connectivity hiccup surfaces the in-place sign-in screen at the same URL;
  // it must never be presented as a redirect to an auth route.
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()
  await expect(page.getByPlaceholder('your username')).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/calendar')
  expect(new URL(page.url()).pathname).not.toBe('/login')

  await page.reload({ waitUntil: 'networkidle' })

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
  await expect(
    page.getByRole('heading', { name: 'Today', exact: true }),
  ).toBeVisible()

  await page.reload({ waitUntil: 'networkidle' })
  await expect(
    page.getByRole('heading', { name: 'Today', exact: true }),
  ).toBeVisible()
  expect(new URL(page.url()).pathname).not.toBe('/login')

  await page.goBack()
  expect(new URL(page.url()).pathname).toBe('/calendar')
  expect(page.url()).toContain('#calendar')
  await expect(page.getByRole('heading', { name: /^calendar$/i })).toBeVisible()

  await page.goForward()
  expect(new URL(page.url()).pathname).toBe('/today')
  await expect(
    page.getByRole('heading', { name: 'Today', exact: true }),
  ).toBeVisible()
  runtimeGuard.assertClean()
})

test('authenticated deep link to a parameterized route restores and survives refresh', async ({
  context,
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installRefreshCookie(context)

  await page.goto('/shopping?sort=alpha#lists', { waitUntil: 'networkidle' })
  await expect(
    page.getByRole('heading', { name: 'Shopping', exact: true }),
  ).toBeVisible()

  await page.reload({ waitUntil: 'networkidle' })

  expect(new URL(page.url()).pathname).toBe('/shopping')
  expect(new URL(page.url()).pathname).not.toBe('/login')
  expect(page.url()).toContain('sort=alpha')
  expect(page.url()).toContain('#lists')
  await expect(
    page.getByRole('heading', { name: 'Shopping', exact: true }),
  ).toBeVisible()
  runtimeGuard.assertClean()
})

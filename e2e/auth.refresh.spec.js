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
    name: 'Settings',
    url: '/settings/profile?section=account#profile',
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

  await page.goto('/settings/profile?section=account#profile')
  await expect(page).toHaveURL(/\/login\?session=expired$/)
  expect(
    await page.evaluate(() => sessionStorage.getItem('return_path_pending')),
  ).toBe('/settings/profile?section=account#profile')
})

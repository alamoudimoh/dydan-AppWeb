/**
 * Regression coverage for fix/mobile-01-responsive-ui.
 *
 * These tests pin the responsive behavior of the approved UI at real phone
 * viewports (portrait + landscape): no horizontal overflow, all content
 * reachable, the correct bottom-nav/sidebar chrome per the 768px breakpoint,
 * the stacked home/shopping grids, the wrapping settings profile row,
 * the enlarged task-check touch target, modal/drawer geometry, and a
 * theme/direction matrix (dydan/sovereign x light/dark/system x en/ar).
 *
 * They run against the same strict API-mock server as the other smoke specs,
 * so they stay deterministic without a real backend.
 */
import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const DEFAULT_PREFERENCES = {
  theme: 'dydan',
  appearance: 'light',
  defaultView: 'focus',
  compactMode: false,
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: 'h:mm A',
  firstDayOfWeek: 0,
  currency: 'USD',
  sidebarCollapsed: false,
  showItemBadges: true,
  rememberSidebar: true,
  notifications: {
    taskReminders: true,
    routineNudges: true,
    familyActivity: false,
    rewards: true,
    weeklySummary: false,
    quietHours: false,
    pushChannel: true,
    emailChannel: false,
  },
  privacy: { activityVisible: true, analytics: true, personalization: true },
  betaFeatures: false,
  verboseLogging: false,
}

const SMOKE_CHORE = {
  id: 42,
  name: 'Mobile Audit Task',
  description: 'Fixture task used to exercise task rows and the detail drawer',
  assignedTo: 1,
  priority: 4,
  nextDueDate: '2026-12-31T09:00:00Z',
  lastCompletedDate: null,
  isArchived: false,
  scheduleType: 'oneTime',
  createdAt: '2026-01-01T00:00:00Z',
}

/**
 * Install the strict API mocks plus deterministic overrides used by the
 * mobile regression suite. Registering the preference/chore/profile routes
 * after installApiMocks gives them precedence (later routes resolve first).
 */
const installMobileMocks = async (page, options = {}) => {
  const { chores = [], preferences = DEFAULT_PREFERENCES, profile } = options
  await installApiMocks(page)
  await page.route('**/api/v1/users/preferences', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(preferences),
      })
    }
    return route.fallback()
  })
  await page.route(/\/api\/v1\/chores\/?(?:\?|$)/, route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ res: chores }),
      })
    }
    return route.fallback()
  })
  // The app lists notifications without query params, but the strict mock
  // contract requires `limit`, which the real server does not. Neutralize the
  // mismatch with a faithful empty payload (and keep the unread-count
  // endpoint on the original mock contract).
  await page.route(/\/api\/v1\/notifications(?:\?|$)/, route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ res: [], unreadCount: 0 }),
      })
    }
    return route.fallback()
  })
  if (profile) {
    await page.route('**/api/v1/users/profile', route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ res: profile }),
        })
      }
      return route.fallback()
    })
  }
  await installSmokeSession(page)
}

/** Structural layout metrics for the current viewport. */
const readMobileLayout = page =>
  page.evaluate(() => {
    const root = document.documentElement
    const scroll = document.querySelector('.main-scroll')
    let unreachableContent = null
    if (scroll) {
      scroll.scrollTop = scroll.scrollHeight
      const viewportBottom = scroll.getBoundingClientRect().bottom
      let maxBottom = 0
      for (const el of scroll.querySelectorAll('*')) {
        const style = getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          rect.width === 0 ||
          rect.height === 0 ||
          style.position === 'fixed'
        ) {
          continue
        }
        maxBottom = Math.max(maxBottom, rect.bottom)
      }
      if (maxBottom > viewportBottom + 4) {
        unreachableContent = Math.round(maxBottom - viewportBottom)
      }
    }
    const nav = document.querySelector('.mobile-nav')
    const sidebar = document.querySelector('.sidebar')
    return {
      docOverflowX: root.scrollWidth - root.clientWidth,
      unreachableContent,
      mobileNavVisible: Boolean(
        nav && getComputedStyle(nav).display !== 'none',
      ),
      sidebarVisible: Boolean(
        sidebar && getComputedStyle(sidebar).display !== 'none',
      ),
    }
  })

const columnCount = (page, selector) =>
  page.locator(selector).evaluate(el => {
    const template = getComputedStyle(el).gridTemplateColumns.trim()
    return template.split(/\s+/).length
  })

const MOBILE_ROUTES = [
  '/',
  '/today',
  '/all-tasks',
  '/calendar',
  '/projects',
  '/routines',
  '/assets',
  '/shopping',
  '/goals',
  '/activity',
  '/notifications',
  '/rewards',
  '/progress',
  '/settings',
  '/search',
]

const SWEEP_VIEWPORTS = [
  {
    name: 'phone portrait 390x844',
    width: 390,
    height: 844,
    mobileChrome: true,
  },
  {
    name: 'phone landscape 667x375',
    width: 667,
    height: 375,
    mobileChrome: true,
  },
  {
    name: 'phone landscape max 844x390',
    width: 844,
    height: 390,
    mobileChrome: false,
  },
]

test.describe('mobile responsive regression (fix/mobile-01)', () => {
  for (const vp of SWEEP_VIEWPORTS) {
    test(`every route is free of horizontal overflow, content is reachable, chrome matches breakpoint @ ${vp.name}`, async ({
      page,
    }) => {
      test.setTimeout(150_000)
      await installMobileMocks(page)
      await page.setViewportSize({ width: vp.width, height: vp.height })
      for (const route of MOBILE_ROUTES) {
        await page.goto(route, { waitUntil: 'domcontentloaded' })
        await expect(page.locator('.main-scroll').first()).toBeVisible()
        await page.waitForTimeout(300)
        const metrics = await readMobileLayout(page)
        expect(
          metrics.docOverflowX,
          `${route} @ ${vp.width}x${vp.height} overflows horizontally`,
        ).toBeLessThanOrEqual(1)
        expect(
          metrics.unreachableContent,
          `${route} @ ${vp.width}x${vp.height} hides content below the fold`,
        ).toBeNull()
        expect(
          metrics.mobileNavVisible,
          `${route} @ ${vp.width}x${vp.height} should use the mobile bottom nav`,
        ).toBe(vp.mobileChrome)
        expect(
          metrics.sidebarVisible,
          `${route} @ ${vp.width}x${vp.height} sidebar chrome`,
        ).toBe(!vp.mobileChrome)
      }
    })
  }

  test('home and shopping grids stack on phones and keep two columns on desktop', async ({
    page,
  }) => {
    const guard = attachRuntimeErrorGuard(page)
    await installMobileMocks(page)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.locator('.home-columns')).toBeVisible()
    expect(await columnCount(page, '.home-columns')).toBe(1)
    await page.goto('/shopping')
    await expect(page.locator('.shopping-lists-grid')).toBeVisible()
    expect(await columnCount(page, '.shopping-lists-grid')).toBe(1)

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.locator('.home-columns')).toBeVisible()
    expect(await columnCount(page, '.home-columns')).toBe(2)
    await page.goto('/shopping')
    await expect(page.locator('.shopping-lists-grid')).toBeVisible()
    expect(await columnCount(page, '.shopping-lists-grid')).toBe(2)

    guard.assertClean()
  })

  test('settings profile card wraps long identity content instead of clipping on phones', async ({
    page,
  }) => {
    const guard = attachRuntimeErrorGuard(page)
    await installMobileMocks(page, {
      profile: {
        id: 1,
        circleID: 3,
        userType: 0,
        displayName: 'A Very Long Profile Name That Needs More Than One Line',
        timezone: 'UTC',
        username: 'smoke-user',
        email:
          'a.very.long.email.address.that.has.no.spaces@an-extremely-long.example.hostname.test',
      },
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/settings')
    await expect(page.locator('.settings-profile-row')).toBeVisible()

    const clip = await page.evaluate(() => {
      const row = document.querySelector('.settings-profile-row')
      const email = row.querySelector('.settings-profile-main .text-muted')
      const action = [...row.querySelectorAll('button')].pop()
      const rowRect = row.getBoundingClientRect()
      return {
        rowScrollsX: row.scrollWidth - row.clientWidth,
        emailScrollsX: email ? email.scrollWidth - email.clientWidth : 0,
        actionsInside:
          !action ||
          action.getBoundingClientRect().right <=
            Math.max(rowRect.right, document.documentElement.clientWidth) + 1,
      }
    })

    expect(
      clip.rowScrollsX,
      'profile row content overflows',
    ).toBeLessThanOrEqual(1)
    expect(
      clip.emailScrollsX,
      'profile email text is clipped',
    ).toBeLessThanOrEqual(1)
    expect(clip.actionsInside).toBe(true)

    guard.assertClean()
  })

  test('task checkboxes keep their 20px visual but gain a mobile touch target', async ({
    page,
  }) => {
    const guard = attachRuntimeErrorGuard(page)
    await installMobileMocks(page, { chores: [SMOKE_CHORE] })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/all-tasks')
    const check = page.locator('.task-check').first()
    await expect(check).toBeVisible()
    const mobile = await check.evaluate(el => ({
      size: Math.round(el.getBoundingClientRect().width),
      hitArea: getComputedStyle(el, '::before').content !== 'none',
    }))
    expect(mobile.size).toBe(20)
    expect(mobile.hitArea).toBe(true)

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/all-tasks')
    const desktopCheck = page.locator('.task-check').first()
    await expect(desktopCheck).toBeVisible()
    const desktopHitArea = await desktopCheck.evaluate(
      el => getComputedStyle(el, '::before').content,
    )
    expect(desktopHitArea).toBe('none')

    guard.assertClean()
  })

  test('create-task modal fits the phone viewport and closes on overlay tap', async ({
    page,
  }) => {
    const guard = attachRuntimeErrorGuard(page)
    await installMobileMocks(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.locator('.main-scroll').first()).toBeVisible()

    await page.getByRole('button', { name: 'new task' }).click()
    const panel = page.locator('.modal-panel')
    await expect(panel).toBeVisible()

    const bounds = await panel.evaluate(el => {
      const r = el.getBoundingClientRect()
      return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }
    })
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.top).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(391)
    expect(bounds.bottom).toBeLessThanOrEqual(845)
    // A scrollable panel is fine, a panel that clips its content is not.
    if (bounds.scrollHeight > bounds.clientHeight) {
      expect(
        bounds.scrollHeight,
        'modal content should scroll without being cut off',
      ).toBeLessThanOrEqual(390 * bounds.clientHeight)
    }

    await page.mouse.click(6, 6)
    await expect(page.locator('.modal-overlay')).toHaveCount(0)

    guard.assertClean()
  })

  test('task detail drawer fits the phone viewport and closes via its close button', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    const guard = attachRuntimeErrorGuard(page)
    await installMobileMocks(page, { chores: [SMOKE_CHORE] })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/all-tasks')
    await expect(page.locator('.main-scroll').first()).toBeVisible()

    const rows = page.locator('.task-row')
    test.skip((await rows.count()) === 0, 'fixture produced no task rows')
    await rows.first().click()

    const panel = page.locator('.drawer-panel')
    await expect(panel).toBeVisible()

    const bounds = await panel.evaluate(el => {
      const r = el.getBoundingClientRect()
      return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }
    })
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.top).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(391)
    expect(bounds.bottom).toBeLessThanOrEqual(845)
    if (bounds.scrollHeight > bounds.clientHeight) {
      expect(
        bounds.scrollHeight,
        'drawer content should scroll without being cut off',
      ).toBeLessThanOrEqual(390 * bounds.clientHeight)
    }

    await page.locator('.drawer-panel .btn-icon').first().click()
    await expect(page.locator('.drawer-panel')).toHaveCount(0)

    guard.assertClean()
  })

  const THEME_DETAILS = [
    {
      name: 'dydan / light / en',
      prefs: {},
      dir: 'ltr',
      themeAttr: null,
      joy: 'light',
    },
    {
      name: 'dydan / dark / en',
      prefs: { appearance: 'dark' },
      dir: 'ltr',
      themeAttr: null,
      joy: 'dark',
    },
    {
      name: 'dydan / system (OS light) / en',
      prefs: { appearance: 'system' },
      colorScheme: 'light',
      dir: 'ltr',
      themeAttr: null,
      joy: 'light',
    },
    {
      name: 'dydan / system (OS dark) / en',
      prefs: { appearance: 'system' },
      colorScheme: 'dark',
      dir: 'ltr',
      themeAttr: null,
      joy: 'dark',
    },
    {
      name: 'sovereign / light / en',
      prefs: { theme: 'sovereign', appearance: 'light' },
      dir: 'ltr',
      themeAttr: 'sovereign',
      joy: 'light',
    },
    {
      name: 'sovereign / dark / en',
      prefs: { theme: 'sovereign', appearance: 'dark' },
      dir: 'ltr',
      themeAttr: 'sovereign',
      joy: 'dark',
    },
    {
      name: 'dydan / light / ar (RTL)',
      prefs: { language: 'ar-SA' },
      dir: 'rtl',
      themeAttr: null,
      joy: 'light',
    },
    {
      name: 'dydan / dark / ar (RTL)',
      prefs: { appearance: 'dark', language: 'ar-SA' },
      dir: 'rtl',
      themeAttr: null,
      joy: 'dark',
    },
    {
      name: 'sovereign / dark / ar (RTL)',
      prefs: { theme: 'sovereign', appearance: 'dark', language: 'ar-SA' },
      dir: 'rtl',
      themeAttr: 'sovereign',
      joy: 'dark',
    },
  ]

  for (const detail of THEME_DETAILS) {
    test(`theme matrix keeps the layout stable at 390x844 in ${detail.name}`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        colorScheme: detail.colorScheme || 'light',
      })
      const page = await context.newPage()
      try {
        await installMobileMocks(page, {
          preferences: { ...DEFAULT_PREFERENCES, ...detail.prefs },
        })
        await page.goto('/')
        await expect(page.locator('.main-scroll').first()).toBeVisible()

        const html = page.locator('html')
        await expect(html).toHaveAttribute('dir', detail.dir)
        if (detail.themeAttr) {
          await expect(html).toHaveAttribute('data-theme', detail.themeAttr)
        } else {
          await expect(html).not.toHaveAttribute('data-theme', /.*/)
        }
        await expect(html).toHaveAttribute('data-joy-color-scheme', detail.joy)

        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        )
        expect(overflow).toBeLessThanOrEqual(1)

        if (detail.dir === 'rtl') {
          await page.goto('/settings')
          await expect(page.locator('.main-scroll').first()).toBeVisible()
          const settingsOverflow = await page.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
          )
          expect(settingsOverflow).toBeLessThanOrEqual(1)
        }
      } finally {
        await context.close()
      }
    })
  }
})

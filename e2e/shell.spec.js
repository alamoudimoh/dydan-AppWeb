import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

// The brand rail collapse/expand transition is 180ms; give layout time to
// settle before measuring geometry.
const SETTLE = 350

test('shell: sidebar collapses to an icon rail and restores', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  const sidebar = page.locator('.sidebar')
  const appShell = page.locator('.app-shell')
  await expect(sidebar).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Toggle side panel' }),
  ).toBeVisible()

  // Default is the expanded 244px rail.
  const expandedWidth = await sidebar.evaluate(el =>
    Math.round(el.getBoundingClientRect().width),
  )
  expect(expandedWidth).toBe(244)

  // Collapse to the 74px icon rail.
  await page.getByRole('button', { name: 'Toggle side panel' }).click()
  await expect(appShell).toHaveClass(/sidebar-collapsed/)
  await page.waitForTimeout(SETTLE)
  const collapsedWidth = await sidebar.evaluate(el =>
    Math.round(el.getBoundingClientRect().width),
  )
  expect(collapsedWidth).toBe(74)

  // Expand again and the rail returns to its original width.
  await page.getByRole('button', { name: 'Toggle side panel' }).click()
  await expect(appShell).not.toHaveClass(/sidebar-collapsed/)
  await page.waitForTimeout(SETTLE)
  const restoredWidth = await sidebar.evaluate(el =>
    Math.round(el.getBoundingClientRect().width),
  )
  expect(restoredWidth).toBe(expandedWidth)

  // The in-memory toggle does not persist; a reload restores the mocked
  // preferences (sidebarCollapsed: false).
  await page.reload({ waitUntil: 'networkidle' })
  await expect(appShell).not.toHaveClass(/sidebar-collapsed/)

  runtimeGuard.assertClean()
})

test('shell: collapsed sidebar state persists through Settings → Side panel', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await page.getByRole('tab', { name: /^side panel$/i }).click()

  const appShell = page.locator('.app-shell')
  const collapseSwitch = page
    .locator('.MuiTabPanel-root', { hasText: 'Collapse side panel' })
    .getByRole('switch')
    .first()

  await expect(collapseSwitch).not.toBeChecked()
  await collapseSwitch.check()
  await expect(collapseSwitch).toBeChecked()
  await expect(appShell).toHaveClass(/sidebar-collapsed/)

  // The choice is persisted through the mocked preferences and restored on
  // reload (rememberSidebar defaults to true).
  await page.reload({ waitUntil: 'networkidle' })
  await expect(appShell).toHaveClass(/sidebar-collapsed/)

  await page.getByRole('tab', { name: /^side panel$/i }).click()
  const resumedSwitch = page
    .locator('.MuiTabPanel-root', { hasText: 'Collapse side panel' })
    .getByRole('switch')
    .first()
  await expect(resumedSwitch).toBeChecked()
  await resumedSwitch.uncheck()
  await expect(appShell).not.toHaveClass(/sidebar-collapsed/)

  runtimeGuard.assertClean()
})

test('shell: the brand header and top bar form one aligned header band', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(SETTLE)

  const railHeader = page.locator('.sidebar-header')
  const topBar = page.locator('.app-topbar')
  await expect(railHeader).toBeVisible()
  await expect(topBar).toBeVisible()

  // Both headers resolve the same --app-topbar-height token, so the two 1px
  // bottom borders must meet on exactly the same horizontal pixel line.
  const token = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--app-topbar-height')
      .trim(),
  )
  expect(token).toBe('60px')

  const measure = async () => {
    const box = async selector => {
      const rect = await page
        .locator(selector)
        .evaluate(el => el.getBoundingClientRect())
      return {
        height: Math.round(rect.height * 100) / 100,
        bottom: Math.round(rect.bottom * 100) / 100,
      }
    }
    const [rail, main] = await Promise.all([
      box('.sidebar-header'),
      box('.app-topbar'),
    ])
    const borders = await page.evaluate(() => {
      const read = selector => {
        const style = getComputedStyle(document.querySelector(selector))
        return {
          width: style.borderBottomWidth,
          style: style.borderBottomStyle,
          color: style.borderBottomColor,
        }
      }
      return { rail: read('.sidebar-header'), main: read('.app-topbar') }
    })
    return { rail, main, borders }
  }

  const expanded = await measure()
  expect(expanded.rail.height).toBe(60)
  expect(expanded.main.height).toBe(60)
  // No visible vertical step at the rail/content boundary.
  expect(expanded.main.bottom).toBe(expanded.rail.bottom)
  expect(expanded.borders.rail).toEqual(expanded.borders.main)
  expect(expanded.borders.rail.width).toBe('1px')

  // Collapsed stacks logo over the collapse control, so it grows past the band
  // instead of clipping its own controls.
  await page.getByRole('button', { name: 'Toggle side panel' }).click()
  await expect(page.locator('.app-shell')).toHaveClass(/sidebar-collapsed/)
  await page.waitForTimeout(SETTLE)
  const collapsed = await measure()
  expect(collapsed.rail.height).toBeGreaterThanOrEqual(60)
  const toggleInsideHeader = await page.evaluate(() => {
    const header = document.querySelector('.sidebar-header')
    const toggle = document.querySelector('.collapse-toggle')
    const h = header.getBoundingClientRect()
    const t = toggle.getBoundingClientRect()
    return t.top >= h.top && t.bottom <= h.bottom
  })
  expect(toggleInsideHeader).toBe(true)
  await expect(railHeader.getByRole('button')).toBeVisible()
  await expect(topBar).toBeVisible()

  // The same band holds when the rail flips to the other edge in RTL.
  await page.getByRole('button', { name: 'Toggle side panel' }).click()
  await page.waitForTimeout(SETTLE)
  await page.getByRole('button', { name: /العربية/ }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.waitForTimeout(SETTLE)
  const rtl = await measure()
  expect(rtl.rail.height).toBe(60)
  expect(rtl.main.height).toBe(60)
  expect(rtl.main.bottom).toBe(rtl.rail.bottom)
  expect(rtl.borders.rail).toEqual(rtl.borders.main)

  runtimeGuard.assertClean()
})

test('shell: mobile bottom navigation renders five labeled items and navigates', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  const mobileNav = page.locator('.mobile-nav')
  await expect(mobileNav).toBeVisible()
  await expect(page.locator('.sidebar')).toBeHidden()

  for (const label of ['Home', 'Today', 'Shopping', 'Goals', 'Settings']) {
    await expect(mobileNav.getByRole('button', { name: label })).toBeVisible()
  }

  await mobileNav.getByRole('button', { name: 'Shopping' }).click()
  await expect(page).toHaveURL(/\/shopping$/)
  await expect(
    page.getByRole('heading', { name: 'Shopping', exact: true }),
  ).toBeVisible()

  runtimeGuard.assertClean()
})

test('shell: settings renders a horizontal tab strip above the content', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  const tabs = page.getByRole('tab')
  await expect(tabs.first()).toBeVisible()
  await expect(tabs).toHaveCount(13)

  // The strip sits in one horizontal row above the tab panels.
  const stripBounds = await page.evaluate(() => {
    const tabEls = [...document.querySelectorAll('[role="tab"]')]
    const ys = tabEls.map(el => el.getBoundingClientRect().top)
    const tabPanel = document.querySelector('.MuiTabPanel-root')
    return {
      singleRow: Math.max(...ys) - Math.min(...ys) <= 2,
      stripAboveContent:
        Math.min(...ys) <
        (tabPanel?.getBoundingClientRect().top ?? Number.MAX_SAFE_INTEGER),
    }
  })
  expect(stripBounds.singleRow).toBe(true)
  expect(stripBounds.stripAboveContent).toBe(true)

  // Switching a tab swaps the rendered panel.
  await page.getByRole('tab', { name: /^theme$/i }).click()
  await expect(
    page.locator('.MuiTabPanel-root', {
      hasText: 'Visual theme',
    }),
  ).toBeVisible()

  runtimeGuard.assertClean()
})

test('shell: top bar exposes new task and notifications beside search', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  const topBar = page.locator('.main-content > div').first()
  await expect(topBar.locator('.top-search')).toBeVisible()
  await expect(topBar.getByRole('button', { name: 'new task' })).toBeVisible()

  // The notifications bell is the plain icon button without an explicit label.
  const bell = topBar.locator('.relative > button')
  await expect(bell).toBeVisible()
  await bell.click()
  await expect(page).toHaveURL(/\/notifications$/)
  await expect(
    page.getByRole('heading', { name: 'Notifications', exact: true }),
  ).toBeVisible()

  runtimeGuard.assertClean()
})

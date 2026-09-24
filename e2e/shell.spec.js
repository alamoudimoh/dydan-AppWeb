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
      hasText: 'Choose your visual identity',
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

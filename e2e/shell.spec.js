import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

// The brand rail collapse/expand transition is 180ms; give layout time to
// settle before measuring geometry.
const SETTLE = 350

test('shell: sidebar collapses to an icon rail, persists, and restores', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  const sidebar = page.locator('.sidebar')
  await expect(sidebar).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Collapse sidebar' }),
  ).toBeVisible()

  // Default is the expanded rail.
  const expandedWidth = await sidebar.evaluate(el =>
    Math.round(el.getBoundingClientRect().width),
  )
  expect(expandedWidth).toBeGreaterThan(200)

  // Collapse to the icon rail.
  await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await expect(page.locator('html')).toHaveClass(/sidebar-collapsed/)
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem('dydan.sidebarCollapsed')),
    )
    .toBe('1')
  await page.waitForTimeout(SETTLE)
  const collapsedWidth = await sidebar.evaluate(el =>
    Math.round(el.getBoundingClientRect().width),
  )
  expect(collapsedWidth).toBeLessThanOrEqual(80)
  await expect(
    page.getByRole('button', { name: 'Expand sidebar' }),
  ).toBeVisible()

  // The collapsed state survives a reload.
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveClass(/sidebar-collapsed/)
  await expect(
    page.getByRole('button', { name: 'Expand sidebar' }),
  ).toBeVisible()

  // Expand again and the rail returns to its original width.
  await page.getByRole('button', { name: 'Expand sidebar' }).click()
  await expect(page.locator('html')).not.toHaveClass(/sidebar-collapsed/)
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem('dydan.sidebarCollapsed')),
    )
    .toBe('0')
  await page.waitForTimeout(SETTLE)
  const restoredWidth = await sidebar.evaluate(el =>
    Math.round(el.getBoundingClientRect().width),
  )
  expect(restoredWidth).toBe(expandedWidth)

  runtimeGuard.assertClean()
})

test('shell: mobile drawer stays a full labeled drawer even while the rail is collapsed', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  // Collapse the desktop rail, then switch to a phone viewport.
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await expect(page.locator('html')).toHaveClass(/sidebar-collapsed/)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  const drawer = page.locator('.figma-mobile-drawer')
  await page.locator('.figma-menu-button').click()
  await expect(drawer).toBeVisible()

  // The drawer opens at the full brand width with labels intact, and the
  // collapse/expand toggle (a desktop-rail affordance) is hidden.
  const drawerWidth = await drawer.evaluate(el =>
    Math.round(el.getBoundingClientRect().width),
  )
  expect(drawerWidth).toBeGreaterThan(200)
  await expect(
    drawer.getByRole('button', { name: /collapse sidebar|expand sidebar/i }),
  ).toHaveCount(0)
  await expect(drawer.locator('.figma-brand > div')).toBeVisible()
  await expect(drawer.locator('.nav-item span').first()).toBeVisible()

  runtimeGuard.assertClean()
})

test('shell: settings navigation renders as a horizontal tab strip above the content', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  const nav = page.locator('.figma-settings-nav')
  const content = page.locator('.figma-settings-content')
  await expect(nav).toBeVisible()
  await expect(content).toBeVisible()

  const layout = await page.evaluate(() => {
    const navEl = document.querySelector('.figma-settings-nav')
    const contentEl = document.querySelector('.figma-settings-content')
    const navRect = navEl.getBoundingClientRect()
    const contentRect = contentEl.getBoundingClientRect()
    return {
      navDirection: getComputedStyle(navEl).flexDirection,
      navWidth: Math.round(navRect.width),
      navAboveContent: navRect.bottom <= contentRect.top + 1,
      tabCount: navEl.querySelectorAll('.figma-settings-nav-item').length,
    }
  })

  // The tab strip spans the content width horizontally and sits on top.
  expect(layout.navDirection).toBe('row')
  expect(layout.navWidth).toBeGreaterThan(300)
  expect(layout.navAboveContent).toBe(true)
  expect(layout.tabCount).toBeGreaterThan(5)

  // The active tab uses the Figma nav-item vocabulary: brand-faint fill.
  const active = page.locator('.figma-settings-nav-item.active')
  await expect(active).toBeVisible()
  const activeBackground = await active.evaluate(
    el => getComputedStyle(el).backgroundColor,
  )
  expect(activeBackground).not.toBe('rgba(0, 0, 0, 0)')
  expect(activeBackground).not.toBe('transparent')

  runtimeGuard.assertClean()
})

test('shell: notifications bell is clearly visible beside Add a task', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  const actions = page.locator('.figma-top-actions')
  const bell = actions.getByRole('button', { name: 'Notifications' })
  const addTask = actions.getByRole('button', { name: /add a task/i })
  await expect(bell).toBeVisible()
  await expect(addTask).toBeVisible()

  // The bell is a surface + border control with the full-strength icon color.
  const bellStyle = await bell.evaluate(el => {
    const style = getComputedStyle(el)
    return {
      borderWidth: style.borderTopWidth,
      borderStyle: style.borderTopStyle,
      backgroundColor: style.backgroundColor,
      color: style.color,
    }
  })
  expect(bellStyle.borderStyle).not.toBe('none')
  expect(bellStyle.borderWidth).not.toBe('0px')
  expect(bellStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(bellStyle.backgroundColor).not.toBe('transparent')

  // It sits immediately to the left of the Add a task primary button.
  const order = await page.evaluate(() => {
    const buttons = [
      ...document
        .querySelector('.figma-top-actions')
        .querySelectorAll('button'),
    ]
    const indexOf = pattern =>
      buttons.findIndex(button =>
        (button.getAttribute('aria-label') || '').match(pattern),
      )
    return { bell: indexOf(/notifications/i), add: indexOf(/add a task/i) }
  })
  expect(order.bell).toBeGreaterThanOrEqual(0)
  expect(order.add).toBeGreaterThan(order.bell)

  // Hover raises the bell to the brand treatment (faint fill, brand border and
  // icon) so it reads as an interactive control next to the primary button.
  // Assertions auto-retry past the 140ms button transition to final values.
  await bell.hover()
  // Wait past the button's 140ms transition for color to settle, then
  // verify the hover state uses the known dydan light brand values.
  // (Avoids probing custom-properties which have inheritance flakiness.)
  await page.waitForTimeout(200)
  await expect(bell).toHaveCSS('color', 'rgb(67, 38, 234)')
  await expect(bell).toHaveCSS('background-color', 'rgb(221, 249, 255)')
  await expect(bell).toHaveCSS('border-color', 'rgb(67, 38, 234)')

  runtimeGuard.assertClean()
})

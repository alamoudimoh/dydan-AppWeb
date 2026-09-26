import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

/**
 * Geometry of the category color dropdown, measured rather than assumed.
 *
 * The unit suite asserts the stylesheet says the right things; this asserts the
 * browser resolved them, which is a different question. A rule can be present,
 * correct, and still lose to a more specific one or be overridden by a later
 * shorthand — a cap that never applied looks identical in source and
 * completely different here.
 */

const FIELD = '.color-picker-field'
const TRIGGER = '.color-picker-field .themed-trigger'
const POPOVER = '.color-picker-field .theme-popover'
const OPTIONS = '.color-picker-field .member-options'

/** Opens Settings -> Space -> Categories and the new-category form's dropdown. */
const openColorDropdown = async page => {
  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await page.getByRole('tab', { name: /^space$/i }).click()

  // The section title is a styled label, not a heading.
  const section = page.locator('.section-label', { hasText: 'Categories' })
  await expect(section).toBeVisible()

  await page.getByRole('button', { name: /new category/i }).click()
  const name = page.getByLabel('Category name')
  await expect(name).toBeVisible()

  // The name input is the row this must not shrink, so measure it first.
  const trigger = page.getByRole('button', { name: 'Category color' })
  await trigger.click()
  await expect(
    page.getByRole('listbox', { name: 'Category color' }),
  ).toBeVisible()
  return { name, trigger }
}

test('category color dropdown: the field is compact and stays responsive', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)

  // Desktop first: the cap is only observable where there is room to exceed it.
  await page.setViewportSize({ width: 1280, height: 720 })
  const { name } = await openColorDropdown(page)

  const field = await page.locator(FIELD).boundingBox()
  const triggerBox = await page.locator(TRIGGER).boundingBox()
  const nameBox = await name.boundingBox()

  // The cap lands on the trigger, so the control is compact on a wide form.
  expect(field.width).toBeLessThanOrEqual(320)
  expect(triggerBox.width).toBeLessThanOrEqual(320)
  expect(triggerBox.width).toBeGreaterThan(0)

  // And it is the color field only: the name input still spans the full row,
  // so the cap did not come from a change to the form column.
  expect(nameBox.width).toBeGreaterThan(triggerBox.width)
  expect(nameBox.width).toBeGreaterThan(320)

  // Responsive: at phone width the field shrinks to the space available
  // rather than holding a fixed 320px, so it neither overflows the screen nor
  // leaves a gap it does not need. The shrink is the point — a fixed width
  // would pass an "does not overflow" check while behaving worse.
  await page.setViewportSize({ width: 390, height: 844 })
  const narrow = await page.locator(FIELD).boundingBox()
  expect(narrow.width).toBeLessThanOrEqual(390)
  expect(narrow.width).toBeGreaterThan(0)
  expect(narrow.width).toBeLessThan(triggerBox.width)

  runtimeGuard.assertClean()
})

test('category color dropdown: the opened dropdown matches its trigger', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.setViewportSize({ width: 1280, height: 720 })
  await openColorDropdown(page)

  const trigger = await page.locator(TRIGGER).boundingBox()
  const popover = await page.locator(POPOVER).boundingBox()

  // The requirement: matched to the trigger, not the shared 228px popover.
  expect(Math.abs(popover.width - trigger.width)).toBeLessThanOrEqual(1)
  // Which also means it is wider than the popover those selectors still use.
  expect(popover.width).toBeGreaterThan(228)

  // Left edges aligned, so it opens under the control rather than offset.
  expect(Math.abs(popover.x - trigger.x)).toBeLessThanOrEqual(1)

  runtimeGuard.assertClean()
})

test('category color dropdown: corners and border match the trigger', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.setViewportSize({ width: 1280, height: 720 })
  await openColorDropdown(page)

  const corner = async selector =>
    Number.parseFloat(
      await page
        .locator(selector)
        .evaluate(node => getComputedStyle(node).borderTopLeftRadius),
    )
  const border = async selector =>
    page
      .locator(selector)
      .evaluate(node => getComputedStyle(node).borderTopWidth)

  // Same radius, so the open control reads as the field opened up rather than
  // a differently-shaped surface tethered to it. The shared popover is --r-lg.
  expect(await corner(POPOVER)).toBeCloseTo(await corner(TRIGGER), 1)
  expect(await corner(POPOVER)).toBeLessThan(18)

  // Consistent 1px border on both, so neither edge reads as heavier.
  expect(await border(TRIGGER)).toBe('1px')
  expect(await border(POPOVER)).toBe('1px')

  // Padding on the dropdown, so options do not sit flush against the border.
  const padding = await page
    .locator(POPOVER)
    .evaluate(node => getComputedStyle(node).paddingLeft)
  expect(Number.parseFloat(padding)).toBeGreaterThan(0)

  runtimeGuard.assertClean()
})

test('category color dropdown: the search field is contained cleanly', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.setViewportSize({ width: 1280, height: 720 })
  await openColorDropdown(page)

  const search = page.getByLabel('Search category color')
  const searchBox = await search.boundingBox()
  const popover = await page.locator(POPOVER).boundingBox()
  const list = await page.locator(OPTIONS).boundingBox()

  // Inside the dropdown horizontally, with a real inset on both sides.
  expect(searchBox.x).toBeGreaterThan(popover.x)
  expect(searchBox.x + searchBox.width).toBeLessThan(popover.x + popover.width)

  // Above the list it filters, not overlapping it.
  expect(searchBox.y + searchBox.height).toBeLessThanOrEqual(list.y + 1)

  runtimeGuard.assertClean()
})

test('category color dropdown: no scrollbar button, but scrolling remains', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.setViewportSize({ width: 1280, height: 720 })
  await openColorDropdown(page)

  const options = page.locator(OPTIONS)

  // The arrow/button WebKit otherwise paints at the end of a scrollable area
  // is what sat at the bottom of this list.
  const button = await options.evaluate(node => {
    const style = getComputedStyle(node, '::-webkit-scrollbar-button')
    return { display: style.display, height: style.height, width: style.width }
  })
  expect(button.display).toBe('none')

  // The thin bar is retained, and the list still scrolls: 23 options in a
  // capped box must be reachable.
  const bar = await options.evaluate(node => ({
    overflowY: getComputedStyle(node).overflowY,
    width: getComputedStyle(node, '::-webkit-scrollbar').width,
  }))
  expect(bar.width).toBe('2px')
  expect(bar.overflowY).toBe('auto')

  // Behavioural proof the list scrolls: the options list overflows, and
  // scrolling to the bottom moves the last palette color into view. Checked
  // within the list's own scroll box, not the page viewport, because a
  // scrolled-away option can sit outside both.
  const scroll = await options.evaluate(node => ({
    client: node.clientHeight,
    scroll: node.scrollHeight,
  }))
  expect(scroll.scroll).toBeGreaterThan(scroll.client)

  const before = await page
    .getByRole('option', { name: /Sand/ })
    .evaluate(node => node.getBoundingClientRect().top)
  await options.evaluate(node => node.scrollTo(0, node.scrollHeight))
  await expect
    .poll(() =>
      page
        .getByRole('option', { name: /Sand/ })
        .evaluate(node => node.getBoundingClientRect().top),
    )
    .toBeLessThan(before)

  runtimeGuard.assertClean()
})

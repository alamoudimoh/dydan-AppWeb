import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

/**
 * The two product themes are defined entirely by the approved semantic tokens.
 * These assertions pin the exact approved values for both sovereign
 * appearances, prove inputs resolve the approved input colors (background,
 * text, default/hover/focus border), and prove neither theme renders a
 * personal-brand logo.
 *
 * Nothing here inspects rendering visually: every check reads either the
 * authored custom property or the computed style of a real element.
 */

const APPROVED = {
  sovereign: {
    light: {
      '--page': '#f6f2e8',
      '--surface': '#ffffff',
      '--surface-2': '#ebe7de',
      '--surface-3': '#f7edcf',
      '--t-primary': '#071a2c',
      '--t-muted': '#142d40',
      '--t-faint': '#5f421b',
      '--line': '#ebe7de',
      '--line-strong': '#4d7794',
      '--brand': '#071a2c',
      '--brand-hover': '#142d40',
      '--brand-accent': '#e0b45a',
      '--brand-contrast': '#f6f2e8',
      '--accent': '#2c6373',
      '--accent-bg': '#f7edcf',
      '--accent-text': '#5f421b',
      '--selected-bg': '#e0b45a',
      '--selected-text': '#071a2c',
      '--selected-border': '#071a2c',
      '--action-primary-bg': '#071a2c',
      '--action-primary-hover': '#142d40',
      '--action-primary-pressed': '#04111d',
      '--action-primary-text': '#f6f2e8',
      '--input-bg': '#ffffff',
      '--input-text': '#071a2c',
      '--input-border': '#4d7794',
      '--input-hover': '#071a2c',
      '--input-focus': '#071a2c',
      '--focus-ring': '#071a2c',
      '--focus-offset': '#f6f2e8',
    },
    dark: {
      '--page': '#071a2c',
      '--surface': '#142d40',
      '--surface-2': '#142d40',
      '--surface-3': '#04111d',
      '--t-primary': '#f6f2e8',
      '--t-muted': '#d8c9a8',
      '--t-faint': '#aec1cf',
      '--line': '#2c6373',
      '--line-strong': '#829fb4',
      '--brand': '#e0b45a',
      '--brand-hover': '#e8c97d',
      '--brand-accent': '#e0b45a',
      '--brand-contrast': '#071a2c',
      '--accent': '#d8c9a8',
      '--accent-bg': '#04111d',
      '--accent-text': '#e0b45a',
      '--selected-bg': '#e0b45a',
      '--selected-text': '#071a2c',
      '--selected-border': '#071a2c',
      '--action-primary-bg': '#e0b45a',
      '--action-primary-hover': '#e8c97d',
      '--action-primary-pressed': '#e0b45a',
      '--action-primary-text': '#071a2c',
      '--input-bg': '#142d40',
      '--input-text': '#f6f2e8',
      '--input-border': '#829fb4',
      '--input-hover': '#f6f2e8',
      '--input-focus': '#e0b45a',
      '--focus-ring': '#e0b45a',
      '--focus-offset': '#071a2c',
    },
  },
  dydan: {
    light: {
      '--input-border': '#7769b6',
      '--input-focus': '#34236d',
    },
    dark: {
      '--input-border': '#8a79bf',
      '--input-focus': '#ffcc5c',
    },
  },
}

/**
 * Read one authored custom property off the document element. A browser
 * re-serializes a custom property that some rule consumes, so `#ffffff` comes
 * back as `#fff`; expand it so the comparison stays on the approved hex.
 */
const tokenValue = async (page, name) => {
  const raw = await page.evaluate(
    value =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(value)
        .trim()
        .toLowerCase(),
    name,
  )
  return /^#[0-9a-f]{3}$/.test(raw)
    ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
    : raw
}

/** Resolve a token to the rgb() string the browser paints it with. */
const resolvedColor = async (page, name) =>
  page.evaluate(value => {
    const probe = document.createElement('span')
    probe.style.color = `var(${value})`
    probe.style.position = 'absolute'
    probe.style.visibility = 'hidden'
    document.body.appendChild(probe)
    const color = getComputedStyle(probe).color
    probe.remove()
    return color
  }, name)

const styleOf = (locator, property) =>
  locator.evaluate((el, prop) => getComputedStyle(el)[prop], property)

/** Poll so a running color transition cannot skew a reading. */
const expectPainted = async (locator, property, expected) => {
  await expect.poll(() => styleOf(locator, property)).toBe(expected)
}

for (const [theme, appearance] of [
  ['sovereign', 'light'],
  ['sovereign', 'dark'],
]) {
  test(`palette: ${theme} ${appearance} resolves the approved tokens and input colors`, async ({
    page,
  }) => {
    const runtimeGuard = attachRuntimeErrorGuard(page)
    await installApiMocks(page)
    await installSmokeSession(page)
    await overrideUserPreferences(page, smokePreferences({ theme, appearance }))

    await page.goto('/maintenance', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    await expect(page.locator('html')).toHaveAttribute(
      'data-joy-color-scheme',
      appearance,
    )

    for (const [name, expected] of Object.entries(
      APPROVED[theme][appearance],
    )) {
      expect(await tokenValue(page, name), name).toBe(expected)
    }

    // A real input paints the approved input colors, including the hover and
    // focus boundaries, and never falls back to a disappearing separator.
    const input = page.getByLabel('New maintenance asset name')
    await expectPainted(
      input,
      'backgroundColor',
      await resolvedColor(page, '--input-bg'),
    )
    await expectPainted(
      input,
      'color',
      await resolvedColor(page, '--input-text'),
    )
    await expectPainted(
      input,
      'borderTopColor',
      await resolvedColor(page, '--input-border'),
    )
    await input.hover()
    await expectPainted(
      input,
      'borderTopColor',
      await resolvedColor(page, '--input-hover'),
    )
    await input.fill('Palette check')
    await expectPainted(
      input,
      'borderTopColor',
      await resolvedColor(page, '--input-focus'),
    )

    runtimeGuard.assertClean()
  })
}

for (const [theme, appearance] of [
  ['dydan', 'light'],
  ['dydan', 'dark'],
]) {
  test(`palette: ${theme} ${appearance} keeps its approved input boundary`, async ({
    page,
  }) => {
    const runtimeGuard = attachRuntimeErrorGuard(page)
    await installApiMocks(page)
    await installSmokeSession(page)
    await overrideUserPreferences(page, smokePreferences({ theme, appearance }))

    await page.goto('/maintenance', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')

    for (const [name, expected] of Object.entries(APPROVED.dydan[appearance])) {
      expect(await tokenValue(page, name), name).toBe(expected)
    }

    const input = page.getByLabel('New maintenance asset name')
    const expectedBorder = await resolvedColor(page, '--input-border')
    await expectPainted(input, 'borderTopColor', expectedBorder)
    await input.hover()
    await expectPainted(input, 'borderTopColor', expectedBorder)
    await input.fill('Palette check')
    await expectPainted(
      input,
      'borderTopColor',
      await resolvedColor(page, '--input-focus'),
    )

    runtimeGuard.assertClean()
  })
}

for (const theme of ['dydan', 'sovereign']) {
  test(`logo: ${theme} renders the application logo with no personal-brand glyph`, async ({
    page,
  }) => {
    const runtimeGuard = attachRuntimeErrorGuard(page)
    await installApiMocks(page)
    await installSmokeSession(page)
    await overrideUserPreferences(page, smokePreferences({ theme }))

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')

    // The application logo is a single stroked mark: it must carry no text
    // node, so no theme can substitute a personal initial.
    const logo = page.locator('.sidebar-header svg').first()
    await expect(logo).toBeVisible()
    expect(await logo.locator('text').count()).toBe(0)
    expect(await logo.locator('image').count()).toBe(0)
    expect((await logo.textContent()).trim()).toBe('')
    // Still the real mark: a circle, a hexagon outline and its center dot.
    expect(await logo.locator('circle').count()).toBe(2)
    expect(await logo.locator('path').count()).toBe(1)

    runtimeGuard.assertClean()
  })
}

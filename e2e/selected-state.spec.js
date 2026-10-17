import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

/**
 * Segmented controls that represent a selection (Maintenance / Meters /
 * Things and Rewards / Requests / Points) must resolve their selected state
 * from the semantic selected tokens, never from a surface token. A surface
 * token disappears into the track, which is exactly the weak selected state
 * this suite locks out in all four theme × appearance combinations.
 */
const COMBINATIONS = [
  { theme: 'dydan', appearance: 'light' },
  { theme: 'dydan', appearance: 'dark' },
  { theme: 'sovereign', appearance: 'light' },
  { theme: 'sovereign', appearance: 'dark' },
]

const cssVar = async (page, name) =>
  (
    await page.evaluate(
      value =>
        getComputedStyle(document.documentElement).getPropertyValue(value),
      name,
    )
  ).trim()

/** Resolve a CSS custom property to the rgb() form the browser paints with. */
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

/** Assert a locator paints an exact value once its transition settles. */
const expectPainted = async (locator, property, expected) => {
  await expect
    .poll(() =>
      locator.evaluate((el, prop) => getComputedStyle(el)[prop], property),
    )
    .toBe(expected)
}

for (const { appearance, theme } of COMBINATIONS) {
  test(`selected state uses the semantic selected tokens: ${theme} ${appearance}`, async ({
    page,
  }) => {
    const runtimeGuard = attachRuntimeErrorGuard(page)
    await installApiMocks(page)
    await installSmokeSession(page)
    await overrideUserPreferences(page, smokePreferences({ theme, appearance }))

    await page.goto('/assets', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')

    const html = page.locator('html')
    if (theme === 'sovereign') {
      await expect(html).toHaveAttribute('data-theme', 'sovereign')
    } else {
      await expect(html).not.toHaveAttribute('data-theme', 'sovereign')
    }
    await expect(html).toHaveAttribute('data-joy-color-scheme', appearance)

    const selectedBg = await resolvedColor(page, '--selected-bg')
    const selectedText = await resolvedColor(page, '--selected-text')
    const trackBg = await page.evaluate(() => {
      const track = document.querySelector('.seg-tabs')
      return getComputedStyle(track).backgroundColor
    })

    // The active segment is the selected one by default.
    const active = page.locator('.seg-tab.active')
    await expect(active).toHaveCount(1)
    await expect(active).toHaveAttribute('aria-pressed', 'true')
    await expectPainted(active, 'backgroundColor', selectedBg)
    await expectPainted(active, 'color', selectedText)
    // Selected must be visibly distinct from the track behind it.
    expect(selectedBg).not.toBe(trackBg)

    // Switching tabs moves the selected treatment, it does not leave it behind.
    await page.getByRole('button', { name: /Meters \(\d+\)/ }).click()
    const meters = page.locator('.seg-tab.active')
    await expect(meters).toHaveCount(1)
    await expect(meters).toHaveText(/Meters/)
    await expectPainted(meters, 'backgroundColor', selectedBg)
    await expectPainted(meters, 'color', selectedText)

    // The inactive segment stays on the plain track with primary text.
    const inactive = page.locator('.seg-tab:not(.active)').first()
    await expectPainted(inactive, 'backgroundColor', 'rgba(0, 0, 0, 0)')
    await expectPainted(
      inactive,
      'color',
      await resolvedColor(page, '--t-primary'),
    )

    // Sovereign keeps brass-on-navy in both appearances.
    if (theme === 'sovereign') {
      expect((await cssVar(page, '--selected-bg')).toLowerCase()).toBe(
        '#e0b45a',
      )
      expect((await cssVar(page, '--selected-text')).toLowerCase()).toBe(
        '#071a2c',
      )
    }

    // The same contract holds for the Rewards segmented control.
    await page.goto('/rewards', { waitUntil: 'networkidle' })
    const rewardsActive = page.locator('.seg-tab.active')
    await expect(rewardsActive).toHaveCount(1)
    await expectPainted(rewardsActive, 'backgroundColor', selectedBg)

    runtimeGuard.assertClean()
  })
}

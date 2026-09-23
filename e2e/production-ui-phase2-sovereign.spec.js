import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { clearSmokeSession, installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const CASES = [
  { path: '/', width: 1440, mode: 'light', language: 'en' },
  { path: '/chores', width: 390, mode: 'dark', language: 'en' },
  { path: '/projects/', width: 768, mode: 'light', language: 'ar-SA' },
  {
    path: '/family',
    width: 1440,
    mode: 'dark',
    language: 'en',
    tab: /Goals/,
  },
  { path: '/routines', width: 390, mode: 'light', language: 'ar-SA' },
  { path: '/calendar', width: 768, mode: 'dark', language: 'en' },
  { path: '/shopping', width: 1440, mode: 'light', language: 'en' },
  { path: '/maintenance', width: 390, mode: 'dark', language: 'en' },
  { path: '/settings', width: 768, mode: 'light', language: 'ar-SA' },
  { path: '/family', width: 390, mode: 'dark', language: 'ar-SA' },
  { path: '/activities', width: 1440, mode: 'dark', language: 'en' },
]

const PALETTES = {
  light: {
    '--product-page': '#f6f2e8',
    '--product-surface': '#ffffff',
    '--product-surface-subtle': '#ebe7de',
    '--product-text': '#071a2c',
    '--product-text-muted': '#5f421b',
    '--product-boundary': '#4d7794',
    '--product-brand': '#071a2c',
    '--product-brand-hover': '#142d40',
    '--product-brand-contrast': '#f6f2e8',
    '--product-action': '#071a2c',
    '--product-action-text': '#f6f2e8',
    '--product-gold-text': '#5f421b',
    '--product-callout': '#071a2c',
    '--product-callout-text': '#f6f2e8',
    '--product-callout-muted': '#756f68',
    '--product-focus-inner': '#f6f2e8',
    '--product-focus-outer': '#071a2c',
  },
  dark: {
    '--product-page': '#071a2c',
    '--product-surface': '#142d40',
    '--product-surface-subtle': '#142d40',
    '--product-text': '#f6f2e8',
    '--product-text-muted': '#aec1cf',
    '--product-boundary': '#829fb4',
    '--product-brand': '#f6f2e8',
    '--product-brand-hover': '#e8c97d',
    '--product-brand-contrast': '#071a2c',
    '--product-action': '#e0b45a',
    '--product-action-text': '#071a2c',
    '--product-gold-text': '#e0b45a',
    '--product-callout': '#f6f2e8',
    '--product-callout-text': '#071a2c',
    '--product-callout-muted': '#aec1cf',
    '--product-focus-inner': '#071a2c',
    '--product-focus-outer': '#e0b45a',
  },
}

const assertSovereignVariables = async (page, mode) => {
  const rendered = await page.evaluate(names => {
    const style = getComputedStyle(document.documentElement)
    return Object.fromEntries(
      names.map(name => [
        name,
        style.getPropertyValue(name).trim().toLowerCase(),
      ]),
    )
  }, Object.keys(PALETTES[mode]))
  expect(rendered).toEqual(PALETTES[mode])
}

for (const scenario of CASES) {
  test(`sovereign: ${scenario.path} ${scenario.width}px ${scenario.mode} ${scenario.language}`, async ({
    page,
  }) => {
    const runtimeGuard = attachRuntimeErrorGuard(page)
    await page.setViewportSize({ width: scenario.width, height: 900 })
    await installApiMocks(page)
    await installSmokeSession(page)
    await page.addInitScript(
      ({ locale, theme }) => {
        localStorage.setItem('joy-mode', theme)
        localStorage.setItem('themeMode', JSON.stringify(theme))
        localStorage.setItem('dydan.theme', 'sovereign')
        localStorage.setItem('i18nextLng', locale)
        localStorage.setItem('language', JSON.stringify(locale))
      },
      { locale: scenario.language, theme: scenario.mode },
    )

    await page.goto(scenario.path, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)
    if (scenario.tab)
      await page.getByRole('tab', { name: scenario.tab }).click()

    await expect(page.locator('#root')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      scenario.language === 'ar-SA' ? 'rtl' : 'ltr',
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(scenario.width)

    const wordmark = await page.evaluate(() => {
      const nodes = document.querySelectorAll('p, span, div')
      for (const node of nodes) {
        const label = node.textContent.trim()
        if (label === 'Sovereign') {
          return { color: getComputedStyle(node).color, label }
        }
      }
      return null
    })
    expect(wordmark).toBeTruthy()
    expect(wordmark.label).toBe('Sovereign')
    expect(wordmark.color).not.toContain('52, 35, 109') // #34236D
    expect(wordmark.color).not.toContain('#34236D')
    await assertSovereignVariables(page, scenario.mode)
    if (scenario.tab) {
      await expect(page.locator('#root')).not.toContainText(
        'familyProgress.rewards',
      )
    }

    runtimeGuard.assertClean()
  })
}

test('sovereign: mobile task controls stay inside the dialog', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await installApiMocks(page)
  await page.route('**/api/v1/categories*', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        res: [
          {
            id: 9,
            name: 'A very long category name that must not widen the task dialog',
          },
        ],
      }),
    }),
  )
  await installSmokeSession(page)
  await page.addInitScript(() => {
    localStorage.setItem('joy-mode', 'dark')
    localStorage.setItem('themeMode', JSON.stringify('dark'))
    localStorage.setItem('dydan.theme', 'sovereign')
  })

  await page.goto('/chores', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /create a task/i }).click()
  const dialog = page.getByRole('dialog')
  const category = dialog.getByRole('combobox', { name: 'Category' })
  await category.click()
  await dialog
    .getByRole('option', { name: /A very long category name/ })
    .click()

  expect(
    await dialog.evaluate(node => node.scrollWidth <= node.clientWidth),
  ).toBe(true)
  const [dialogBox, categoryBox] = await Promise.all([
    dialog.boundingBox(),
    category.boundingBox(),
  ])
  expect(categoryBox.x).toBeGreaterThanOrEqual(dialogBox.x)
  expect(categoryBox.x + categoryBox.width).toBeLessThanOrEqual(
    dialogBox.x + dialogBox.width,
  )
})

for (const mode of ['light', 'dark']) {
  test(`sovereign: authentication primitives use exact ${mode} palette and 8px radius`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await installApiMocks(page)
    await clearSmokeSession(page)
    await page.addInitScript(theme => {
      localStorage.setItem('joy-mode', theme)
      localStorage.setItem('themeMode', JSON.stringify(theme))
      localStorage.setItem('dydan.theme', 'sovereign')
    }, mode)

    await page.goto('/login', { waitUntil: 'networkidle' })
    await assertSovereignVariables(page, mode)

    const radii = await page.evaluate(() => {
      const radius = selector =>
        getComputedStyle(document.querySelector(selector)).borderRadius
      return {
        card: radius('.auth-card'),
        segmented: radius('.auth-segmented'),
        selectedTab: radius('.auth-segmented__option.active'),
        input: radius('.auth-input'),
        button: radius('.btn-primary'),
      }
    })
    expect(radii).toEqual({
      card: '8px',
      segmented: '8px',
      selectedTab: '8px',
      input: '8px',
      button: '8px',
    })
    await expect(page.locator('.btn-primary').first()).toHaveCSS(
      'background-color',
      'rgb(224, 180, 90)',
    )
    await expect(page.locator('.btn-primary').first()).toHaveCSS(
      'color',
      'rgb(7, 26, 44)',
    )
  })
}

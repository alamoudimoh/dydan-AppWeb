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
    '--product-page': '#ffffff',
    '--product-surface': '#f2f2f2',
    '--product-surface-subtle': '#ffffff',
    '--product-text': '#1a1a1a',
    '--product-text-muted': '#4d4d4d',
    '--product-boundary': '#666666',
    '--product-brand': '#1a1a1a',
    '--product-brand-hover': '#2e2e2e',
    '--product-brand-contrast': '#ffc107',
    '--product-action': '#ffc107',
    '--product-action-text': '#1a1a1a',
    '--product-gold-text': '#4d4d4d',
    '--product-callout': '#1a1a1a',
    '--product-callout-text': '#f2f2f2',
    '--product-callout-muted': '#999999',
    '--product-focus-inner': '#ffffff',
    '--product-focus-outer': '#1a1a1a',
  },
  dark: {
    '--product-page': '#1a1a1a',
    '--product-surface': '#242424',
    '--product-surface-subtle': '#2e2e2e',
    '--product-text': '#f2f2f2',
    '--product-text-muted': '#999999',
    '--product-boundary': '#999999',
    '--product-brand': '#ffc107',
    '--product-brand-hover': '#ffd04d',
    '--product-brand-contrast': '#1a1a1a',
    '--product-action': '#ffc107',
    '--product-action-text': '#1a1a1a',
    '--product-gold-text': '#ffc107',
    '--product-callout': '#242424',
    '--product-callout-text': '#f2f2f2',
    '--product-callout-muted': '#999999',
    '--product-focus-inner': '#1a1a1a',
    '--product-focus-outer': '#ffc107',
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
    expect(wordmark.color).not.toContain('77, 64, 219') // #4D40DB
    expect(wordmark.color).not.toContain('#4D40DB')
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
      'rgb(255, 193, 7)',
    )
    await expect(page.locator('.btn-primary').first()).toHaveCSS(
      'color',
      'rgb(26, 26, 26)',
    )
  })
}

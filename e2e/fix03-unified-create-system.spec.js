import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const prepare = async (page, preferences = {}) => {
  await installApiMocks(page)
  await installSmokeSession(page)
  await overrideUserPreferences(page, smokePreferences(preferences))
}

const canonicalModal = page => page.locator('[data-create-modal="canonical"]')

const openUniversal = async page => {
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  const selector = page.getByRole('menu', { name: 'Create' })
  await expect(selector).toBeVisible()
  return selector
}

const chooseUniversal = async (page, label) => {
  const selector = await openUniversal(page)
  await selector.getByRole('menuitem', { name: label, exact: true }).click()
  await expect(selector).toHaveCount(0)
  const modal = canonicalModal(page)
  await expect(modal).toBeVisible()
  return modal
}

test('fix03: global + opens the compact top-level Create selector', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await prepare(page)
  await page.goto('/', { waitUntil: 'networkidle' })
  const selector = await openUniversal(page)

  await expect(selector.getByRole('menuitem')).toHaveCount(5)
  for (const label of [
    'Task',
    'Project',
    'Routine',
    'Asset',
    'Shopping List',
  ]) {
    await expect(
      selector.getByRole('menuitem', { name: label, exact: true }),
    ).toBeVisible()
  }
  for (const [type, icon] of [
    ['task', 'tasks'],
    ['project', 'projects'],
    ['routine', 'repeat'],
    ['asset', 'maintenance'],
    ['shopping-list', 'shopping'],
  ]) {
    await expect(
      selector.locator(`[data-entity-type="${type}"] [data-icon="${icon}"]`),
    ).toBeVisible()
  }
  await expect(selector.getByText('Shopping Item')).toHaveCount(0)

  await page.keyboard.press('Escape')
  await expect(selector).toHaveCount(0)
  runtimeGuard.assertClean()
})

for (const [label, title, icon] of [
  ['Task', 'New task', 'tasks'],
  ['Project', 'New project', 'projects'],
  ['Routine', 'New routine', 'repeat'],
  ['Asset', 'New asset', 'maintenance'],
  ['Shopping List', 'New shopping list', 'shopping'],
]) {
  test(`fix03: global Create → ${label} opens the canonical modal`, async ({
    page,
  }) => {
    const runtimeGuard = attachRuntimeErrorGuard(page)
    await prepare(page)
    await page.goto('/today', { waitUntil: 'networkidle' })
    const modal = await chooseUniversal(page, label)
    await expect(modal.getByRole('heading', { name: title })).toBeVisible()
    await expect(
      modal.locator(`.create-modal-icon[data-entity-icon="${icon}"]`),
    ).toBeVisible()
    await expect(page.getByTestId('create-selector')).toHaveCount(0)
    await modal.getByRole('button', { name: 'Cancel' }).click()
    await expect(modal).toHaveCount(0)
    runtimeGuard.assertClean()
  })
}

test('fix03: every contextual content action uses the same modal shell', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await prepare(page)

  const cases = [
    ['/projects', 'New project', 'New project', 'projects'],
    ['/routines', 'New routine', 'New routine', 'repeat'],
    ['/maintenance', 'New asset', 'New asset', 'maintenance'],
    ['/shopping', 'New shopping list', 'New shopping list', 'shopping'],
    ['/goals', 'New goal', 'New goal', 'goals'],
    ['/rewards', 'New reward', 'New reward', 'gift'],
  ]
  for (const [path, action, title, icon] of cases) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const actionButton = page.getByRole('button', {
      name: action,
      exact: true,
    })
    await expect(actionButton.locator(`[data-icon="${icon}"]`)).toBeVisible()
    await actionButton.click()
    const modal = canonicalModal(page)
    await expect(modal.getByRole('heading', { name: title })).toBeVisible()
    await expect(
      modal.locator(`.create-modal-icon[data-entity-icon="${icon}"]`),
    ).toBeVisible()
    await modal.getByRole('button', { name: 'Cancel' }).click()
  }

  await page.goto('/maintenance', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Meters \(\d+\)/ }).click()
  await page.getByRole('button', { name: 'New meter' }).click()
  await expect(
    canonicalModal(page).getByRole('heading', { name: 'New meter' }),
  ).toBeVisible()
  await expect(
    canonicalModal(page).locator('[data-entity-icon="meter"]'),
  ).toBeVisible()
  await canonicalModal(page).getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: /Trackers \(\d+\)/ }).click()
  await page.getByRole('button', { name: 'New tracker' }).click()
  await expect(
    canonicalModal(page).getByRole('heading', { name: 'New tracker' }),
  ).toBeVisible()
  await expect(
    canonicalModal(page).locator('[data-entity-icon="activity"]'),
  ).toBeVisible()
  await canonicalModal(page).getByRole('button', { name: 'Cancel' }).click()

  await page.goto('/shopping', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'New item' }).click()
  await expect(
    canonicalModal(page).getByRole('heading', { name: 'New item' }),
  ).toBeVisible()
  await expect(
    canonicalModal(page).locator('[data-entity-icon="shopping_item"]'),
  ).toBeVisible()
  runtimeGuard.assertClean()
})

test('fix03: migrated creation forms are not permanently inline', async ({
  page,
}) => {
  await prepare(page)
  for (const [path, selectors] of [
    ['/projects', ['#project-name']],
    ['/routines', ['#routine-name', '#routine-steps']],
    ['/maintenance', ['#asset-name', '#meter-name', '#tracker-name']],
    ['/shopping', ['#shopping-list-name', '#shopping-item-name']],
    ['/goals', ['#goal-name']],
    ['/rewards', ['#reward-name']],
  ]) {
    await page.goto(path, { waitUntil: 'networkidle' })
    await expect(canonicalModal(page)).toHaveCount(0)
    for (const selector of selectors) {
      await expect(page.locator(selector)).toHaveCount(0)
    }
  }
})

test('fix03: Assets terminology and Assets / Meters / Trackers hierarchy render', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/maintenance', { waitUntil: 'networkidle' })
  await expect(page.getByTestId('page-title')).toHaveText('Assets')
  await expect(page.locator('.sidebar')).toContainText('Assets')
  await expect(
    page.getByRole('button', { name: /Assets \(\d+\)/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Meters \(\d+\)/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Trackers \(\d+\)/ }),
  ).toBeVisible()
  await expect(page.getByText('Things', { exact: true })).toHaveCount(0)
  await expect(page.getByTestId('page-title')).not.toHaveText('Maintenance')
})

test('fix03: canonical modal closes by X, Cancel, Escape, and overlay', async ({
  page,
}) => {
  await prepare(page)
  await page.goto('/projects', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'New project' }).click()
  await canonicalModal(page)
    .getByRole('button', { name: /Close New project/ })
    .click()
  await expect(canonicalModal(page)).toHaveCount(0)

  await page.getByRole('button', { name: 'New project' }).click()
  await canonicalModal(page).getByRole('button', { name: 'Cancel' }).click()
  await expect(canonicalModal(page)).toHaveCount(0)

  await page.getByRole('button', { name: 'New project' }).click()
  await page.keyboard.press('Escape')
  await expect(canonicalModal(page)).toHaveCount(0)

  await page.getByRole('button', { name: 'New project' }).click()
  await page.getByTestId('create-modal-overlay').click({
    position: { x: 5, y: 5 },
  })
  await expect(canonicalModal(page)).toHaveCount(0)
})

test('fix03: modal frame dimensions stay fixed across all required entities', async ({
  page,
}, testInfo) => {
  await prepare(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/maintenance', { waitUntil: 'networkidle' })

  const frames = []
  const capture = async name => {
    const modal = canonicalModal(page)
    await expect(modal).toBeVisible()
    frames.push(await modal.boundingBox())
    await testInfo.attach(`desktop-create-${name}`, {
      body: await modal.screenshot(),
      contentType: 'image/png',
    })
    await modal.getByRole('button', { name: 'Cancel' }).click()
  }

  for (const [label, name] of [
    ['Task', 'task'],
    ['Project', 'project'],
    ['Routine', 'routine'],
    ['Asset', 'asset'],
    ['Shopping List', 'shopping-list'],
  ]) {
    await chooseUniversal(page, label)
    await capture(name)
  }
  await page.getByRole('button', { name: /Meters \(\d+\)/ }).click()
  await page.getByRole('button', { name: 'New meter' }).click()
  await capture('meter')
  await page.getByRole('button', { name: /Trackers \(\d+\)/ }).click()
  await page.getByRole('button', { name: 'New tracker' }).click()
  await capture('tracker')
  await page.goto('/shopping', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'New item' }).click()
  await capture('shopping-item')

  const [reference, ...rest] = frames
  for (const frame of rest) {
    expect(Math.abs(frame.x - reference.x)).toBeLessThan(1)
    expect(Math.abs(frame.y - reference.y)).toBeLessThan(1)
    expect(Math.abs(frame.width - reference.width)).toBeLessThan(1)
    expect(Math.abs(frame.height - reference.height)).toBeLessThan(1)
  }
})

for (const language of ['en', 'ar-SA']) {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 900 },
  ]) {
    test(`fix03: selector + modal are responsive in ${language} ${viewport.name}`, async ({
      page,
    }, testInfo) => {
      await prepare(page, { language })
      await page.setViewportSize(viewport)
      await page.goto('/', { waitUntil: 'networkidle' })
      const globalLabel = language === 'en' ? 'Create' : 'إنشاء'
      await page.getByRole('button', { name: globalLabel, exact: true }).click()
      const selector = page.getByRole('menu', { name: globalLabel })
      await expect(selector).toBeVisible()
      await testInfo.attach(`selector-${language}-${viewport.name}`, {
        body: await selector.screenshot(),
        contentType: 'image/png',
      })
      const itemLabel = language === 'en' ? 'Routine' : 'روتين'
      await selector
        .getByRole('menuitem', { name: itemLabel, exact: true })
        .click()
      const modal = canonicalModal(page)
      await expect(modal).toBeVisible()
      const bounds = await modal.boundingBox()
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width)
      expect(bounds.y).toBeGreaterThanOrEqual(0)
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(viewport.width)
      await testInfo.attach(`modal-${language}-${viewport.name}`, {
        body: await modal.screenshot(),
        contentType: 'image/png',
      })
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        language === 'en' ? 'ltr' : 'rtl',
      )
    })
  }
}

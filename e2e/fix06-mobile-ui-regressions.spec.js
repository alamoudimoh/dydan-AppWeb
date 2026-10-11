import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const json = body => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
})
const prepare = async (page, preferences = {}) => {
  await installApiMocks(page)
  await installSmokeSession(page)
  await overrideUserPreferences(page, smokePreferences(preferences))
}
const bounds = locator =>
  locator.evaluate(el => {
    const r = el.getBoundingClientRect()
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      bottom: r.bottom,
    }
  })
const primaryRoutes = [
  '/projects',
  '/routines',
  '/maintenance',
  '/shopping',
  '/goals',
]
const englishRoutes = ['/', '/today', ...primaryRoutes, '/rewards']
const arabicRoutes = ['/maintenance', '/shopping', '/goals', '/today']
const viewports = [
  { width: 390, height: 900 },
  { width: 390, height: 844 },
]

// Installs before any application script. Mutation samples catch synchronous
// visibility changes; rAF samples check the actual pre-paint visible state.
const observeBoot = async (page, cachedMode) =>
  page.addInitScript(mode => {
    window.__themeFrames = []
    const sample = source => {
      const html = document.documentElement
      const root = document.getElementById('root')
      if (!html || !root) return
      const style = getComputedStyle(root)
      window.__themeFrames.push({
        source,
        visible: style.visibility === 'visible' && root.children.length > 0,
        stage: html.dataset.presentation,
        brand: html.dataset.theme || 'dydan',
        mode: html.dataset.joyColorScheme,
        page: getComputedStyle(html).getPropertyValue('--page').trim(),
        background: document.querySelector('.main-content')
          ? getComputedStyle(document.querySelector('.main-content'))
              .backgroundColor
          : null,
        transitioning: document.body.classList.contains('theme-transitioning'),
      })
    }
    new MutationObserver(() => sample('mutation')).observe(document, {
      subtree: true,
      attributes: true,
      childList: true,
    })
    const frame = () => {
      sample('frame')
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
    // Deliberately seed Joy's unrelated cache with the opposite preference.
    localStorage.setItem('dydan-joy-mode', mode)
  }, cachedMode)

for (const [brand, appearance, system, color] of [
  ['dydan', 'light', 'dark', '#fff8e8'],
  ['dydan', 'dark', 'light', '#34236d'],
  ['sovereign', 'light', 'dark', '#f6f2e8'],
  ['sovereign', 'dark', 'light', '#071a2c'],
  ['dydan', 'system', 'light', '#fff8e8'],
  ['sovereign', 'system', 'dark', '#071a2c'],
]) {
  test(`fix06: first visible boot + repeated hard reload ${brand}/${appearance}/${system}`, async ({
    page,
  }, testInfo) => {
    await prepare(page, { theme: brand, appearance })
    await page.emulateMedia({ colorScheme: system })
    const resolvedMode = appearance === 'system' ? system : appearance
    await observeBoot(page, resolvedMode === 'dark' ? 'light' : 'dark')
    let release
    let requested
    let requestArrived
    const hold = () => {
      requested = new Promise(resolve => {
        requestArrived = resolve
      })
      return new Promise(resolve => {
        release = resolve
      })
    }
    let gate = hold()
    await page.route('**/api/v1/users/preferences', async route => {
      requestArrived()
      await gate
      await route.fulfill(
        json({ res: smokePreferences({ theme: brand, appearance }) }),
      )
    })
    const cdp = await page.context().newCDPSession(page)
    const proof = []
    for (let boot = 0; boot < 3; boot++) {
      if (boot === 0)
        await page.goto('/today', { waitUntil: 'domcontentloaded' })
      else {
        gate = hold()
        await cdp.send('Page.reload', { ignoreCache: true })
      }
      await requested
      await page.waitForFunction(
        () =>
          window.__themeFrames.filter(
            f => f.source === 'frame' && f.stage === 'pending',
          ).length >= 12,
      )
      await expect(page.locator('#presentation-boot')).toBeVisible()
      expect(
        await page.evaluate(() => window.__themeFrames.filter(f => f.visible)),
      ).toEqual([])
      release()
      await expect(page.locator('.app-shell')).toBeVisible()
      await page.waitForFunction(() =>
        window.__themeFrames.some(f => f.source === 'frame' && f.visible),
      )
      const frames = await page.evaluate(() =>
        window.__themeFrames.filter(f => f.visible),
      )
      const resolved = appearance === 'system' ? system : appearance
      for (const frame of frames) {
        expect(frame.brand).toBe(brand)
        expect(frame.mode).toBe(resolved)
        expect(frame.page.toLowerCase()).toBe(color)
        const rgb = [1, 3, 5].map(start =>
          Number.parseInt(color.slice(start, start + 2), 16),
        )
        expect(frame.background).toBe(`rgb(${rgb.join(', ')})`)
        expect(frame.stage).toBe('ready')
      }
      const first = frames.find(f => f.source === 'frame')
      expect(first.transitioning).toBe(false)
      proof.push({ boot, firstVisibleFrame: first, wrongVisibleFrames: 0 })
    }
    await testInfo.attach('pre-paint-theme-proof', {
      body: JSON.stringify(proof),
      contentType: 'application/json',
    })
    if (appearance === 'system') {
      const changed = system === 'dark' ? 'light' : 'dark'
      await page.emulateMedia({ colorScheme: changed })
      await expect(page.locator('html')).toHaveAttribute(
        'data-joy-color-scheme',
        changed,
      )
    }
  })
}

test('fix06: failed authoritative preferences remain neutral and can retry', async ({
  page,
}) => {
  await prepare(page)
  let fail = true
  await page.route('**/api/v1/users/preferences', route =>
    route.fulfill({
      ...json(
        fail
          ? { error: 'unavailable' }
          : {
              res: smokePreferences({ theme: 'sovereign', appearance: 'dark' }),
            },
      ),
      status: fail ? 503 : 200,
    }),
  )
  await page.goto('/today')
  await expect(page.locator('.presentation-error')).toBeVisible()
  await expect(page.locator('.app-shell')).toHaveCount(0)
  fail = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.locator('.app-shell')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sovereign')
  await expect(page.locator('html')).toHaveAttribute(
    'data-joy-color-scheme',
    'dark',
  )
})

for (const viewport of viewports) {
  for (const language of ['en', 'ar-SA']) {
    for (const safeInset of [0, 34]) {
      test(`fix06: dock clearance ${viewport.height} ${language} safe=${safeInset}`, async ({
        page,
      }, testInfo) => {
        const guard = attachRuntimeErrorGuard(page)
        await prepare(page, { language })
        await shoppingState(page, { long: true })
        await page.route('**/api/v1/projects', route =>
          route.fulfill(
            json({
              res: Array.from({ length: 8 }, (_, i) => ({
                id: 100 + i,
                name: `Project ${i + 1}`,
                description: 'Mobile clearance fixture',
                createdBy: 1,
              })),
            }),
          ),
        )
        await page.route('**/api/v1/progress/goals', route =>
          route.fulfill(
            json({
              canManage: true,
              goals: Array.from({ length: 8 }, (_, i) => ({
                id: 100 + i,
                name: `Goal ${i + 1}`,
                metricType: 'tasks_completed',
                progress: 1,
                target: 10,
                status: 'active',
              })),
            }),
          ),
        )
        await page.setViewportSize(viewport)
        const measurements = []
        for (const path of language === 'en' ? englishRoutes : arabicRoutes) {
          await page.goto(path, { waitUntil: 'networkidle' })
          await expect(page.locator('html')).toHaveAttribute(
            'dir',
            language === 'en' ? 'ltr' : 'rtl',
          )
          await page.evaluate(
            inset =>
              document.documentElement.style.setProperty(
                '--safe-area-inset-bottom',
                `${inset}px`,
              ),
            safeInset,
          )
          await page.locator('.main-scroll').evaluate(async el => {
            el.scrollTop = el.scrollHeight
            await new Promise(resolve =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            )
          })
          const measurement = await page.evaluate(() => {
            const scroll = document.querySelector('.main-scroll')
            const dock = document
              .querySelector('.mobile-nav')
              .getBoundingClientRect()
            // Real rendered leaf content, not the PageShell's padded bounds.
            const leaves = [...document.querySelectorAll('.page *')].filter(
              el =>
                (el.matches(
                  'button, input, select, .card, .empty-state, .entity-card',
                ) ||
                  (!el.children.length && el.textContent.trim())) &&
                el.getClientRects().length &&
                getComputedStyle(el).visibility === 'visible',
            )
            const finalBottom = Math.max(
              ...leaves.map(el => el.getBoundingClientRect().bottom),
            )
            return {
              dockTop: dock.top,
              dockHeight: dock.height,
              finalBottom,
              gap: dock.top - finalBottom,
              clearance: getComputedStyle(scroll).paddingBottom,
              atBottom:
                Math.abs(
                  scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop,
                ) <= 1,
              overflow: document.documentElement.scrollWidth > innerWidth,
            }
          })
          expect(measurement.atBottom).toBe(true)
          expect(Number.isFinite(measurement.finalBottom)).toBe(true)
          expect(measurement.gap).toBeGreaterThanOrEqual(47)
          expect(measurement.dockHeight).toBe(60 + safeInset)
          expect(measurement.clearance).toBe(`${108 + safeInset}px`)
          expect(measurement.overflow).toBe(false)
          measurements.push({ path, ...measurement })
        }
        await testInfo.attach('dock-measurements', {
          body: JSON.stringify(measurements),
          contentType: 'application/json',
        })
        guard.assertClean()
      })
    }
    test(`fix06: semantic primary header geometry ${viewport.height} ${language}`, async ({
      page,
    }, testInfo) => {
      await prepare(page, { language })
      await page.setViewportSize(viewport)
      const geometry = []
      for (const path of primaryRoutes) {
        await page.goto(path, { waitUntil: 'networkidle' })
        const row = page.locator('.page-header__primary-action')
        await expect(row.locator('button')).toBeVisible()
        geometry.push({
          path,
          button: await bounds(row.locator('button')),
          row: await bounds(row),
          title: await bounds(page.getByTestId('page-title')),
          gap: await page.evaluate(
            () =>
              document
                .querySelector('.page-header__controls')
                .getBoundingClientRect().top -
              document
                .querySelector('.page-header__main')
                .getBoundingClientRect().bottom,
          ),
        })
        expect(
          await row
            .locator('button')
            .evaluate(el => getComputedStyle(el).position),
        ).not.toBe('absolute')
      }
      for (const key of ['width', 'height', 'y', 'x']) {
        const values = geometry.map(g => g.button[key])
        expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1)
      }
      expect(new Set(geometry.map(g => g.gap))).toEqual(new Set([16]))
      expect(new Set(geometry.map(g => g.title.y)).size).toBe(1)
      // Assets' contextual meter/tracker actions use the exact same slot.
      await page.goto('/maintenance', { waitUntil: 'networkidle' })
      for (const tab of await page
        .getByTestId('assets-tabs')
        .getByRole('button')
        .all()) {
        await tab.click()
        const button = await bounds(
          page.locator('.page-header__primary-action button'),
        )
        expect(
          Math.abs(button.width - geometry[0].button.width),
        ).toBeLessThanOrEqual(1)
        expect(button.height).toBe(geometry[0].button.height)
      }
      await testInfo.attach('primary-action-geometry', {
        body: JSON.stringify(geometry),
        contentType: 'application/json',
      })
    })
  }
}

const shoppingState = async (
  page,
  { count = 3, empty = false, long = false, solo = false } = {},
) => {
  const lists = [
    {
      id: 7,
      name: 'Groceries',
      circleId: null,
      createdBy: 1,
      items: empty
        ? []
        : [
            {
              id: 71,
              listId: 7,
              name: 'Milk',
              quantity: '2',
              isChecked: false,
              createdBy: 1,
            },
            {
              id: 72,
              listId: 7,
              name: 'Bread',
              quantity: '',
              isChecked: true,
              createdBy: 1,
            },
          ],
    },
    { id: 8, name: 'Pharmacy', circleId: 3, createdBy: 1, items: [] },
    { id: 9, name: 'Hardware', circleId: null, createdBy: 1, items: [] },
  ].slice(0, count)
  if (long)
    lists[0].items.push(
      ...Array.from({ length: 30 }, (_, i) => ({
        id: 1000 + i,
        listId: 7,
        name: `Item ${i + 1}`,
        quantity: '',
        isChecked: false,
        createdBy: 1,
      })),
    )
  await page.route('**/api/v1/shopping-lists**', route => {
    const id = Number(new URL(route.request().url()).pathname.split('/')[4])
    return route.fulfill(
      json({
        res: id
          ? lists.find(list => list.id === id)
          : lists.map(({ items, ...list }) => ({
              ...list,
              itemCount: items.length,
              checkedCount: items.filter(item => item.isChecked).length,
            })),
      }),
    )
  })
  if (solo)
    await page.route('**/api/v1/circles/members', route =>
      route.fulfill(
        json({
          res: [
            {
              userId: 1,
              id: 1,
              isActive: true,
              role: 'admin',
              name: 'Smoke User',
              displayName: 'Smoke User',
            },
          ],
        }),
      ),
    )
}

for (const language of ['en', 'ar-SA']) {
  for (const state of [
    { count: 1 },
    { count: 1, empty: true },
    { count: 3 },
    { count: 3, solo: true },
  ]) {
    test(`fix06: Shopping responsive composition ${language} ${JSON.stringify(state)}`, async ({
      page,
    }, testInfo) => {
      await prepare(page, { language })
      await shoppingState(page, state)
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/shopping', { waitUntil: 'networkidle' })
      const switcher = page.locator('#shopping-list-switcher')
      const detail = page.getByTestId('shopping-list-detail')
      await expect(switcher).toBeVisible()
      await expect(page.getByTestId('shopping-list-cards')).toBeHidden()
      await expect(detail.locator('.shopping-detail-identity')).toBeHidden()
      await expect(switcher).toHaveValue('7')
      await expect(page.getByTestId('shopping-create-list')).toHaveCount(1)
      if (state.empty)
        await expect(page.getByTestId('shopping-zero-items')).toBeVisible()
      else
        await expect(page.getByTestId('shopping-list-item')).toContainText(
          'Milk',
        )
      const controls = detail.locator('.shopping-list-action-controls')
      if (!state.empty) {
        await expect(controls.locator('.btn-ghost')).toBeVisible()
        await expect(
          page.getByTestId('shopping-list-item').locator('.btn-icon'),
        ).toHaveCount(2)
      }
      await controls.locator('.btn-primary').click()
      const modal = page.locator('[data-create-modal="canonical"]')
      await expect(modal).toBeVisible()
      await expect(modal.locator('#shopping-item-name')).toBeVisible()
      await modal.locator('.create-modal-close').click()
      await controls.locator('.btn-secondary').click()
      await expect(page.locator('#shopping-edit-list-name')).toHaveValue(
        'Groceries',
      )
      await detail.locator('button.btn-icon').click()
      if (state.count > 1) {
        await switcher.selectOption(state.solo ? '9' : '8')
        await expect(page.getByTestId('shopping-zero-items')).toBeVisible()
        await expect(switcher).toHaveValue(state.solo ? '9' : '8')
        if (!state.solo)
          await expect(page.locator('.shopping-mobile-summary')).toContainText(
            language === 'en' ? 'Shared' : 'مشتركة',
          )
        await switcher.selectOption('7')
      }
      const hierarchy = await page.evaluate(() => {
        const r = s => document.querySelector(s).getBoundingClientRect()
        const context = r('.shopping-mobile-context')
        const actions = r('.shopping-list-actions')
        const items = r('[data-testid="shopping-list-detail"] .card')
        const tabs = r('[data-testid="shopping-tabs"]')
        const sharing = document.querySelector(
          '[data-testid="shopping-sharing-action"]',
        )
        return {
          tabsGap: context.top - tabs.bottom,
          contextGap: actions.top - context.bottom,
          itemsGap: items.top - actions.bottom,
          sharingGap: sharing
            ? sharing.getBoundingClientRect().top - items.bottom
            : null,
        }
      })
      expect(hierarchy.tabsGap).toBe(20)
      expect(hierarchy.contextGap).toBe(24)
      expect(hierarchy.itemsGap).toBe(24)
      if (state.solo) expect(hierarchy.sharingGap).toBe(24)
      await testInfo.attach('shopping-hierarchy', {
        body: JSON.stringify(hierarchy),
        contentType: 'application/json',
      })
      for (const index of [1, 2]) {
        await page
          .getByTestId('shopping-tabs')
          .getByRole('button')
          .nth(index)
          .click()
        await expect(
          page.getByTestId(
            index === 2
              ? 'shopping-overview-tab'
              : state.empty
                ? 'shopping-zero-all-items'
                : 'shopping-items-tab',
          ),
        ).toBeVisible()
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(390)
      }
    })
  }
}

for (const count of [1, 2, 3, 4]) {
  test(`fix06: shared mobile stats grid ${count} cards; desktop unchanged`, async ({
    page,
  }) => {
    await prepare(page)
    await shoppingState(page, { solo: true })
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto('/', { waitUntil: 'networkidle' })
    const grid = page.getByTestId('home-stats')
    await expect(grid.locator('.entity-card')).toHaveCount(3)
    // Exercise the shared CSS with arbitrary counts without changing app data.
    await grid.evaluate((el, n) => {
      while (el.children.length < n)
        el.append(el.firstElementChild.cloneNode(true))
      while (el.children.length > n) el.lastElementChild.remove()
    }, count)
    const cards = await grid.locator('.entity-card').all()
    const full = (await bounds(grid)).width
    const boxes = await Promise.all(cards.map(bounds))
    expect(boxes.at(-1).width).toBe(count % 2 ? full : boxes[0].width)
    if (count >= 2) expect(boxes[0].width).toBeLessThan(full)
    if (count >= 3) expect(boxes[2].y).toBeGreaterThan(boxes[0].y)
    if (count === 3)
      await page.screenshot({
        path: '/tmp/opencode/fix06-home-solo-390x900.png',
      })
    await page.setViewportSize({ width: 1440, height: 900 })
    const desktop = await Promise.all(cards.map(bounds))
    expect(new Set(desktop.map(b => b.y)).size).toBe(1)
    expect(
      Math.max(...desktop.map(b => b.width)) -
        Math.min(...desktop.map(b => b.width)),
    ).toBeLessThanOrEqual(1)
  })
}

test('fix06: desktop primary routes preserve trailing actions, master/detail and title anchors', async ({
  page,
}, testInfo) => {
  await prepare(page)
  await shoppingState(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  const titles = []
  for (const path of englishRoutes) {
    await page.goto(path, { waitUntil: 'networkidle' })
    titles.push((await bounds(page.getByTestId('page-title'))).y)
    await expect(page.locator('.mobile-nav')).toBeHidden()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(1440)
    if (primaryRoutes.includes(path)) {
      const button = await bounds(
        page.locator('.page-header__primary-action button'),
      )
      expect(button.width).toBeLessThan(250)
      expect(button.y).toBeLessThan(
        (await bounds(page.locator('.page-header__main'))).bottom,
      )
    }
    if (path === '/shopping') {
      await expect(page.getByTestId('shopping-list-cards')).toBeVisible()
      await expect(page.getByTestId('shopping-mobile-context')).toBeHidden()
      await expect(page.locator('.shopping-detail-identity')).toBeVisible()
    }
  }
  expect(Math.max(...titles) - Math.min(...titles)).toBeLessThanOrEqual(1)
  await testInfo.attach('desktop-title-anchors', {
    body: JSON.stringify(titles),
    contentType: 'application/json',
  })
})

test('fix06: actual browser review artifacts at required EN/AR viewports', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000)
  await prepare(page)
  await shoppingState(page)
  const guard = attachRuntimeErrorGuard(page)
  for (const language of ['en', 'ar-SA']) {
    await overrideUserPreferences(page, smokePreferences({ language }))
    for (const viewport of [...viewports, { width: 1440, height: 900 }]) {
      if (language !== 'en' && viewport.width === 1440) continue
      await page.setViewportSize(viewport)
      for (const path of language === 'en' ? englishRoutes : arabicRoutes) {
        await page.goto(path, { waitUntil: 'networkidle' })
        await expect(page.getByTestId('page-title')).toBeVisible()
        const name = `fix06-${language}-${viewport.width}x${viewport.height}-${path === '/' ? 'home' : path.slice(1)}`
        await page.screenshot({ path: `/tmp/opencode/${name}.png` })
        await testInfo.attach(name, {
          path: `/tmp/opencode/${name}.png`,
          contentType: 'image/png',
        })
      }
    }
  }
  guard.assertClean()
})

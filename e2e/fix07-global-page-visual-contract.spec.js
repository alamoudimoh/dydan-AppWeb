import { mkdirSync, writeFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { primaryRoutes } from './helpers/primaryRoutes.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 900 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
]
const actions = [
  '/projects',
  '/routines',
  '/maintenance',
  '/shopping',
  '/goals',
  '/rewards',
]
const tabs = ['/maintenance', '/shopping', '/rewards']
const dir = '/tmp/dydan-fix07'
mkdirSync(dir, { recursive: true })
const prepare = async (page, language = 'en') => {
  await installApiMocks(page)
  await installSmokeSession(page)
  await overrideUserPreferences(page, smokePreferences({ language }))
}
const json = body => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
})
const bounds = locator =>
  locator.evaluate(el => {
    const r = el.getBoundingClientRect()
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      right: r.right,
      bottom: r.bottom,
    }
  })
const equal = (rows, key) => {
  const values = rows.map(row => row[key])
  expect(Math.max(...values) - Math.min(...values), key).toBeLessThanOrEqual(1)
}
const anatomy = (page, selector, prefix) =>
  page.locator(selector).evaluateAll(
    (elements, prefix) =>
      elements.map(el => {
        const rect = node => {
          const r = node.getBoundingClientRect()
          return { x: r.x, y: r.y, width: r.width, height: r.height }
        }
        const style = getComputedStyle(el)
        const roles =
          prefix === 'summary-card'
            ? ['icon', 'label', 'value', 'meta']
            : ['icon', 'title', 'description']
        const parts = Object.fromEntries(
          roles.map(role => {
            const node = el.querySelector(`.${prefix}__${role}`)
            const css = getComputedStyle(node)
            return [
              role,
              {
                ...rect(node),
                font: css.font,
                fontSize: css.fontSize,
                lineHeight: css.lineHeight,
                align: css.textAlign,
                svg: role === 'icon' ? rect(node.querySelector('svg')) : null,
              },
            ]
          }),
        )
        const body = el.querySelector('.empty-state__body')
        return {
          ...rect(el),
          padding: style.padding,
          radius: style.borderRadius,
          border: style.borderWidth,
          parts,
          gap: body ? getComputedStyle(body).gap : style.gap,
          maxWidth: body ? getComputedStyle(body).maxWidth : null,
        }
      }),
    prefix,
  )
const scrollBottom = async page =>
  page.locator('.main-scroll').evaluate(async el => {
    el.scrollTop = el.scrollHeight
    await new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
  })
const clearance = page =>
  page.evaluate(() => {
    const scroll = document.querySelector('.main-scroll')
    const end = document
      .querySelector('[data-testid="page-end"]')
      .getBoundingClientRect()
    const dock = document.querySelector('.mobile-nav').getBoundingClientRect()
    const leaves = [
      ...document.querySelectorAll(
        '.page button, .page input, .page select, .page .card, .page .page-empty-state, .page .inline-empty-state',
      ),
    ].filter(el => el.getClientRects().length)
    const finalBottom = Math.max(
      ...leaves.map(el => el.getBoundingClientRect().bottom),
    )
    return {
      end: end.bottom,
      dockTop: dock.top,
      dockHeight: dock.height,
      gap: dock.top - end.bottom,
      leafGap: dock.top - finalBottom,
      padding: getComputedStyle(scroll).paddingBottom,
      atBottom:
        Math.abs(
          scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop,
        ) <= 1,
    }
  })

for (const language of ['en', 'ar-SA'])
  for (const viewport of viewports) {
    test(`fix07: route geometry ${language} ${viewport.width}x${viewport.height}`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(150_000)
      await prepare(page, language)
      await page.setViewportSize(viewport)
      await page.route('**/api/v1/projects', route =>
        route.fulfill(
          json({
            res: [
              {
                id: 201,
                name: 'Visual contract project',
                description: 'Related tasks',
                status: 'active',
                createdBy: 1,
              },
              {
                id: 202,
                name: 'Second project',
                description: 'Shared geometry',
                status: 'active',
                createdBy: 1,
              },
            ],
          }),
        ),
      )
      await page.route('**/api/v1/progress/goals', route =>
        route.fulfill(
          json({
            canManage: true,
            goals: [
              {
                id: 301,
                name: 'Complete tasks',
                metricType: 'TASK_COMPLETIONS',
                progress: 3,
                target: 10,
                status: 'active',
                startDate: '2026-10-01',
                endDate: '2026-10-31',
              },
              {
                id: 302,
                name: 'Second goal',
                metricType: 'TASK_COMPLETIONS',
                progress: 2,
                target: 10,
                status: 'active',
                startDate: '2026-10-01',
                endDate: '2026-10-31',
              },
            ],
          }),
        ),
      )
      const guard = attachRuntimeErrorGuard(page)
      const matrix = []
      const summary = []
      const tabMatrix = []
      const emptyMatrix = []
      for (const { path } of primaryRoutes()) {
        await page.goto(path, { waitUntil: 'networkidle' })
        await expect(page.getByTestId('page-title')).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute(
          'dir',
          language === 'en' ? 'ltr' : 'rtl',
        )
        const header = await bounds(page.locator('.page-header'))
        const title = await bounds(page.getByTestId('page-title'))
        const slot = await bounds(
          page.locator('.page-flow > [data-page-slot]').first(),
        )
        const body = await bounds(page.locator('.page-body'))
        const row = {
          path,
          titleTop: title.y,
          titleStart: language === 'en' ? title.x : title.right,
          slotTop: slot.y,
          contentWidth: slot.width,
          headerWidth: header.width,
          body,
        }
        expect(title.y).toBeCloseTo(viewport.width > 768 ? 107 : 103.5, 0)
        expect(slot.y).toBeCloseTo(header.bottom, 0)
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(viewport.width)
        if (actions.includes(path)) {
          const button = await bounds(page.locator('.page-primary-action'))
          const available = await bounds(page.locator('.page-header__main'))
          expect(button.width).toBe(
            viewport.width > 768 ? 190 : available.width,
          )
          expect(button.height).toBe(40)
          row.action = button
          row.actionTrailing = language === 'en' ? button.right : button.x
          if (path === '/maintenance') {
            const controls = await page.locator('.page-tab').all()
            for (const control of controls) {
              await control.click()
              const switched = await bounds(
                page.locator('.page-primary-action'),
              )
              for (const key of ['x', 'y', 'width', 'height'])
                expect(switched[key]).toBe(button[key])
            }
            await controls[0].click()
          }
        }
        if (tabs.includes(path)) {
          const track = page.locator('.page-tabs')
          const trackBox = await bounds(track)
          const segments = await Promise.all(
            (await track.locator('button').all()).map(bounds),
          )
          expect(trackBox.height).toBe(46)
          for (const segment of segments) expect(segment.height).toBe(36)
          expect(
            await track
              .locator('button')
              .evaluateAll(nodes =>
                nodes.every(node => node.scrollWidth <= node.clientWidth),
              ),
          ).toBe(true)
          tabMatrix.push({ path, ...trackBox, segments })
          if (path === '/rewards')
            expect((await bounds(page.getByTestId('rewards-hero'))).y).toBe(
              trackBox.bottom + 20,
            )
        }
        if (path === '/projects' || path === '/goals') {
          await expect(page.locator('.entity-card--standard')).toHaveCount(2)
          const entityGeometry = await page
            .locator('.entity-card--standard')
            .evaluateAll(cards =>
              cards.map(card => {
                const css = getComputedStyle(card)
                const r = card.getBoundingClientRect()
                return {
                  padding: css.padding,
                  radius: css.borderRadius,
                  border: css.borderWidth,
                  minHeight: css.minHeight,
                  width: r.width,
                  x: r.x,
                }
              }),
            )
          for (const card of entityGeometry) {
            expect(card.padding).toBe('20px')
            expect(card.minHeight).toBe('160px')
          }
          equal(entityGeometry, 'width')
          if (viewport.width <= 768) equal(entityGeometry, 'x')
          row.entityGeometry = entityGeometry
          if (path === '/goals')
            expect(
              await page
                .locator('.entity-card__actions')
                .first()
                .evaluate(el => getComputedStyle(el).gap),
            ).toBe('8px')
        }
        if (path === '/' || path === '/rewards')
          summary.push(
            ...(await anatomy(page, '.summary-card', 'summary-card')),
          )
        emptyMatrix.push(
          ...(await anatomy(page, '.page-empty-state', 'empty-state')),
        )
        const name = `${language}-${viewport.width}x${viewport.height}-${path === '/' ? 'home' : path.slice(1)}`
        await page.screenshot({ path: `${dir}/${name}.png` })
        if (viewport.width <= 768)
          for (const safe of [0, 24]) {
            await page.evaluate(
              inset =>
                document.documentElement.style.setProperty(
                  '--safe-area-inset-bottom',
                  `${inset}px`,
                ),
              safe,
            )
            await scrollBottom(page)
            const c = await clearance(page)
            expect(c.atBottom).toBe(true)
            expect(c.dockHeight).toBe(60 + safe)
            expect(c.padding).toBe(`${108 + safe}px`)
            expect(c.gap).toBeGreaterThanOrEqual(47)
            expect(c.leafGap).toBeGreaterThanOrEqual(47)
            row[`clearance${safe}`] = c
          }
        matrix.push(row)
      }
      for (const key of ['titleTop', 'titleStart', 'slotTop', 'contentWidth'])
        equal(matrix, key)
      for (const key of ['x', 'y', 'width', 'height']) equal(tabMatrix, key)
      const buttons = matrix.filter(row => row.action).map(row => row.action)
      for (const key of ['width', 'height', 'y']) equal(buttons, key)
      equal(
        matrix.filter(row => row.action),
        'actionTrailing',
      )
      for (const card of summary) {
        expect(card.height).toBe(140)
        expect(card.padding).toBe('20px')
        expect(card.parts.icon.width).toBe(32)
        expect(card.parts.icon.height).toBe(32)
        const iconInset =
          language === 'en'
            ? card.x + card.width - card.parts.icon.x - 32
            : card.parts.icon.x - card.x
        expect(Math.abs(iconInset - 21)).toBeLessThanOrEqual(1)
        for (const role of ['label', 'value', 'meta'])
          expect(card.parts[role].y).toBeGreaterThanOrEqual(card.y + 20)
      }
      for (const role of ['icon', 'label', 'value', 'meta'])
        equal(
          summary.map(card => ({ offset: card.parts[role].y - card.y })),
          'offset',
        )
      for (const key of ['padding', 'radius', 'border', 'gap'])
        expect(new Set(summary.map(card => card[key])).size).toBe(1)
      for (const role of ['label', 'value', 'meta'])
        expect(new Set(summary.map(card => card.parts[role].font)).size).toBe(1)
      for (const state of emptyMatrix) {
        expect(state.parts.icon.width).toBe(48)
        expect(state.parts.icon.height).toBe(48)
        expect(state.parts.icon.svg.width).toBe(26)
        expect(state.gap).toBe('12px')
        expect(state.maxWidth).toBe('440px')
      }
      const report = {
        language,
        viewport,
        matrix,
        tabMatrix,
        summary,
        emptyMatrix,
      }
      writeFileSync(
        `${dir}/${language}-${viewport.width}x${viewport.height}.json`,
        JSON.stringify(report, null, 2),
      )
      await testInfo.attach('geometry-matrix', {
        body: JSON.stringify(report),
        contentType: 'application/json',
      })
      guard.assertClean()
    })
  }

for (const language of ['en', 'ar-SA'])
  for (const width of [1440, 390])
    test(`fix07: controlled page zeros ${language} ${width}`, async ({
      page,
    }, testInfo) => {
      await prepare(page, language)
      await page.setViewportSize({ width, height: 900 })
      // URL predicates keep legitimate-zero mocks explicit.
      await page.route(
        url =>
          [
            '/api/v1/chores',
            '/api/v1/projects',
            '/api/v1/routines',
            '/api/v1/maintenance/assets',
            '/api/v1/rewards',
          ].includes(url.pathname),
        route => route.fulfill(json({ res: [] })),
      )
      const rows = []
      for (const path of [
        '/today',
        '/all-tasks',
        '/projects',
        '/routines',
        '/maintenance',
        '/rewards',
      ]) {
        await page.goto(path, { waitUntil: 'networkidle' })
        const empty = page.locator('.page-empty-state').first()
        await expect(empty).toBeVisible()
        expect(
          await empty.evaluate(el => Boolean(el.closest('.entity-grid'))),
        ).toBe(false)
        const state = (
          await anatomy(page, '.page-empty-state', 'empty-state')
        )[0]
        const content = await bounds(page.locator('[data-page-slot="content"]'))
        expect(state.width).toBe(content.width)
        expect(state.parts.icon.x + 24).toBeCloseTo(
          state.x + state.width / 2,
          0,
        )
        rows.push({ path, ...state })
      }
      for (const role of ['icon', 'title', 'description'])
        equal(
          rows.map(state => ({ offset: state.parts[role].y - state.y })),
          'offset',
        )
      for (const key of ['padding', 'gap', 'maxWidth'])
        expect(new Set(rows.map(row => row[key])).size).toBe(1)
      for (const role of ['icon', 'title', 'description'])
        for (const key of ['font', 'fontSize', 'lineHeight'])
          expect(new Set(rows.map(row => row.parts[role][key])).size).toBe(1)
      equal(
        rows.map(row => ({
          iconGap: row.parts.title.y - row.parts.icon.y - row.parts.icon.height,
          copyGap:
            row.parts.description.y -
            row.parts.title.y -
            row.parts.title.height,
        })),
        'iconGap',
      )
      equal(
        rows.map(row => ({
          copyGap:
            row.parts.description.y -
            row.parts.title.y -
            row.parts.title.height,
        })),
        'copyGap',
      )
      writeFileSync(
        `${dir}/zeros-${language}-${width}.json`,
        JSON.stringify(rows, null, 2),
      )
      await testInfo.attach('empty-state-matrix', {
        body: JSON.stringify(rows),
        contentType: 'application/json',
      })
    })

test('fix07: browser and native safe areas describe one physical inset', async ({
  page,
}) => {
  await prepare(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/calendar', { waitUntil: 'networkidle' })
  expect((await clearance(page)).dockHeight).toBe(60)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setSafeAreaInsetsOverride', {
    insets: { bottom: 24 },
  })
  expect(
    await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.style.cssText =
        'position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px)'
      document.body.appendChild(probe)
      const inset = getComputedStyle(probe).paddingBottom
      probe.remove()
      return inset
    }),
  ).toBe('24px')
  const measurements = []
  for (const native of [0, 24, 34]) {
    await page.evaluate(
      value =>
        document.documentElement.style.setProperty(
          '--safe-area-inset-bottom',
          `${value}px`,
        ),
      native,
    )
    await scrollBottom(page)
    const c = await clearance(page)
    expect(c.dockHeight).toBe(60 + Math.max(24, native))
    expect(c.padding).toBe(`${108 + Math.max(24, native)}px`)
    expect(c.gap).toBeGreaterThanOrEqual(47)
    expect(Math.abs(c.gap - 48)).toBeLessThanOrEqual(1)
    expect(c.leafGap).toBeGreaterThanOrEqual(47)
    expect(c.atBottom).toBe(true)
    measurements.push({ browserInset: 24, nativeInset: native, ...c })
  }
  writeFileSync(`${dir}/safe-area.json`, JSON.stringify(measurements, null, 2))
})

test('fix07: interactions preserve the contract and long content clears the dock', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await prepare(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/api/v1/projects', route =>
    route.fulfill(
      json({
        res: Array.from({ length: 14 }, (_, i) => ({
          id: 100 + i,
          name: `Project ${i + 1}`,
          description: 'Long page clearance fixture',
          createdBy: 1,
        })),
      }),
    ),
  )
  await page.goto('/projects', { waitUntil: 'networkidle' })
  expect(await page.locator('.entity-card').count()).toBe(14)
  const cards = await Promise.all(
    (await page.locator('.entity-card').all()).map(bounds),
  )
  equal(cards, 'width')
  equal(cards, 'x')
  for (const safe of [0, 24]) {
    await page.evaluate(
      value =>
        document.documentElement.style.setProperty(
          '--safe-area-inset-bottom',
          `${value}px`,
        ),
      safe,
    )
    await scrollBottom(page)
    const c = await clearance(page)
    expect(Math.abs(c.gap - 48)).toBeLessThanOrEqual(1)
    expect(Math.abs(c.leafGap - 48)).toBeLessThanOrEqual(1)
    await page.screenshot({ path: `${dir}/long-page-end-safe-${safe}.png` })
  }
  for (const path of actions) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const first = await bounds(page.locator('.page-flow'))
    await page.locator('.page-primary-action').click()
    await expect(page.locator('[data-create-modal="canonical"]')).toBeVisible()
    await page.locator('.create-modal-close').click()
    expect((await bounds(page.locator('.page-flow'))).y).toBe(first.y)
    if (tabs.includes(path))
      for (const button of await page.locator('.page-tab').all()) {
        await button.click()
        expect((await bounds(page.locator('.page-tabs'))).y).toBe(first.y)
        if (path === '/maintenance')
          expect(
            (await bounds(page.locator('.page-primary-action'))).height,
          ).toBe(40)
      }
  }
  for (const path of [
    '/today',
    '/all-tasks',
    '/routines',
    '/activity',
    '/calendar',
  ]) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const first = await bounds(page.locator('.page-flow'))
    for (const button of await page.locator('.filter-segment-btn').all()) {
      await button.click()
      expect((await bounds(page.locator('.page-flow'))).y).toBe(first.y)
    }
  }
})

test('fix07: the three Home summaries share geometry and the odd mobile card spans the grid', async ({
  page,
}, testInfo) => {
  await prepare(page)
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
  const report = []
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(
      page.getByTestId('home-stats').locator('.summary-card'),
    ).toHaveCount(3)
    const cards = await anatomy(page, '#root .summary-card', 'summary-card')
    const grid = await bounds(page.getByTestId('home-stats'))
    for (const card of cards) {
      expect(card.height).toBe(140)
      expect(card.padding).toBe('20px')
      expect(card.parts.icon.width).toBe(32)
    }
    if (viewport.width > 768) {
      equal(cards, 'width')
      equal(cards, 'y')
    } else {
      expect(cards[0].width).toBe(cards[1].width)
      expect(cards[2].width).toBe(grid.width)
      expect(cards[2].y).toBe(cards[0].y + 152)
    }
    report.push({ viewport, grid, cards })
  }
  writeFileSync(`${dir}/home-three.json`, JSON.stringify(report, null, 2))
  await testInfo.attach('home-three-measurements', {
    body: JSON.stringify(report),
    contentType: 'application/json',
  })
})

test('fix07: compact row actions stay inside card padding in EN and AR', async ({
  page,
}, testInfo) => {
  const report = []
  for (const language of ['en', 'ar-SA']) {
    await prepare(page, language)
    await page.route(
      url => url.pathname === '/api/v1/rewards',
      route =>
        route.fulfill(
          json({
            res: [
              {
                id: 91,
                name: 'Family movie night',
                description: 'Choose a movie together',
                costPoints: 50,
                isActive: true,
              },
            ],
          }),
        ),
    )
    await page.route(
      url => url.pathname === '/api/v1/rewards/requests',
      route =>
        route.fulfill(
          json({
            res: [
              {
                id: 92,
                rewardId: 91,
                userId: 1,
                status: 'pending',
                requestedAt: '2026-10-11T10:00:00Z',
              },
            ],
          }),
        ),
    )
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/rewards', { waitUntil: 'networkidle' })
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        language === 'en' ? 'ltr' : 'rtl',
      )
      await page.locator('.page-tab').nth(1).click()
      const card = page.locator('.entity-card--compact')
      await expect(card).toHaveCount(1)
      const geometry = await card.evaluate(el => {
        const r = el.getBoundingClientRect()
        const style = getComputedStyle(el)
        const padding =
          parseFloat(style.paddingInlineStart) +
          parseFloat(style.borderInlineStartWidth)
        return {
          left: r.left,
          right: r.right,
          padding,
          buttons: [...el.querySelectorAll('button')].map(button => {
            const b = button.getBoundingClientRect()
            return { left: b.left, right: b.right }
          }),
        }
      })
      expect(geometry.padding).toBe(17)
      expect(geometry.buttons).toHaveLength(2)
      for (const button of geometry.buttons) {
        expect(button.left).toBeGreaterThanOrEqual(
          geometry.left + geometry.padding - 1,
        )
        expect(button.right).toBeLessThanOrEqual(
          geometry.right - geometry.padding + 1,
        )
      }
      if (viewport.width <= 768) {
        await scrollBottom(page)
        expect((await clearance(page)).leafGap).toBeGreaterThanOrEqual(47)
      }
      await page.screenshot({
        path: `${dir}/compact-row-${language}-${viewport.width}x${viewport.height}.png`,
      })
      report.push({ language, viewport, geometry })
    }
  }
  await testInfo.attach('compact-row-measurements', {
    body: JSON.stringify(report),
    contentType: 'application/json',
  })
})

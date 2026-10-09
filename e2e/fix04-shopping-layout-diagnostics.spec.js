import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const json = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

const sampleLists = () => [
  {
    id: 7,
    name: 'Groceries',
    circleId: null,
    createdBy: 1,
    items: [
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
  {
    id: 8,
    name: 'Pharmacy',
    circleId: 3,
    createdBy: 1,
    items: [],
  },
]

const prepare = async (page, preferences = {}) => {
  await installApiMocks(page)
  await installSmokeSession(page)
  await overrideUserPreferences(page, smokePreferences(preferences))
}

const installShoppingState = async (page, initialLists = sampleLists()) => {
  const lists = structuredClone(initialLists)
  const requests = []
  let nextListId = 90
  let nextItemId = 900

  await page.route('**/api/v1/shopping-lists**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const root = url.pathname === '/api/v1/shopping-lists'
    const detailMatch = url.pathname.match(/^\/api\/v1\/shopping-lists\/(\d+)$/)
    const itemMatch = url.pathname.match(
      /^\/api\/v1\/shopping-lists\/(\d+)\/items$/,
    )

    if (method === 'GET' && root) {
      const summaries = lists.map(({ items, ...list }) => ({
        ...list,
        checkedCount: items.filter(item => item.isChecked).length,
        itemCount: items.length,
      }))
      requests.push({
        method,
        path: url.pathname,
        response: structuredClone(summaries),
      })
      await route.fulfill(json({ res: summaries }))
      return
    }

    if (method === 'GET' && detailMatch) {
      const list = lists.find(
        candidate => candidate.id === Number(detailMatch[1]),
      )
      requests.push({
        method,
        path: url.pathname,
        response: structuredClone(list),
      })
      await route.fulfill(json({ res: list }))
      return
    }

    if (method === 'POST' && root) {
      const payload = request.postDataJSON()
      const created = {
        id: nextListId++,
        name: payload.name,
        circleId: payload.scope === 'circle' ? 3 : null,
        createdBy: 1,
        items: [],
      }
      lists.push(created)
      requests.push({ method, path: url.pathname, payload, response: created })
      await route.fulfill(json({ res: created }, 201))
      return
    }

    if (method === 'POST' && itemMatch) {
      const payload = request.postDataJSON()
      const listId = Number(itemMatch[1])
      const list = lists.find(candidate => candidate.id === listId)
      const created = {
        id: nextItemId++,
        listId,
        name: payload.name,
        quantity: payload.quantity,
        isChecked: false,
        createdBy: 1,
      }
      list?.items.push(created)
      requests.push({ method, path: url.pathname, payload, response: created })
      await route.fulfill(json({ res: created }, 201))
      return
    }

    await route.fallback()
  })

  return { lists, requests }
}

test('fix04: Shopping header, tabs, default list view, and canonical create paths', async ({
  page,
}, testInfo) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await prepare(page)
  await installShoppingState(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/shopping', { waitUntil: 'networkidle' })

  await expect(page.getByTestId('page-title')).toHaveText('Shopping')
  await expect(page.getByText('Personal and shared space lists')).toBeVisible()
  await expect(page.getByTestId('shopping-create-list')).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'New shopping list', exact: true }),
  ).toHaveCount(1)

  const tabs = page.getByTestId('shopping-tabs')
  await expect(
    tabs.getByRole('button', { name: 'Shopping Lists', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    tabs.getByRole('button', { name: 'Items', exact: true }),
  ).toBeVisible()
  await expect(
    tabs.getByRole('button', { name: 'Overview', exact: true }),
  ).toBeVisible()
  await expect(page.getByTestId('shopping-list-cards')).toContainText(
    'Groceries',
  )
  await expect(page.getByTestId('shopping-list-cards')).toContainText(
    'Pharmacy',
  )

  await page.getByTestId('shopping-create-list').click()
  const headerModal = page.locator('[data-create-modal="canonical"]')
  await expect(headerModal).toBeVisible()
  await expect(
    headerModal.locator('[data-entity-icon="shopping"]'),
  ).toBeVisible()
  await testInfo.attach('shopping-create-list-modal-1440', {
    body: await page.screenshot(),
    contentType: 'image/png',
  })
  await headerModal.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await page
    .getByRole('menu', { name: 'Create' })
    .getByRole('menuitem', { name: 'Shopping List', exact: true })
    .click()
  const globalModal = page.locator('[data-create-modal="canonical"]')
  await expect(globalModal).toBeVisible()
  await expect(
    globalModal.locator('[data-entity-icon="shopping"]'),
  ).toBeVisible()

  runtimeGuard.assertClean()
})

test('fix04: Items retain parent-list context and Overview groups children', async ({
  page,
}, testInfo) => {
  await prepare(page)
  await installShoppingState(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/shopping', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'Items', exact: true }).click()
  const rows = page.getByTestId('shopping-item-row')
  await expect(rows).toHaveCount(2)
  await expect(rows.filter({ hasText: 'Milk' })).toContainText('Groceries')
  await expect(rows.filter({ hasText: 'Bread' })).toContainText('Groceries')
  await expect(
    page.getByRole('button', { name: 'New item', exact: true }),
  ).toHaveCount(0)
  await testInfo.attach('shopping-items-1440', {
    body: await page.screenshot(),
    contentType: 'image/png',
  })

  await page.getByRole('button', { name: 'Overview', exact: true }).click()
  const groups = page.getByTestId('shopping-overview-group')
  await expect(groups).toHaveCount(2)
  await expect(groups.filter({ hasText: 'Groceries' })).toContainText('Milk')
  await expect(groups.filter({ hasText: 'Groceries' })).toContainText('Bread')
  const pharmacy = groups.filter({ hasText: 'Pharmacy' })
  await expect(pharmacy).toContainText('No items in this shopping list.')
  await expect(
    pharmacy.getByTestId('shopping-overview-zero-items'),
  ).toBeVisible()
  await testInfo.attach('shopping-overview-1440', {
    body: await page.screenshot(),
    contentType: 'image/png',
  })
})

test('fix04: legitimate zero-list state has no duplicate create CTA', async ({
  page,
}, testInfo) => {
  await prepare(page)
  await installShoppingState(page, [])
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/shopping', { waitUntil: 'networkidle' })

  await expect(page.getByTestId('shopping-zero-lists')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'New shopping list', exact: true }),
  ).toHaveCount(1)
  await expect(
    page.getByTestId('shopping-zero-lists').getByRole('button'),
  ).toHaveCount(0)
  await testInfo.attach('shopping-empty-1440', {
    body: await page.screenshot(),
    contentType: 'image/png',
  })
})

test('fix04: API failure is not rendered as legitimate empty Shopping data', async ({
  page,
}) => {
  await prepare(page)
  await page.route('**/api/v1/shopping-lists**', route =>
    route.fulfill(json({ error: 'shopping unavailable' }, 503)),
  )
  await page.goto('/shopping', { waitUntil: 'networkidle' })

  await expect(page.getByTestId('shopping-load-error')).toBeVisible()
  await expect(page.getByTestId('shopping-zero-lists')).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText(
    'Shopping lists could not be loaded',
  )
})

test('fix04: list and context-bound item creation round-trip through the canonical modal', async ({
  page,
}) => {
  await prepare(page)
  const state = await installShoppingState(page, [])
  await page.goto('/shopping', { waitUntil: 'networkidle' })

  await page.getByTestId('shopping-create-list').click()
  let modal = page.locator('[data-create-modal="canonical"]')
  await modal.locator('#shopping-list-name').fill('Hardware')
  await modal.getByRole('button', { name: 'Create list' }).click()
  await expect(page.getByTestId('shopping-list-cards')).toContainText(
    'Hardware',
  )

  const listRequest = state.requests.find(
    request =>
      request.method === 'POST' && request.path === '/api/v1/shopping-lists',
  )
  expect(listRequest?.payload).toEqual({ name: 'Hardware', scope: 'personal' })
  expect(listRequest?.response.id).toBe(90)

  await page.getByRole('button', { name: 'New item', exact: true }).click()
  modal = page.locator('[data-create-modal="canonical"]')
  await expect(
    modal.locator('[data-entity-icon="shopping_item"]'),
  ).toBeVisible()
  await modal.locator('#shopping-item-name').fill('Batteries')
  await modal.locator('#shopping-item-quantity').fill('4')
  await modal.getByRole('button', { name: 'Add item' }).click()
  await expect(page.getByTestId('shopping-list-detail')).toContainText(
    'Batteries',
  )
  const summaryRead = state.requests
    .filter(
      request =>
        request.method === 'GET' &&
        request.path === '/api/v1/shopping-lists' &&
        request.response.some(list => list.name === 'Hardware'),
    )
    .at(-1)
  const hardwareSummary = summaryRead?.response.find(
    list => list.name === 'Hardware',
  )
  expect(hardwareSummary).toMatchObject({ checkedCount: 0, itemCount: 1 })
  expect(hardwareSummary).not.toHaveProperty('items')
  expect(
    state.requests.some(
      request =>
        request.method === 'GET' &&
        request.path === '/api/v1/shopping-lists/90' &&
        request.response.items.some(item => item.name === 'Batteries'),
    ),
  ).toBe(true)

  const itemRequest = state.requests.find(
    request =>
      request.method === 'POST' &&
      request.path === '/api/v1/shopping-lists/90/items',
  )
  expect(itemRequest?.payload).toEqual({ name: 'Batteries', quantity: '4' })
  expect(itemRequest?.response).toMatchObject({ id: 900, listId: 90 })

  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByTestId('shopping-list-cards')).toContainText(
    'Hardware',
  )
  await expect(page.getByTestId('shopping-list-detail')).toContainText(
    'Batteries',
  )
  await page.getByRole('button', { name: 'Items', exact: true }).click()
  await expect(page.getByTestId('shopping-item-row')).toContainText('Hardware')
  await expect(page.getByTestId('shopping-item-row')).toContainText('Batteries')
  await page.getByRole('button', { name: 'Overview', exact: true }).click()
  await expect(
    page.getByTestId('shopping-overview-group').filter({ hasText: 'Hardware' }),
  ).toContainText('Batteries')
})

test('fix04: sharing remains a compact secondary action for solo accounts', async ({
  page,
}) => {
  await prepare(page)
  await installShoppingState(page)
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
  await page.goto('/shopping', { waitUntil: 'networkidle' })

  const sharing = page.getByTestId('shopping-sharing-action')
  await expect(sharing).toBeVisible()
  await expect(sharing).toContainText('Share lists with team')
  await expect(
    sharing.getByRole('button', { name: 'Invite members' }),
  ).toBeVisible()
  await expect(sharing).not.toHaveClass(/empty-state/)
  expect((await sharing.boundingBox()).height).toBeLessThan(100)
})

for (const locale of [
  {
    language: 'en',
    direction: 'ltr',
    labels: ['Shopping Lists', 'Items', 'Overview'],
  },
  {
    language: 'ar-SA',
    direction: 'rtl',
    labels: ['قوائم التسوق', 'العناصر', 'نظرة عامة'],
  },
]) {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 900 },
  ]) {
    test(`fix04: ${locale.direction.toUpperCase()} ${viewport.name} layout has no overflow`, async ({
      page,
    }, testInfo) => {
      await prepare(page, { language: locale.language })
      await installShoppingState(page)
      await page.setViewportSize(viewport)
      await page.goto('/shopping', { waitUntil: 'networkidle' })

      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        locale.direction,
      )
      const tabs = page.getByTestId('shopping-tabs')
      for (const [index, label] of locale.labels.entries()) {
        await expect(
          tabs.getByRole('button', { name: label, exact: true }),
        ).toBeVisible()
        if (index) {
          await tabs.getByRole('button', { name: label, exact: true }).click()
        }
        await expect(page.getByTestId('shopping-create-list')).toBeVisible()
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(viewport.width)
        await testInfo.attach(
          `shopping-${locale.direction}-${viewport.name}-tab-${index + 1}`,
          {
            body: await page.getByTestId('shopping-page').screenshot(),
            contentType: 'image/png',
          },
        )
      }
    })
  }
}

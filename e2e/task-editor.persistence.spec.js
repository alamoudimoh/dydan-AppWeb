import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const openTaskEditor = async page => {
  await page.goto('/all-tasks?create=1', { waitUntil: 'networkidle' })
  await expect(
    page.getByRole('heading', { name: 'new task', exact: true }),
  ).toBeVisible()
}

test('task editor persists the selected server category and points before confirming success', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  let requestBody
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.route(/\/api\/v1\/chores\/?(?:\?.*)?$/, async route => {
    if (route.request().method() !== 'POST') return route.fallback()
    requestBody = route.request().postDataJSON()
    // Deliberately delay the response so the assertion proves the modal does
    // not report success or close before the real persistence request settles.
    await new Promise(resolve => setTimeout(resolve, 100))
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ res: { id: 901 } }),
    })
  })

  await openTaskEditor(page)
  const modal = page.locator('.modal-panel')
  await modal.getByLabel('Title').fill('Persisted category task')
  await modal.getByRole('button', { name: 'household', exact: true }).click()
  await modal.getByLabel('Task points').fill('55')
  await modal.getByRole('button', { name: 'Create task', exact: true }).click()

  await expect(modal).toBeVisible()
  await expect
    .poll(() => requestBody)
    .toMatchObject({
      name: 'Persisted category task',
      categoryId: 101,
      points: 55,
    })
  await expect(modal).toBeHidden()
  await expect(page.getByText('"Persisted category task" added')).toBeVisible()
  runtimeGuard.assertClean()
})

test('task editor retains the draft and reports a server failure instead of a false success', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  runtimeGuard.expectStatusError(500)
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.route(/\/api\/v1\/chores\/?(?:\?.*)?$/, route => {
    if (route.request().method() !== 'POST') return route.fallback()
    return route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'The task server is unavailable' }),
    })
  })

  await openTaskEditor(page)
  const modal = page.locator('.modal-panel')
  await modal.getByLabel('Title').fill('Draft stays here')
  await modal.getByRole('button', { name: 'Create task', exact: true }).click()

  await expect(modal).toBeVisible()
  await expect(modal.getByRole('alert')).toHaveText(
    'The task server is unavailable',
  )
  await expect(modal.getByLabel('Title')).toHaveValue('Draft stays here')
  await expect(page.getByText('"Draft stays here" added')).toBeHidden()
  runtimeGuard.assertClean()
})

test('task editor sends edited points and the real category id in the update payload', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  let updateBody
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.route(/\/api\/v1\/chores\/?(?:\?.*)?$/, route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          res: [
            {
              id: 42,
              name: 'Existing persisted task',
              description: '',
              assignedTo: 1,
              frequencyType: 'once',
              assignStrategy: 'no_assignee',
              isActive: true,
              isPrivate: false,
              priority: 3,
              points: 20,
              categoryId: 101,
              category: { id: 101, name: 'household' },
            },
          ],
        }),
      })
    }
    if (route.request().method() === 'PUT') {
      updateBody = route.request().postDataJSON()
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ res: {} }),
      })
    }
    return route.fallback()
  })

  await page.goto('/all-tasks', { waitUntil: 'networkidle' })
  await page
    .locator('.task-row', { hasText: 'Existing persisted task' })
    .click()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  const modal = page.locator('.modal-panel')
  await expect(
    modal.getByRole('heading', { name: 'modify task', exact: true }),
  ).toBeVisible()
  await modal.getByLabel('Task points').fill('75')
  await modal.getByRole('button', { name: 'work', exact: true }).click()
  await modal.getByRole('button', { name: 'Save changes', exact: true }).click()

  await expect
    .poll(() => updateBody)
    .toMatchObject({
      id: 42,
      points: 75,
      categoryId: 103,
    })
  await expect(modal).toBeHidden()
  runtimeGuard.assertClean()
})

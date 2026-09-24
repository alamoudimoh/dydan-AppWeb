import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const chore = (id, name, nextDueDate, priority = 3) => ({
  id,
  name,
  description: null,
  assignedTo: 1,
  priority,
  nextDueDate,
  lastCompletedDate: null,
  isActive: true,
  isArchived: false,
  frequencyType: 'once',
  category: { id: 1, name: 'Home', color: '#34236d' },
  labels: [],
  projectId: null,
  categoryId: 1,
  points: 10,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

const daysFromNow = days => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

test('Phase 4 Figma Tasks uses live search, filters, and the completion mutation', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  let completed = false
  await installApiMocks(page)
  page.route(/\/api\/v1\/chores\/?(?:\?.*)?$/, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        res: [
          chore(42, 'Overdue kitty task', daysFromNow(-1)),
          chore(43, 'Upcoming plant task', daysFromNow(2)),
        ],
      }),
    }),
  )
  await installSmokeSession(page)
  await page.route('**/api/v1/chores/42/do', route => {
    completed = true
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ res: {} }),
    })
  })

  await page.goto('/all-tasks', { waitUntil: 'networkidle' })
  await expect(
    page.getByRole('heading', { name: 'All Tasks', exact: true }),
  ).toBeVisible()

  const overdueTask = page.locator('.task-row', {
    hasText: 'Overdue kitty task',
  })
  const upcomingTask = page.locator('.task-row', {
    hasText: 'Upcoming plant task',
  })
  await expect(overdueTask).toBeVisible()
  await expect(upcomingTask).toBeVisible()

  // The local search input narrows the list by title.
  await page.getByLabel('Filter all tasks').fill('upcoming')
  await expect(overdueTask).toBeHidden()
  await expect(upcomingTask).toBeVisible()
  await page.getByLabel('Filter all tasks').fill('')

  // Completing a row fires the server completion mutation.
  await overdueTask.locator('.task-check').click()
  await expect.poll(() => completed).toBe(true)
  runtimeGuard.assertClean()
})

test('Phase 4 Figma Calendar previews an event on its due day', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  await installApiMocks(page)
  // A chore due today surfaces both as a calendar event preview on its day
  // cell and as today's task in the selected-day panel.
  page.route(/\/api\/v1\/chores\/?(?:\?.*)?$/, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        res: [chore(42, 'Calendar task', new Date().toISOString())],
      }),
    }),
  )
  await installSmokeSession(page)

  await page.goto('/calendar', { waitUntil: 'networkidle' })
  await expect(
    page.getByRole('heading', { name: 'Calendar', exact: true }),
  ).toBeVisible()
  await expect(
    page.locator('.calendar-event-preview', { hasText: 'Calendar task' }),
  ).toBeVisible()
  await expect(
    page.locator('.card', { hasText: 'Calendar task' }).first(),
  ).toBeVisible()
  runtimeGuard.assertClean()
})

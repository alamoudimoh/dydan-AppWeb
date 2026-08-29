import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

const tasks = [
  {
    id: 42,
    name: 'Overdue task',
    assignedTo: 1,
    category: { id: 1, name: 'Home', color: '#4326EA' },
    frequencyType: 'once',
    isActive: true,
    nextDueDate: '2026-01-14T09:00:00Z',
    priority: 1,
    projectId: 7,
    status: 0,
  },
  {
    id: 43,
    name: 'Upcoming recurring task',
    assignedTo: 2,
    frequencyType: 'daily',
    isActive: true,
    nextDueDate: '2026-01-16T09:00:00Z',
    priority: 2,
    status: 0,
  },
]

const calendarResponse = {
  res: {
    occurrences: [
      {
        actionable: true,
        category: { id: 1, name: 'Home', color: '#4326EA' },
        choreId: 42,
        dueAt: '2026-01-15T09:00:00Z',
        name: 'Calendar task',
        occurrenceId: '42-2026-01-15',
        points: 10,
      },
    ],
    overdue: [],
  },
}

const installPhaseFourData = async page => {
  await installApiMocks(page)
  await installSmokeSession(page)
  await page.route(/\/api\/v1\/chores\/?(?:\?.*)?$/, route =>
    route.fulfill({
      body: JSON.stringify({ res: tasks }),
      contentType: 'application/json',
      status: 200,
    }),
  )
  await page.route('**/api/v1/chores/calendar?**', route =>
    route.fulfill({
      body: JSON.stringify(calendarResponse),
      contentType: 'application/json',
      status: 200,
    }),
  )
}

test('Phase 4 Figma Tasks uses live projects, filtering, and completion mutation', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  let completed = false
  await installPhaseFourData(page)
  await page.route('**/api/v1/chores/42/do', route => {
    completed = true
    return route.fulfill({
      body: JSON.stringify({ res: tasks[0] }),
      contentType: 'application/json',
      status: 200,
    })
  })

  await page.goto('/chores', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: 'All Tasks' })).toBeVisible()
  const overdueTask = page.locator('.task-row', { hasText: 'Overdue task' })
  const upcomingTask = page.locator('.task-row', {
    hasText: 'Upcoming recurring task',
  })
  await expect(overdueTask).toBeVisible()
  await expect(upcomingTask).toBeVisible()
  await page.getByPlaceholder('Search tasks...').fill('Upcoming')
  await expect(overdueTask).not.toBeVisible()
  await expect(upcomingTask).toBeVisible()
  await page.getByPlaceholder('Search tasks...').fill('')
  await overdueTask.getByRole('button', { name: 'Complete' }).click()
  await expect.poll(() => completed).toBe(true)
  runtimeGuard.assertClean()
})

test('Phase 4 Figma Calendar selects and completes a scheduled task', async ({
  page,
}) => {
  const runtimeGuard = attachRuntimeErrorGuard(page)
  let completed = false
  await installPhaseFourData(page)
  await page.route('**/api/v1/chores/42/do', route => {
    completed = true
    return route.fulfill({
      body: JSON.stringify({ res: tasks[0] }),
      contentType: 'application/json',
      status: 200,
    })
  })

  await page.goto('/calendar?view=month&date=2026-01-15', {
    waitUntil: 'networkidle',
  })
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
  await expect(
    page.locator('.figma-calendar-event', { hasText: 'Calendar task' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Complete Calendar task' }).click()
  await expect.poll(() => completed).toBe(true)
  runtimeGuard.assertClean()
})

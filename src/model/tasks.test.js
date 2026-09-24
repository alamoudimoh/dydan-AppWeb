import assert from 'node:assert/strict'
import test from 'node:test'

import { toTasks } from './tasks.ts'

// --- fixtures ----------------------------------------------------------------

const today = '2026-09-23'

const activeChore = (over = {}) => ({
  id: 1,
  name: 'Walk the dog',
  isActive: true,
  priority: 3,
  points: 20,
  assignedTo: 2,
  ...over,
})

const historyDone = (choreId, day) => ({
  choreId,
  completedBy: 2,
  assignedTo: 2,
  status: 1,
  performedAt: `${day}T08:00:00.000Z`,
  createdAt: `${day}T08:00:00.000Z`,
})

// --- tests -------------------------------------------------------------------

test('active chore without completion maps to a todo task', () => {
  const tasks = toTasks([activeChore()], [], [], today)
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].title, 'Walk the dog')
  assert.equal(tasks[0].status, 'todo')
  assert.equal(tasks[0].priority, 'medium')
  assert.equal(tasks[0].points, 20)
  assert.equal(tasks[0].assigneeId, '2')
})

test('completion today marks an active chore as done', () => {
  const tasks = toTasks(
    [activeChore()],
    [],
    [historyDone(1, '2026-09-23')],
    today,
  )
  assert.equal(tasks[0].status, 'done')
  assert.ok(tasks[0].completedAt)
})

test('archived chore with a completion surfaces as a done task', () => {
  const archived = activeChore({
    id: 7,
    name: 'UI roundtrip task',
    isActive: false,
  })
  const tasks = toTasks([], [archived], [historyDone(7, '2026-09-23')], today)
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].id, '7')
  assert.equal(tasks[0].status, 'done')
  assert.ok(tasks[0].completedAt)
})

test('archived chore without a completion stays hidden', () => {
  const archived = activeChore({
    id: 8,
    name: 'Trigger chore',
    isActive: false,
  })
  const tasks = toTasks([], [archived], [], today)
  assert.equal(tasks.length, 0)
})

test('archived chore already present in the active list is not duplicated', () => {
  const chore = activeChore({ id: 1, isActive: false })
  const tasks = toTasks([chore], [chore], [historyDone(1, '2026-09-23')], today)
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].status, 'done')
})

test('due dates derive overdue/upcoming/todo status', () => {
  const overdue = toTasks(
    [activeChore({ id: 11, nextDueDate: '2026-09-20' })],
    [],
    [],
    today,
  )
  assert.equal(overdue[0].status, 'overdue')
  assert.equal(overdue[0].dueDate, '2026-09-20')

  const dueToday = toTasks(
    [activeChore({ id: 12, nextDueDate: '2026-09-23' })],
    [],
    [],
    today,
  )
  assert.equal(dueToday[0].status, 'todo')

  const upcoming = toTasks(
    [activeChore({ id: 13, nextDueDate: '2026-09-30' })],
    [],
    [],
    today,
  )
  assert.equal(upcoming[0].status, 'upcoming')
})

test('priority scale maps to low/medium/high', () => {
  const [low, med, hi, none] = toTasks(
    [
      activeChore({ id: 21, priority: 1 }),
      activeChore({ id: 22, priority: 3 }),
      activeChore({ id: 23, priority: 5 }),
      activeChore({ id: 24, priority: null }),
    ],
    [],
    [],
    today,
  )
  assert.equal(low.priority, 'low')
  assert.equal(med.priority, 'medium')
  assert.equal(hi.priority, 'high')
  assert.equal(none.priority, 'medium')
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { taskGroups, taskStatus, taskStatusCounts } from './taskViewModel.js'

const now = new Date('2026-08-15T12:00:00Z')

test('maps live chore lifecycle and due dates to Figma task statuses', () => {
  assert.equal(
    taskStatus({ nextDueDate: '2026-08-14T00:00:00Z' }, now),
    'overdue',
  )
  assert.equal(taskStatus({ nextDueDate: '2026-08-15T00:00:00Z' }, now), 'todo')
  assert.equal(
    taskStatus({ nextDueDate: '2026-08-16T00:00:00Z' }, now),
    'upcoming',
  )
  assert.equal(taskStatus({ status: 4 }, now), 'done')
})

test('groups complete live chores without dropping assigned or uncategorized tasks', () => {
  const chores = [
    { id: 1, assignedTo: 1, nextDueDate: '2026-08-14T00:00:00Z' },
    { id: 2, assignedTo: null, nextDueDate: '2026-08-16T00:00:00Z' },
  ]
  const members = [{ userId: 1, displayName: 'Ari' }]

  assert.deepEqual(taskStatusCounts(chores, now), {
    overdue: 1,
    todo: 0,
    upcoming: 1,
    done: 0,
  })
  assert.deepEqual(
    taskGroups(chores, 'assignee', members, now).map(group => group.label),
    ['Ari', 'unassigned'],
  )
})

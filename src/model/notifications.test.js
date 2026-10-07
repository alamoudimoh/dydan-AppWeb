import assert from 'node:assert/strict'
import test from 'node:test'

import { mapNotificationType, toNotifications } from './notifications.ts'

const notification = (over = {}) => ({
  id: 1,
  createdAt: '2026-09-24T10:00:00Z',
  ...over,
})

test('readAt, isRead, and read all mark a notification read', () => {
  const mapped = toNotifications([
    notification({ id: 1, readAt: '2026-09-24T11:00:00Z', isRead: false }),
    notification({ id: 2, isRead: true }),
    notification({ id: 3, read: true }),
    notification({ id: 4, readAt: null, isRead: false, read: false }),
    notification({ id: 5 }),
  ])
  assert.deepEqual(
    mapped.map(n => n.isRead),
    [true, true, true, false, false],
  )
  assert.equal(mapped.filter(n => !n.isRead).length, 2)
})

test('preserves notification targets and field fallbacks', () => {
  const [n] = toNotifications([
    notification({
      type: 'chore',
      message: 'Hello',
      entityType: 'chore',
      entityId: 9,
    }),
  ])
  assert.equal(mapNotificationType('chore'), 'task_assigned')
  assert.equal(n.title, 'chore')
  assert.equal(n.body, 'Hello')
  assert.equal(n.entityType, 'chore')
  assert.equal(n.entityId, 9)
})

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatNotificationTime,
  notificationColor,
  notificationDestination,
} from './notificationModel.js'

test('builds only safe internal notification destinations', () => {
  assert.equal(
    notificationDestination({ entityType: 'chore', entityId: 17 }),
    '/chores/17',
  )
  assert.equal(
    notificationDestination({ entityType: 'meter', entityId: 2 }),
    '/meters',
  )
  assert.equal(
    notificationDestination({ entityType: 'reward_request', entityId: 9 }),
    '/rewards',
  )
  assert.equal(
    notificationDestination({ entityType: 'https://evil.example' }),
    null,
  )
})
test('uses centralized semantic colors for notification severity', () => {
  assert.equal(notificationColor('warning'), 'warning')
  assert.equal(notificationColor('danger'), 'danger')
  assert.equal(notificationColor('success'), 'success')
  assert.equal(notificationColor('unknown'), 'neutral')
})
test('formats unambiguous API timestamps in representative locales', () => {
  const value = '2026-08-11T15:00:00Z'
  for (const locale of ['en-US', 'en-GB', 'ar-SA']) {
    const shown = formatNotificationTime(value, locale)
    assert.ok(shown.length > 5)
    assert.ok(!shown.includes('Invalid'))
  }
})

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  dueReason,
  meterRemaining,
  timeRemaining,
} from './maintenanceFormat.js'

const t = (key, values = {}) =>
  `${key}:${Object.entries(values)
    .map(([name, value]) => `${name}=${value}`)
    .join(',')}`

test('formats meter maintenance status without losing units', () => {
  assert.equal(
    meterRemaining({ target: 100, currentReading: 100, unit: 'km' }, t),
    'maintenance.dueNow:',
  )
  assert.equal(
    meterRemaining({ target: 100, currentReading: 80, unit: 'km' }, t),
    'maintenance.meterRemaining:count=20,unit=km',
  )
  assert.equal(
    meterRemaining({ target: 100, currentReading: 120, unit: 'km' }, t),
    'maintenance.meterOverdue:count=20,unit=km',
  )
})

test('formats date maintenance status from a stable clock', () => {
  const now = Date.parse('2026-08-26T00:00:00Z')
  assert.equal(
    timeRemaining('2026-08-26T12:00:00Z', t, now),
    'maintenance.dueInDays:count=1',
  )
  assert.equal(
    timeRemaining('2026-08-25T00:00:00Z', t, now),
    'maintenance.overdueDays:count=1',
  )
})

test('maps due reasons through the maintenance catalog', () => {
  assert.equal(dueReason('meter', t), 'maintenance.dueReason.meter:')
  assert.equal(dueReason(null, t), 'maintenance.dueReason.upcoming:')
})

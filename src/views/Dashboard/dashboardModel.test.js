import assert from 'node:assert/strict'
import test from 'node:test'

import { dashboardBuckets, maintenanceLabel } from './dashboardModel.js'

const t = (key, values = {}) =>
  ({
    'homeToday.approachingByMeter': `Approaching by meter · ${values.remaining} ${values.unit} remaining`,
    'homeToday.dueByDate': 'Due by date',
    'homeToday.dueByMeter': 'Due by meter',
    'homeToday.dueByMeterAndDate': 'Due by meter and date',
  })[key]

test('classifies calendar days in Asia/Riyadh without UTC leakage', () => {
  const chores = [
    { id: 1, nextDueDate: '2026-08-10T20:59:00Z' },
    { id: 2, nextDueDate: '2026-08-10T21:01:00Z' },
    { id: 3, nextDueDate: '2026-08-11T21:01:00Z' },
  ]
  const result = dashboardBuckets(chores, {
    now: new Date('2026-08-11T12:00:00Z'),
    range: 7,
    timeZone: 'Asia/Riyadh',
  })
  assert.deepEqual(
    result.overdue.map(x => x.id),
    [1],
  )
  assert.deepEqual(
    result.today.map(x => x.id),
    [2],
  )
  assert.deepEqual(
    result.upcoming.map(x => x.id),
    [3],
  )
})

test('handles DST calendar boundaries and deterministic ordering', () => {
  const chores = [
    { id: 2, nextDueDate: '2026-03-08T06:30:00Z' },
    { id: 1, nextDueDate: '2026-03-08T06:30:00Z' },
    { id: 3, nextDueDate: '2026-04-08T04:00:00Z' },
  ]
  const result = dashboardBuckets(chores, {
    now: new Date('2026-03-08T16:00:00Z'),
    range: 30,
    timeZone: 'America/New_York',
  })
  assert.deepEqual(
    result.today.map(x => x.id),
    [1, 2],
  )
  assert.deepEqual(result.upcoming, [])
})

test('preserves authoritative hybrid maintenance reason', () => {
  assert.equal(
    maintenanceLabel({ dueReason: 'both' }, { locale: 'en', t }),
    'Due by meter and date',
  )
  assert.match(
    maintenanceLabel(
      { approachingByMeter: true, remaining: 700, unit: 'km' },
      { locale: 'en', t },
    ),
    /700 km remaining/,
  )
})

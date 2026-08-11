import assert from 'node:assert/strict'
import test from 'node:test'

import {
  addDays,
  dateKey,
  filterOccurrences,
  groupOccurrences,
  monthGrid,
  zonedMidnight,
} from './calendarModel.js'

test('uses user-local calendar boundaries in Riyadh', () => {
  assert.equal(dateKey('2026-08-10T21:30:00Z', 'Asia/Riyadh'), '2026-08-11')
  assert.equal(
    zonedMidnight('2026-08-11', 'Asia/Riyadh'),
    '2026-08-10T21:00:00.000Z',
  )
})

test('preserves New York midnight across DST changes', () => {
  assert.equal(
    zonedMidnight('2026-03-07', 'America/New_York'),
    '2026-03-07T05:00:00.000Z',
  )
  assert.equal(
    zonedMidnight('2026-03-09', 'America/New_York'),
    '2026-03-09T04:00:00.000Z',
  )
})

test('builds aligned Sunday and Monday month grids', () => {
  assert.equal(monthGrid('2026-08-11', 0)[0], '2026-07-26')
  assert.equal(monthGrid('2026-08-11', 1)[0], '2026-07-27')
  assert.equal(monthGrid('2026-08-11', 1).length, 42)
})

test('groups occurrences once and filters loaded results without requests', () => {
  const items = [
    { occurrenceId: '1:a', dueAt: '2026-08-11T06:00:00Z' },
    { occurrenceId: '2:a', dueAt: '2026-08-11T07:00:00Z', meterSchedule: {} },
    {
      occurrenceId: '3:a',
      dueAt: '2026-08-12T07:00:00Z',
      meterUpdateReminder: {},
    },
  ]
  assert.equal(groupOccurrences(items, 'Asia/Riyadh')['2026-08-11'].length, 2)
  assert.equal(filterOccurrences(items, 'maintenance').length, 1)
  assert.equal(filterOccurrences(items, 'meter').length, 1)
  assert.equal(filterOccurrences(items, 'tasks').length, 1)
  assert.equal(addDays('2026-02-28', 1), '2026-03-01')
})

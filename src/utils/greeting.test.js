import assert from 'node:assert/strict'
import test from 'node:test'

import { greetingPeriod } from './greeting.js'

test('greeting follows local morning, afternoon and evening boundaries', () => {
  for (const [time, period] of [
    ['00:00', 'morning'],
    ['11:59', 'morning'],
    ['12:00', 'afternoon'],
    ['17:59', 'afternoon'],
    ['18:00', 'evening'],
    ['21:35', 'evening'],
    ['23:59', 'evening'],
  ]) {
    assert.equal(greetingPeriod(new Date(`2026-10-07T${time}:00`)), period)
  }
})

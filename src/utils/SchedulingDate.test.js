import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isValidIanaTimezone,
  localDateTimeToISOString,
} from './SchedulingDate.js'

test('numeric date transport cannot invert August 11 by locale', () => {
  const before = process.env.TZ
  process.env.TZ = 'Asia/Riyadh'
  const iso = localDateTimeToISOString('2026-08-11', '20:00')
  assert.equal(iso, '2026-08-11T17:00:00.000Z')
  for (const locale of ['en-US', 'en-GB', 'ar-SA']) {
    const parts = new Intl.DateTimeFormat(locale, {
      calendar: 'gregory',
      day: 'numeric',
      month: 'numeric',
      numberingSystem: 'latn',
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
    }).formatToParts(new Date(iso))
    const numeric = Object.fromEntries(
      parts.map(part => [part.type, part.value]),
    )
    assert.equal(Number(numeric.day), 11)
    assert.equal(Number(numeric.month), 8)
    assert.equal(Number(numeric.year), 2026)
  }
  if (before === undefined) delete process.env.TZ
  else process.env.TZ = before
})

test('rejects ambiguous and impossible date input', () => {
  assert.throws(() => localDateTimeToISOString('08/11/2026', '20:00'))
  assert.throws(() => localDateTimeToISOString('2026-02-30', '20:00'))
})

test('validates IANA timezone identifiers', () => {
  for (const zone of ['UTC', 'Asia/Riyadh', 'America/New_York']) {
    assert.equal(isValidIanaTimezone(zone), true)
  }
  assert.equal(isValidIanaTimezone('Mars/Riyadh'), false)
  assert.equal(isValidIanaTimezone('CST'), false)
})

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  excludedRouteEntries,
  ROUTE_SMOKE_ACCOUNTING,
} from './routeSmokeAccounting.js'
import {
  ROUTE_SMOKE_ENTRIES,
  ROUTE_SMOKE_GROUPS,
} from './routeSmokeManifest.js'

test('every registered route is accounted for (MISSING = 0)', () => {
  const registered = new Set(ROUTE_SMOKE_ENTRIES.map(entry => entry.path))

  for (const path of registered) {
    assert.ok(
      ROUTE_SMOKE_ACCOUNTING[path],
      `registered route ${path} is not in the smoke accounting`,
    )
  }
})

test('accounting only lists registered routes', () => {
  const registered = new Set(ROUTE_SMOKE_ENTRIES.map(entry => entry.path))

  for (const path of Object.keys(ROUTE_SMOKE_ACCOUNTING)) {
    assert.ok(
      registered.has(path),
      `accounting route ${path} is not registered`,
    )
  }
})

test('covered routes assert a heading or primary text and use known groups', () => {
  const groupIds = new Set(Object.keys(ROUTE_SMOKE_GROUPS))

  for (const entry of ROUTE_SMOKE_ENTRIES) {
    const accounting = ROUTE_SMOKE_ACCOUNTING[entry.path]
    if (accounting?.status !== 'covered') continue

    assert.ok(
      accounting.heading || accounting.text,
      `covered route ${entry.path} needs a heading or text assertion`,
    )
    assert.ok(
      groupIds.has(accounting.group),
      `covered route ${entry.path} uses unknown group ${accounting.group}`,
    )
    assert.equal(
      accounting.auth && !accounting.nav && !accounting.fullscreen,
      false,
      `authenticated covered route ${entry.path} must assert the navigation shell or be marked fullscreen`,
    )
  }
})

test('every excluded route documents a reason', () => {
  const excluded = excludedRouteEntries()

  assert.ok(
    excluded.length > 0,
    'expected at least one intentionally excluded route',
  )

  for (const entry of excluded) {
    const reason = ROUTE_SMOKE_ACCOUNTING[entry.path].reason
    assert.ok(
      typeof reason === 'string' && reason.length > 10,
      `excluded route ${entry.path} needs a documented reason`,
    )
  }
})

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ROUTE_SMOKE_ENTRIES,
  ROUTE_SMOKE_GROUPS,
} from './routeSmokeManifest.js'

test('route smoke manifest lists every settings entry', () => {
  for (const path of ROUTE_SMOKE_GROUPS.settings) {
    assert.ok(
      ROUTE_SMOKE_ENTRIES.some(entry => entry.path === path),
      `missing settings route ${path}`,
    )
  }
})

test('route smoke groups cover every registered route once', () => {
  const grouped = new Set(Object.values(ROUTE_SMOKE_GROUPS).flat())
  const registered = new Set(ROUTE_SMOKE_ENTRIES.map(entry => entry.path))

  for (const path of registered) {
    assert.ok(
      grouped.has(path),
      `route ${path} is not assigned to a smoke group`,
    )
  }

  for (const path of grouped) {
    assert.ok(registered.has(path), `grouped route ${path} is not registered`)
  }
})

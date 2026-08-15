import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const dashboardPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'Dashboard.jsx',
)

test('Dashboard imports dashboard bucket helpers from dashboardModel', () => {
  const source = readFileSync(dashboardPath, 'utf8')

  assert.match(
    source,
    /import\s*\{[^}]*dashboardBuckets[^}]*\}\s*from\s*['"]\.\/dashboardModel['"]/s,
    'Dashboard must import dashboardBuckets from ./dashboardModel',
  )
  assert.match(source, /groupUpcoming/)
  assert.match(source, /maintenanceLabel/)
})

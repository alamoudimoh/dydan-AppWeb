import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const dashboardPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'Dashboard.jsx',
)

test('Dashboard renders the PE2 Home / Focus / Quest views', () => {
  const source = readFileSync(dashboardPath, 'utf8')

  assert.match(
    source,
    /import\s+FocusHome\s+from\s+['"][^'"]*[Ff]ocus\/FocusHome['"]/,
    'Dashboard must render the Focus home (product-experience clone)',
  )
  assert.match(
    source,
    /import\s+QuestHome\s+from\s+['"][^'"]*[Qq]uest\/QuestHome['"]/,
    'Dashboard must render the Quest home (product-experience clone)',
  )
  assert.match(
    source,
    /home\.view\s*===\s*'quest'\s*\?/,
    'Dashboard must switch between Quest and Focus from the home view state',
  )
})

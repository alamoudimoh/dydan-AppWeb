import assert from 'node:assert/strict'
import test from 'node:test'

import { activeCategories, categoryCatalog } from './categoryModel.js'

test('task selector uses the authoritative category response only', () => {
  const backendResponse = {
    res: [{ id: 3, name: 'car', archivedAt: null }],
  }
  const oldTasks = [
    { id: 1, name: '01_test' },
    { id: 2, name: '02_test' },
  ]

  const options = [
    { id: null, name: 'Uncategorized' },
    ...activeCategories(categoryCatalog(backendResponse)),
  ]

  assert.deepEqual(
    options.map(option => option.name),
    ['Uncategorized', 'car'],
  )
  assert.ok(
    oldTasks.every(task => !options.some(option => option.name === task.name)),
  )
})

test('active consumers hide archived categories from the shared catalog', () => {
  const categories = categoryCatalog({
    res: [
      { id: 3, name: 'car', archivedAt: null },
      { id: 4, name: 'Old', archivedAt: '2026-08-13T00:00:00Z' },
    ],
  })
  assert.deepEqual(
    activeCategories(categories).map(category => category.name),
    ['car'],
  )
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { realtimeInvalidationKeys } from './RealtimeInvalidation.js'

test('chore SSE events refresh approved task projections', () => {
  assert.deepEqual(realtimeInvalidationKeys('chore.completed'), [
    'chores',
    'calendar',
    'history',
    'notifications',
  ])
})

test('unknown SSE events cannot mutate cached data blindly', () => {
  assert.deepEqual(realtimeInvalidationKeys('unknown.event'), ['notifications'])
})

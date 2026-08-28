import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CHORE_QUERY_STATE,
  resolveChoreQueryState,
  shouldUseOfflineChoreCache,
} from './ChoreQueryState.js'

test('resolveChoreQueryState distinguishes missing, forbidden, and network failures', () => {
  assert.equal(resolveChoreQueryState({ hasData: true }), CHORE_QUERY_STATE.OK)
  assert.equal(
    resolveChoreQueryState({ error: { status: 404 } }),
    CHORE_QUERY_STATE.NOT_FOUND,
  )
  assert.equal(
    resolveChoreQueryState({ error: { status: 403 } }),
    CHORE_QUERY_STATE.FORBIDDEN,
  )
  assert.equal(
    resolveChoreQueryState({
      error: new TypeError('Failed to fetch'),
    }),
    CHORE_QUERY_STATE.NETWORK,
  )
  assert.equal(
    resolveChoreQueryState({ error: new Error('Server exploded') }),
    CHORE_QUERY_STATE.ERROR,
  )
})

test('offline cache is skipped for authoritative API denials', () => {
  assert.equal(shouldUseOfflineChoreCache({ status: 404 }), false)
  assert.equal(shouldUseOfflineChoreCache({ status: 403 }), false)
  assert.equal(
    shouldUseOfflineChoreCache(new TypeError('Failed to fetch')),
    true,
  )
})

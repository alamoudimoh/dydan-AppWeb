import assert from 'node:assert/strict'
import test from 'node:test'

import {
  selectPendingRewardRequests,
  toRewardRequests,
} from './rewardRequests.ts'

test('shows every pending request and excludes resolved requests', () => {
  const requests = [
    { id: '1', status: 'pending' },
    { id: '2', status: 'approved' },
    { id: '3', status: 'pending' },
    { id: '4', status: 'rejected' },
    { id: '5', status: 'cancelled' },
  ]
  assert.deepEqual(
    selectPendingRewardRequests(requests).map(r => r.id),
    ['1', '3'],
  )
  assert.deepEqual(selectPendingRewardRequests([]), [])
})

test('cancelled server requests are not resurrected as pending in live data', () => {
  const requests = toRewardRequests([
    { id: 1, rewardId: 2, status: 'pending' },
    { id: 2, rewardId: 2, status: 'cancelled' },
    { id: 3, rewardId: 2, status: 'approved' },
  ])
  assert.deepEqual(
    requests.map(r => r.status),
    ['pending', 'cancelled', 'approved'],
  )
  assert.deepEqual(
    selectPendingRewardRequests(requests).map(r => r.id),
    ['1'],
  )
})

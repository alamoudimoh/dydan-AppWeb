import assert from 'node:assert/strict'
import test from 'node:test'

import { selectPendingRewardRequests } from './rewardRequests.ts'

test('shows every pending request and excludes resolved requests', () => {
  const requests = [
    { id: '1', status: 'pending' },
    { id: '2', status: 'approved' },
    { id: '3', status: 'pending' },
    { id: '4', status: 'rejected' },
  ]
  assert.deepEqual(
    selectPendingRewardRequests(requests).map(r => r.id),
    ['1', '3'],
  )
  assert.deepEqual(selectPendingRewardRequests([]), [])
})

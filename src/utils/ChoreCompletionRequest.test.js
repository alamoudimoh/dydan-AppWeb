import assert from 'node:assert/strict'
import test from 'node:test'

import {
  chorePriorityEndpoint,
  completeChoreRequest,
} from './ChoreCompletionRequest.js'

test('completion details use the server JSON contract', () => {
  const request = completeChoreRequest(
    42,
    { note: 'completed during migration', operationId: 'operation-id' },
    '2026-08-27T12:00:00.000Z',
    '7',
  )

  assert.deepEqual(request, {
    endpoint: '/chores/42/do',
    payload: {
      note: 'completed during migration',
      operationId: 'operation-id',
      completedTime: '2026-08-27T12:00:00.000Z',
      completedBy: 7,
    },
  })
})

test('priority endpoint has no trailing path whitespace', () => {
  assert.equal(chorePriorityEndpoint(42), '/chores/42/priority')
})

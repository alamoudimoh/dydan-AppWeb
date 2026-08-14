import assert from 'node:assert/strict'
import test from 'node:test'

import { createSingleFlight, ensureOperationId } from './SubmissionGuards.js'

test('completion payload keeps one operation id through retry and offline replay', () => {
  const body = { note: 'done' }
  const first = ensureOperationId(body)
  const retry = ensureOperationId(body)
  assert.equal(first, body)
  assert.equal(retry.operationId, first.operationId)
  assert.match(first.operationId, /^[0-9a-f-]{36}$/i)
})

test('single-flight coalesces concurrent task actions and releases after settle', async () => {
  const singleFlight = createSingleFlight()
  let starts = 0
  let release
  const work = () => {
    starts += 1
    return new Promise(resolve => {
      release = resolve
    })
  }
  const first = singleFlight(42, work)
  const duplicate = singleFlight(42, work)
  assert.equal(first, duplicate)
  await Promise.resolve()
  assert.equal(starts, 1)
  release('ok')
  await first
  await Promise.resolve()
  const later = singleFlight(42, () => {
    starts += 1
    return 'again'
  })
  assert.equal(await later, 'again')
  assert.equal(starts, 2)
})

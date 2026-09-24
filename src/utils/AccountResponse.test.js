import assert from 'node:assert/strict'
import test from 'node:test'

import {
  inviteCodeFromResponse,
  parseAccountResponse,
} from './AccountResponse.js'

const response = (ok, status, body) => ({
  ok,
  status,
  json: async () => body,
})

test('parses direct and wrapped account API payloads', async () => {
  assert.deepEqual(
    await parseAccountResponse(response(true, 200, { mfaEnabled: true })),
    { mfaEnabled: true },
  )
  assert.deepEqual(
    await parseAccountResponse(response(true, 200, { res: { sessions: [] } })),
    { sessions: [] },
  )
})

test('surfaces the real server error instead of reporting false success', async () => {
  await assert.rejects(
    () => parseAccountResponse(response(false, 403, { error: 'Not allowed' })),
    /Not allowed/,
  )
})

test('accepts the server invite_code spelling', () => {
  assert.equal(
    inviteCodeFromResponse({ invite_code: 'REAL-CODE' }),
    'REAL-CODE',
  )
  assert.equal(
    inviteCodeFromResponse({ inviteCode: 'CAMEL-CODE' }),
    'CAMEL-CODE',
  )
})

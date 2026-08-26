import assert from 'node:assert/strict'
import test from 'node:test'

import { hasAuthorization, installApiMocks } from './apiMocks.js'

test('hasAuthorization detects bearer tokens case-insensitively', () => {
  const withLowercase = {
    headers: () => ({ authorization: 'Bearer smoke-test-token' }),
  }
  const withUppercase = {
    headers: () => ({ Authorization: 'Bearer smoke-test-token' }),
  }
  const without = { headers: () => ({}) }

  assert.equal(hasAuthorization(withLowercase), true)
  assert.equal(hasAuthorization(withUppercase), true)
  assert.equal(hasAuthorization(without), false)
})

test('installApiMocks registers auth/session mocks that require Authorization', async () => {
  const routes = []
  const fulfillCalls = []
  const page = {
    route: async (pattern, handler) => {
      routes.push({ pattern, handler })
    },
  }

  await installApiMocks(page)

  const profileRoute = routes.find(r => r.pattern === '**/api/v1/users/profile')
  const refreshRoute = routes.find(r => r.pattern === '**/api/v1/auth/refresh**')

  assert.ok(profileRoute, 'profile mock should be registered')
  assert.ok(refreshRoute, 'refresh mock should be registered')

  const makeRoute = request => ({
    request: () => request,
    fulfill: response => {
      fulfillCalls.push(response)
    },
  })

  // Without Authorization, both endpoints should return a clean 200 with an
  // empty body so the runtime-error guard does not flag a 401 console error,
  // while still leaving the client unauthenticated.
  fulfillCalls.length = 0
  await profileRoute.handler(makeRoute({ headers: () => ({}) }))
  assert.equal(fulfillCalls[0].status, 200)
  assert.equal(JSON.parse(fulfillCalls[0].body).res, null)

  fulfillCalls.length = 0
  await refreshRoute.handler(makeRoute({ headers: () => ({}) }))
  assert.equal(fulfillCalls[0].status, 200)
  assert.equal(JSON.parse(fulfillCalls[0].body).res, null)

  // With Authorization, both endpoints should succeed.
  fulfillCalls.length = 0
  await profileRoute.handler(
    makeRoute({ headers: () => ({ authorization: 'Bearer smoke-test-token' }) }),
  )
  assert.equal(fulfillCalls[0].status, 200)

  fulfillCalls.length = 0
  await refreshRoute.handler(
    makeRoute({ headers: () => ({ authorization: 'Bearer smoke-test-token' }) }),
  )
  assert.equal(fulfillCalls[0].status, 200)
})

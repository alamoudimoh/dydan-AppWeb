import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createApiMockHandler,
  hasAuthorization,
  hasRefreshCookie,
  installApiMocks,
} from './apiMocks.js'

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

test('hasRefreshCookie recognizes only the HttpOnly smoke session cookie', () => {
  assert.equal(
    hasRefreshCookie({
      headers: () => ({ cookie: 'other=x; refresh_token=smoke-refresh-token' }),
    }),
    true,
  )
  assert.equal(
    hasRefreshCookie({ headers: () => ({ cookie: 'refresh_token=expired' }) }),
    false,
  )
})

test('installApiMocks registers one strict API dispatcher', async () => {
  const routes = []
  const page = {
    route: async (pattern, handler) => {
      routes.push({ pattern, handler })
    },
  }

  await installApiMocks(page)

  assert.equal(routes.length, 1)
  assert.equal(routes[0].pattern, '**/api/v1/**')
  assert.equal(typeof routes[0].handler, 'function')
})

const callMock = async ({ body, headers = {}, method = 'GET', path }) => {
  const fulfillCalls = []
  const handler = createApiMockHandler()
  const route = {
    request: () => ({
      headers: () => headers,
      method: () => method,
      postData: () => body,
      url: () => `http://dydan.test${path}`,
    }),
    fulfill: response => fulfillCalls.push(response),
  }

  await handler(route)
  return fulfillCalls[0]
}

test('strict mock rejects unknown API routes instead of returning a success', async () => {
  const response = await callMock({ path: '/api/v1/chores/not-a-route' })

  assert.equal(response.status, 404)
  assert.match(JSON.parse(response.body).error, /unregistered api request/i)
})

test('strict mock rejects wrong methods and malformed route parameters', async () => {
  const wrongMethod = await callMock({
    method: 'POST',
    path: '/api/v1/chores/42/details',
  })
  const malformedParameter = await callMock({ path: '/api/v1/chores/not-a-id' })

  assert.equal(wrongMethod.status, 405)
  assert.equal(malformedParameter.status, 404)
})

test('specific routes retain their server envelopes without collection shadowing', async () => {
  const profile = await callMock({
    path: '/api/v1/users/profile',
    headers: { authorization: 'Bearer smoke-test-token' },
  })
  const ticket = await callMock({
    path: '/api/v1/realtime/sse/ticket',
    headers: { authorization: 'Bearer smoke-test-token' },
  })
  const workload = await callMock({
    path: '/api/v1/progress/workload?range=week',
  })

  assert.equal(JSON.parse(profile.body).res.id, 1)
  assert.equal(JSON.parse(ticket.body).expiresIn, 60)
  assert.equal(ticket.headers['Cache-Control'], 'no-store')
  assert.equal(JSON.parse(workload.body).res, undefined)
  assert.ok(Array.isArray(JSON.parse(workload.body).members))
})

test('strict mock validates mutation payloads and supported public auth flows', async () => {
  const invalidMutation = await callMock({
    method: 'POST',
    path: '/api/v1/chores/42/do',
    body: JSON.stringify({ operationId: 'not-a-uuid' }),
  })
  const validMutation = await callMock({
    method: 'POST',
    path: '/api/v1/chores/42/do',
    body: JSON.stringify({
      operationId: '00000000-0000-4000-8000-000000000001',
    }),
  })
  const publicRefresh = await callMock({
    method: 'POST',
    path: '/api/v1/auth/refresh',
  })
  const cookieRefresh = await callMock({
    method: 'POST',
    path: '/api/v1/auth/refresh',
    headers: { cookie: 'refresh_token=smoke-refresh-token' },
  })

  assert.equal(invalidMutation.status, 400)
  assert.equal(validMutation.status, 200)
  assert.equal(publicRefresh.status, 400)
  assert.equal(cookieRefresh.status, 200)
})

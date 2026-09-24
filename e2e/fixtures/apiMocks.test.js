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
  const ticketSSE = await callMock({
    path: '/api/v1/realtime/sse?ticket=smoke-sse-ticket',
  })
  const refreshCookieSSE = await callMock({
    path: '/api/v1/realtime/sse',
    headers: { cookie: 'refresh_token=smoke-refresh-token' },
  })

  assert.equal(JSON.parse(profile.body).res.id, 1)
  assert.equal(JSON.parse(ticket.body).expiresIn, 60)
  assert.equal(ticket.headers['Cache-Control'], 'no-store')
  assert.equal(JSON.parse(workload.body).res, undefined)
  assert.ok(Array.isArray(JSON.parse(workload.body).members))
  assert.equal(ticketSSE.status, 200)
  assert.match(ticketSSE.headers['Content-Type'], /text\/event-stream/)
  assert.equal(refreshCookieSSE.status, 400)
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

test('routine and reward actions use persisted API contracts, not local success paths', async () => {
  const routine = await callMock({
    method: 'POST',
    path: '/api/v1/routines',
    body: JSON.stringify({ name: 'Morning', description: '' }),
  })
  const item = await callMock({
    method: 'POST',
    path: '/api/v1/routines/81/items',
    body: JSON.stringify({
      name: 'Brush teeth',
      frequencyType: 'daily',
      frequency: 1,
    }),
  })
  const active = await callMock({
    method: 'PATCH',
    path: '/api/v1/routines/81/status',
    body: JSON.stringify({ isActive: false }),
  })
  const reward = await callMock({
    method: 'POST',
    path: '/api/v1/rewards',
    body: JSON.stringify({ name: 'Movie', costPoints: 100 }),
  })
  const request = await callMock({
    method: 'POST',
    path: '/api/v1/rewards/requests',
    body: JSON.stringify({ rewardId: 91 }),
  })

  assert.equal(routine.status, 201)
  assert.equal(item.status, 201)
  assert.equal(active.status, 200)
  assert.equal(reward.status, 201)
  assert.equal(request.status, 201)
})

test('maintenance actions are limited to server-backed completion, readings, and thing state', async () => {
  const completed = await callMock({
    method: 'POST',
    path: '/api/v1/chores/42/do',
    body: JSON.stringify({}),
  })
  const reading = await callMock({
    method: 'POST',
    path: '/api/v1/meters/7/readings',
    body: JSON.stringify({ reading: 42 }),
  })
  const thing = await callMock({
    method: 'PUT',
    path: '/api/v1/things/8/state?value=on',
  })

  assert.equal(completed.status, 200)
  assert.equal(reading.status, 201)
  assert.equal(thing.status, 200)
})

test('notifications list accepts the query-less contract the runtime uses', async () => {
  const withoutQuery = await callMock({ path: '/api/v1/notifications' })
  const withLimit = await callMock({ path: '/api/v1/notifications?limit=10' })
  const unexpected = await callMock({ path: '/api/v1/notifications?offset=1' })

  assert.equal(withoutQuery.status, 200)
  assert.equal(JSON.parse(withoutQuery.body).unreadCount, 0)
  assert.equal(withLimit.status, 200)
  assert.equal(unexpected.status, 400)
})

test('user preferences are served, mutatable, and resettable per handler', async () => {
  const handler = createApiMockHandler()
  const call = async ({ body, method = 'GET', path }) => {
    const fulfillCalls = []
    const route = {
      request: () => ({
        headers: () => ({}),
        method: () => method,
        postData: () => body,
        url: () => `http://dydan.test${path}`,
      }),
      fulfill: response => fulfillCalls.push(response),
    }
    await handler(route)
    return fulfillCalls[0]
  }

  const initial = await call({ path: '/api/v1/users/preferences' })
  assert.equal(initial.status, 200)
  const initialBody = JSON.parse(initial.body).res
  assert.equal(initialBody.defaultView, 'focus')
  assert.equal(initialBody.theme, 'dydan')

  const updated = await call({
    method: 'PUT',
    path: '/api/v1/users/preferences',
    body: JSON.stringify({ ...initialBody, theme: 'sovereign' }),
  })
  assert.equal(updated.status, 200)
  assert.equal(JSON.parse(updated.body).res.theme, 'sovereign')

  const persisted = await call({ path: '/api/v1/users/preferences' })
  assert.equal(JSON.parse(persisted.body).res.theme, 'sovereign')

  const reset = await call({
    method: 'POST',
    path: '/api/v1/users/preferences/reset',
  })
  assert.equal(reset.status, 200)
  const afterReset = await call({ path: '/api/v1/users/preferences' })
  assert.equal(JSON.parse(afterReset.body).res.theme, 'dydan')
})

test('preferences state never leaks between independent handlers', async () => {
  const first = createApiMockHandler()
  const second = createApiMockHandler()
  const respond = async (handler, { body, method = 'GET', path }) => {
    const fulfillCalls = []
    const route = {
      request: () => ({
        headers: () => ({}),
        method: () => method,
        postData: () => body,
        url: () => `http://dydan.test${path}`,
      }),
      fulfill: response => fulfillCalls.push(response),
    }
    await handler(route)
    return fulfillCalls[0]
  }

  await respond(first, {
    method: 'PUT',
    path: '/api/v1/users/preferences',
    body: JSON.stringify({ theme: 'sovereign' }),
  })
  const firstRead = await respond(first, { path: '/api/v1/users/preferences' })
  const secondRead = await respond(second, {
    path: '/api/v1/users/preferences',
  })

  assert.equal(JSON.parse(firstRead.body).res.theme, 'sovereign')
  assert.equal(JSON.parse(secondRead.body).res.theme, 'dydan')
})

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

const callMock = async ({
  body,
  handler = createApiMockHandler(),
  headers = {},
  method = 'GET',
  path,
}) => {
  const fulfillCalls = []
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

test('maintenance actions create and mutate server-backed records', async () => {
  const handler = createApiMockHandler()
  const headers = { authorization: 'Bearer smoke-test-token' }
  const completed = await callMock({
    handler,
    method: 'POST',
    path: '/api/v1/chores/42/do',
    body: JSON.stringify({}),
  })
  const meter = await callMock({
    handler,
    headers,
    method: 'POST',
    path: '/api/v1/meters',
    body: JSON.stringify({ name: 'Odometer', unit: 'km', initialReading: 1 }),
  })
  const reading = await callMock({
    handler,
    headers,
    method: 'POST',
    path: '/api/v1/meters/700/readings',
    body: JSON.stringify({ reading: 42 }),
  })
  const createdThing = await callMock({
    handler,
    headers,
    method: 'POST',
    path: '/api/v1/things',
    body: JSON.stringify({ name: 'Switch', type: 'boolean', state: 'off' }),
  })
  const thing = await callMock({
    handler,
    headers,
    method: 'PUT',
    path: '/api/v1/things/800/state?value=on',
  })

  assert.equal(completed.status, 200)
  assert.equal(meter.status, 201)
  assert.equal(reading.status, 200)
  assert.equal(createdThing.status, 201)
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

// A single handler reused across calls models one test: state written by a
// mutation must be visible to the refetch that follows it, the way the real
// server persists to the account.
const createSession = () => {
  const handler = createApiMockHandler()
  const auth = { authorization: 'Bearer smoke-test-token' }
  return async ({ body, headers = auth, method = 'GET', path }) => {
    const fulfillCalls = []
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
}

test('webhook endpoint round-trips through the capability refetch and clears', async () => {
  const call = createSession()

  const initial = await call({ path: '/api/v1/users/integrations' })
  assert.equal(initial.status, 200)
  assert.equal(JSON.parse(initial.body).res.webhooks.url, '')

  // Mirrors the server: the key must be present and may be empty to clear.
  const rejected = await call({
    method: 'PUT',
    path: '/api/v1/users/webhook',
    body: JSON.stringify({}),
  })
  assert.equal(rejected.status, 400)

  const saved = await call({
    method: 'PUT',
    path: '/api/v1/users/webhook',
    body: JSON.stringify({ url: 'https://hooks.smoke.test/dydan' }),
  })
  assert.equal(saved.status, 200)
  assert.deepEqual(JSON.parse(saved.body), {})

  // The UI invalidates and refetches after Save; the saved URL must come back
  // from the server rather than local component state.
  const afterSave = await call({ path: '/api/v1/users/integrations' })
  assert.equal(
    JSON.parse(afterSave.body).res.webhooks.url,
    'https://hooks.smoke.test/dydan',
  )

  const cleared = await call({
    method: 'PUT',
    path: '/api/v1/users/webhook',
    body: JSON.stringify({ url: '' }),
  })
  assert.equal(cleared.status, 200)
  const afterClear = await call({ path: '/api/v1/users/integrations' })
  assert.equal(JSON.parse(afterClear.body).res.webhooks.url, '')
})

test('webhook endpoint is admin-only in the fixture contract', async () => {
  const call = createSession()
  const unauthenticated = await call({
    method: 'PUT',
    path: '/api/v1/users/webhook',
    body: JSON.stringify({ url: 'https://hooks.smoke.test/dydan' }),
    headers: {},
  })

  assert.equal(unauthenticated.status, 400)
})

test('webhook state never leaks between independent handlers', async () => {
  const first = createSession()
  const second = createSession()

  await first({
    method: 'PUT',
    path: '/api/v1/users/webhook',
    body: JSON.stringify({ url: 'https://hooks.smoke.test/first' }),
  })
  const firstRead = await first({ path: '/api/v1/users/integrations' })
  const secondRead = await second({ path: '/api/v1/users/integrations' })

  assert.equal(
    JSON.parse(firstRead.body).res.webhooks.url,
    'https://hooks.smoke.test/first',
  )
  assert.equal(JSON.parse(secondRead.body).res.webhooks.url, '')
})

test('export renders live preferences and import restores them', async () => {
  const call = createSession()

  await call({
    method: 'PUT',
    path: '/api/v1/users/preferences',
    body: JSON.stringify({ theme: 'sovereign', currency: 'EUR' }),
  })

  const exported = await call({ path: '/api/v1/users/export' })
  assert.equal(exported.status, 200)
  const document = JSON.parse(exported.body)
  assert.equal(document.format, 'dydan-user-export/v1')
  assert.equal(document.preferences.theme, 'sovereign')
  assert.equal(
    exported.headers['Content-Disposition'],
    'attachment; filename="dydan-my-data.json"',
  )

  // A document belonging to another account must be refused, matching
  // importMyData's ownership check and its 403 rejection.
  const foreign = await call({
    method: 'POST',
    path: '/api/v1/users/import',
    body: JSON.stringify({
      ...document,
      account: { id: 99, email: 'x@y.test' },
    }),
  })
  assert.equal(foreign.status, 403)
  assert.equal(
    JSON.parse(foreign.body).error,
    'This export file belongs to a different account',
  )
  assert.equal(
    foreign.headers['X-Dydan-Mock-Contract-Error'],
    undefined,
    'a server business rejection is not a client/server contract regression',
  )

  const wrongFormat = await call({
    method: 'POST',
    path: '/api/v1/users/import',
    body: JSON.stringify({ ...document, format: 'dydan-user-export/v0' }),
  })
  assert.equal(wrongFormat.status, 400)
  assert.equal(JSON.parse(wrongFormat.body).error, 'Invalid data export file')

  // Reset, then restore from the exported document and observe persistence.
  await call({ method: 'POST', path: '/api/v1/users/preferences/reset' })
  const imported = await call({
    method: 'POST',
    path: '/api/v1/users/import',
    body: JSON.stringify(document),
  })
  assert.equal(imported.status, 200)
  assert.equal(JSON.parse(imported.body).restored, 'preferences')

  const afterImport = await call({ path: '/api/v1/users/preferences' })
  assert.equal(JSON.parse(afterImport.body).res.theme, 'sovereign')
  assert.equal(JSON.parse(afterImport.body).res.currency, 'EUR')

  // And the restored state is what a later export carries.
  const reExported = await call({ path: '/api/v1/users/export' })
  assert.equal(JSON.parse(reExported.body).preferences.theme, 'sovereign')
})

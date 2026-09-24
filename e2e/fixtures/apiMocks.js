const json = (body, status = 200, headers = {}) => ({
  status,
  contentType: 'application/json',
  headers,
  body: JSON.stringify(body),
})

const error = (status, message) =>
  json({ error: message }, status, { 'X-Dydan-Mock-Contract-Error': message })

export const hasAuthorization = request => {
  const headers = request.headers()
  return Boolean(headers.authorization || headers.Authorization)
}

export const hasRefreshCookie = request =>
  /(?:^|;\s*)refresh_token=smoke-refresh-token(?:;|$)/.test(
    request.headers().cookie || '',
  )

/**
 * A session cookie present in the browser's cookie jar is authoritative. The
 * Playwright WebKit implementation never materializes cookies on intercepted
 * request header snapshots, so a strictly header-based check leaves every
 * WebKit smoke session signed out. Reading the jar is engine-agnostic and
 * still honors the signed-out specs, which clear the cookie before boot.
 * `page` comes from the handler closure; the optional fallback keeps the
 * fixture's unit tests (which pass a request stub without a frame) working.
 */
const hasRefreshCookieInJar = async (page, request) => {
  const target = page ?? request.frame?.()?.page()
  if (!target) return false
  try {
    return (await target.context().cookies()).some(
      cookie =>
        cookie.name === 'refresh_token' &&
        cookie.value === 'smoke-refresh-token',
    )
  } catch {
    return false
  }
}

const smokeProfile = {
  id: 1,
  circleID: 3,
  userType: 0,
  displayName: 'Smoke User',
  timezone: 'UTC',
  username: 'smoke-user',
  email: 'smoke@example.test',
}

const smokeMembers = [
  {
    userId: 1,
    id: 1,
    isActive: true,
    role: 'admin',
    name: 'Smoke User',
    displayName: 'Smoke User',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    userId: 2,
    id: 2,
    isActive: true,
    role: 'member',
    name: 'Family Member',
    displayName: 'Family Member',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const smokeChore = {
  id: 42,
  name: 'Smoke Chore',
  description: 'Probe chore fixture',
  assignedTo: 2,
  lastCompletedBy: 1,
  priority: 2,
  nextDueDate: '2026-12-31T00:00:00Z',
  lastCompletedDate: null,
  totalCompletedCount: 0,
  deadlineOffset: 0,
  isArchived: false,
  labels: [],
  projectID: null,
  categoryID: null,
  notes: null,
  parentChoreId: null,
  scheduleType: 'oneTime',
  createdAt: '2026-01-01T00:00:00Z',
}

const smokeShoppingList = {
  id: 7,
  name: 'Smoke Shopping List',
  description: '',
  createdBy: 1,
  isArchived: false,
  items: [],
}

const smokeAsset = {
  id: 9,
  name: 'Smoke Asset',
  category: 'Home',
  description: 'Probe fixture asset',
  status: 'upcoming',
  nextDueDate: null,
  meters: [],
  maintenance: [],
  history: [],
  lastService: null,
  dueReason: null,
}

const list = []
const listEnvelope = { res: list }
const maintenanceEnvelope = {
  res: { due: [], approaching: [], upcoming: [], assets: [] },
}

/**
 * User settings preferences (GET /users/preferences, PUT, reset). The current
 * approved runtime reads appearance/theme/language/etc. from this endpoint on
 * every boot (useSettingsPreferences), so the fixture must serve a full,
 * server-shaped envelope and remember PUT mutations across reloads within a
 * test (routes registered via page.route outlive individual navigations).
 */
const defaultPreferences = () => ({
  theme: 'dydan',
  appearance: 'light',
  defaultView: 'focus',
  compactMode: false,
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: 'h:mm A',
  firstDayOfWeek: 0,
  currency: 'USD',
  sidebarCollapsed: false,
  showItemBadges: true,
  rememberSidebar: true,
  notifications: {
    taskReminders: true,
    routineNudges: true,
    familyActivity: false,
    rewards: true,
    weeklySummary: false,
    quietHours: false,
    pushChannel: true,
    emailChannel: false,
  },
  privacy: { activityVisible: true, analytics: true, personalization: true },
  betaFeatures: false,
  verboseLogging: false,
})

/**
 * User settings preferences (GET /users/preferences, PUT, reset). The current
 * approved runtime reads appearance/theme/language/etc. from this endpoint on
 * every boot (useSettingsPreferences), so the fixture must serve a full,
 * server-shaped envelope and remember PUT mutations across reloads within a
 * single test run. State is created per handler so tests never leak theme or
 * layout choices into one another.
 */
const createPreferenceEndpoints = () => {
  let state = defaultPreferences()
  const merge = incoming => {
    if (!incoming || typeof incoming !== 'object') return state
    return {
      ...defaultPreferences(),
      ...incoming,
      notifications: {
        ...defaultPreferences().notifications,
        ...(incoming.notifications ?? {}),
      },
      privacy: { ...defaultPreferences().privacy, ...(incoming.privacy ?? {}) },
    }
  }
  return [
    endpoint({
      method: 'GET',
      path: /^\/api\/v1\/users\/preferences$/,
      response: () => json({ res: state }),
    }),
    endpoint({
      method: 'PUT',
      path: /^\/api\/v1\/users\/preferences$/,
      validate: parseBody,
      response: request => {
        state = merge(parseBody(request))
        return json({ res: state })
      },
    }),
    endpoint({
      method: 'POST',
      path: /^\/api\/v1\/users\/preferences\/reset$/,
      response: () => {
        state = defaultPreferences()
        return json({ res: state })
      },
    }),
  ]
}

const parseBody = request => {
  const body = request.postData()
  if (!body) return null
  try {
    return JSON.parse(body)
  } catch {
    return undefined
  }
}

const requiresFields =
  (...fields) =>
  request => {
    const body = parseBody(request)
    return Boolean(
      body &&
      fields.every(field => body[field] !== undefined && body[field] !== ''),
    )
  }

const validCompletion = request => {
  const body = parseBody(request)
  if (body === undefined || body === null) return body === null
  if (typeof body !== 'object') return false
  return (
    body.operationId === undefined ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      body.operationId,
    )
  )
}

const noUnexpectedQuery = allowed => url =>
  [...url.searchParams.keys()].every(key => allowed.includes(key))

const hasQuery =
  (...keys) =>
  url =>
    keys.every(key => {
      const value = url.searchParams.get(key)
      return value !== null && value !== ''
    })

const endpoint = ({
  method,
  path,
  query = () => true,
  response,
  validate = () => true,
}) => ({ method, path, response, query, validate })

// This is the E2E contract registry. Each entry is backed by a route and DTO
// inspected in dydan-server; no collection wildcard is allowed to mask drift.
export const apiMockContract = [
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/resource$/,
    response: () => json({ version: 'smoke', idp: null }),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/auth\/refresh$/,
    response: async (request, url, page) =>
      hasAuthorization(request) ||
      hasRefreshCookie(request) ||
      (await hasRefreshCookieInJar(page, request))
        ? json({
            token: 'smoke-test-token',
            access_token: 'smoke-test-token',
            access_token_expiry: '2027-01-01T00:00:00Z',
          })
        : // A signed-out browser has no HttpOnly refresh cookie. This is an
          // intentional public bootstrap response, not an unregistered route.
          json({ error: 'Refresh token required' }, 400),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/users\/profile$/,
    response: request =>
      hasAuthorization(request)
        ? json({ res: smokeProfile })
        : error(401, 'Authentication required'),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/users\/?$/,
    response: () => json({ res: [smokeProfile] }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/users\/subaccounts$/,
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/users\/tokens$/,
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/users\/mfa\/status$/,
    response: () => json({ mfaEnabled: false }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/users\/storage$/,
    response: () => json({ res: { used: 0, total: 0 } }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/auth\/sessions$/,
    response: () =>
      json({
        res: {
          sessions: [
            {
              id: 'smoke-session-family',
              createdAt: '2026-08-24T05:00:00Z',
              lastActiveAt: '2026-08-24T06:00:00Z',
              expiresAt: '2026-10-24T06:00:00Z',
              current: true,
            },
          ],
        },
      }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/circles\/?$/,
    response: () => json({ res: [{ id: 3, name: 'Smoke Circle' }] }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/circles\/members$/,
    response: () => json({ res: smokeMembers }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/circles\/members\/requests$/,
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/circles\/3\/members\/points\/history$/,
    query: noUnexpectedQuery(['userId']),
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/chores\/?$/,
    query: noUnexpectedQuery([
      'includeArchived',
      'includeSubtasks',
      'personal',
    ]),
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/chores\/calendar$/,
    query: url =>
      noUnexpectedQuery(['from', 'to'])(url) && hasQuery('from', 'to')(url),
    response: () => json({ res: [] }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/chores\/archived$/,
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/chores\/history$/,
    query: url =>
      noUnexpectedQuery(['limit', 'members'])(url) && hasQuery('limit')(url),
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/sync\/changes$/,
    query: url => noUnexpectedQuery(['since'])(url) && hasQuery('since')(url),
    response: () =>
      json({
        changes: { chores: [], choreHistories: [] },
        deletions: { chores: [], choreHistories: [] },
        cursor: 0,
        hasMore: false,
      }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/chores\/42$/,
    response: () => json({ res: smokeChore }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/chores\/42\/details$/,
    response: () => json({ res: smokeChore }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/chores\/42\/history$/,
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/chores\/42\/timer$/,
    response: () =>
      json({
        res: {
          id: 1,
          startTime: '2026-01-01T10:00:00Z',
          endTime: '2026-01-01T10:00:00Z',
          duration: 0,
          pauseLog: [],
        },
      }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/chores\/42\/attachments$/,
    response: () => json(list),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/chores\/42\/do$/,
    validate: validCompletion,
    response: () => json({ res: smokeChore }),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/chores\/?$/,
    validate: requiresFields('name'),
    response: () => json({ res: 42 }, 201),
  }),
  endpoint({
    method: 'PUT',
    path: /^\/api\/v1\/chores\/?$/,
    validate: requiresFields('id'),
    response: () => json({ res: smokeChore }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/shopping-lists$/,
    query: noUnexpectedQuery(['includeArchived']),
    response: () => json({ res: [smokeShoppingList] }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/shopping-lists\/7$/,
    response: () => json({ res: smokeShoppingList }),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/shopping-lists$/,
    validate: requiresFields('name'),
    response: () => json({ res: smokeShoppingList }, 201),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/shopping-lists\/7\/items$/,
    validate: requiresFields('name'),
    response: () => json({ res: { id: 1 } }, 201),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/labels$/,
    response: () => json(list),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/categories$/,
    query: noUnexpectedQuery(['includeArchived']),
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/projects$/,
    response: () => json(list),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/filters$/,
    response: () => json(list),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/filters\/(?:pinned|by-usage)$/,
    response: () => json(list),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/things$/,
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'PUT',
    path: /^\/api\/v1\/things\/\d+\/state$/,
    query: url => url.searchParams.has('value'),
    response: () => json({ res: { id: 1 } }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/things\/\d+\/history$/,
    query: url => noUnexpectedQuery(['offset'])(url) && hasQuery('offset')(url),
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/meters$/,
    response: () => json(list),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/meters\/\d+\/readings$/,
    validate: requiresFields('reading'),
    response: () => json({ res: { id: 1 } }, 201),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/devices\/tokens$/,
    query: noUnexpectedQuery(['active']),
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/maintenance$/,
    response: () => json(maintenanceEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/maintenance\/assets$/,
    query: noUnexpectedQuery(['includeArchived']),
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/maintenance\/assets\/9$/,
    response: () => json({ res: smokeAsset }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/routines$/,
    query: noUnexpectedQuery(['includeArchived']),
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/routines$/,
    validate: requiresFields('name'),
    response: () => json({ res: { id: 81 } }, 201),
  }),
  endpoint({
    method: 'PUT',
    path: /^\/api\/v1\/routines\/\d+$/,
    validate: requiresFields('name'),
    response: () => json({ res: { id: 81 } }),
  }),
  endpoint({
    method: 'PATCH',
    path: /^\/api\/v1\/routines\/\d+\/status$/,
    validate: requiresFields('isActive'),
    response: () => json({ res: { id: 81 } }),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/routines\/\d+\/items$/,
    validate: requiresFields('name', 'frequencyType', 'frequency'),
    response: () => json({ res: { id: 82 } }, 201),
  }),
  endpoint({
    method: 'PUT',
    path: /^\/api\/v1\/routines\/\d+\/items\/\d+$/,
    validate: requiresFields('name', 'frequencyType', 'frequency'),
    response: () => json({ res: { id: 82 } }),
  }),
  endpoint({
    method: 'DELETE',
    path: /^\/api\/v1\/routines\/\d+\/items\/\d+$/,
    response: () => ({ status: 204 }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/rewards$/,
    query: noUnexpectedQuery(['includeArchived']),
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/rewards$/,
    validate: requiresFields('name', 'costPoints'),
    response: () => json({ res: { id: 91 } }, 201),
  }),
  endpoint({
    method: 'PUT',
    path: /^\/api\/v1\/rewards\/\d+$/,
    validate: requiresFields('name', 'costPoints'),
    response: () => json({ res: { id: 91 } }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/rewards\/requests(?:\/mine)?$/,
    response: () => json(listEnvelope),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/rewards\/requests$/,
    validate: requiresFields('rewardId'),
    response: () => json({ res: { id: 92 } }, 201),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/rewards\/requests\/\d+\/(?:approve|reject|cancel)$/,
    response: () => json({ res: { id: 92 } }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/progress\/workload$/,
    query: url =>
      noUnexpectedQuery(['range', 'memberId', 'categoryId'])(url) &&
      hasQuery('range')(url),
    response: () =>
      json({
        range: { from: '2026-01-01T00:00:00Z', to: '2026-01-07T23:59:59Z' },
        members: [],
        unassigned: 0,
        categories: [],
        tasks: [],
        canViewFamily: true,
      }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/progress\/reports$/,
    query: url => noUnexpectedQuery(['range'])(url) && hasQuery('range')(url),
    response: () =>
      json({
        range: { from: '2026-01-01T00:00:00Z', to: '2026-01-07T23:59:59Z' },
        completed: 0,
        overdue: 0,
        points: { earned: 0, redeemed: 0, available: 0 },
        maintenance: { completed: 0, overdue: 0, approaching: 0 },
      }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/progress\/streak$/,
    response: () =>
      json({ current: 0, best: 0, lastSuccessfulDay: null, rule: null }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/progress\/goals$/,
    response: () => json({ goals: [], canManage: true }),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/progress\/goals$/,
    validate: requiresFields('name'),
    response: () => json({ goal: { id: 1, name: 'Smoke goal' } }, 201),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/notifications$/,
    // The current runtime calls GetNotifications() with no query parameters.
    query: noUnexpectedQuery(['limit', 'before']),
    response: () => json({ res: [], unreadCount: 0 }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/notifications\/unread-count$/,
    response: () => json({ unreadCount: 0 }),
  }),
  endpoint({
    method: 'PATCH',
    path: /^\/api\/v1\/notifications\/\d+\/read$/,
    response: () => json({ ok: true }),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/notifications\/read-all$/,
    response: () => json({ ok: true }),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/realtime\/sse\/ticket$/,
    response: request =>
      hasAuthorization(request)
        ? json({ ticket: 'smoke-sse-ticket', expiresIn: 60 }, 200, {
            'Cache-Control': 'no-store',
          })
        : error(401, 'Authentication required'),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/realtime\/sse$/,
    query: noUnexpectedQuery(['ticket']),
    validate: request =>
      hasAuthorization(request) ||
      new URL(request.url()).searchParams.get('ticket') === 'smoke-sse-ticket',
    response: () => ({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
      body: 'event: connected\ndata: {}\n\n',
    }),
  }),
]

export const createApiMockHandler = page => {
  const contract = [...createPreferenceEndpoints(), ...apiMockContract]
  return async route => {
    const request = route.request()
    const url = new URL(request.url())
    const matchingPath = contract.filter(entry => entry.path.test(url.pathname))
    const sameMethod = matchingPath.filter(
      entry => entry.method === request.method(),
    )
    const matching = sameMethod.find(
      entry => entry.query(url) && entry.validate(request),
    )

    if (matching)
      return route.fulfill(await matching.response(request, url, page))
    if (matchingPath.length === 0) {
      return route.fulfill(
        error(
          404,
          `Unregistered API request: ${request.method()} ${url.pathname}`,
        ),
      )
    }
    if (sameMethod.length === 0) {
      return route.fulfill(error(405, `Unsupported method for ${url.pathname}`))
    }
    return route.fulfill(
      error(400, `Invalid request contract for ${url.pathname}`),
    )
  }
}

export const installApiMocks = page =>
  page.route('**/api/v1/**', createApiMockHandler(page))

/**
 * A full, server-shaped preferences payload for a smoke test, with `patch`
 * applied (shallow, plus nested notifications/privacy merges).
 */
export const smokePreferences = (patch = {}) => ({
  ...defaultPreferences(),
  ...patch,
  notifications: {
    ...defaultPreferences().notifications,
    ...(patch.notifications ?? {}),
  },
  privacy: { ...defaultPreferences().privacy, ...(patch.privacy ?? {}) },
})

/**
 * Present fixed user preferences for one page. Registered after
 * installApiMocks, this route resolves first (later page.route handlers take
 * precedence), so the strict mock's own GET/PUT preference endpoints stay
 * available for everything else.
 */
export const overrideUserPreferences = (page, preferences) =>
  page.route('**/api/v1/users/preferences', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ res: preferences }),
      })
    }
    return route.fallback()
  })

const json = (body, status = 200, headers = {}) => ({
  status,
  contentType: 'application/json',
  headers,
  body: JSON.stringify(body),
})

const error = (status, message) =>
  json({ error: message }, status, { 'X-Dydan-Mock-Contract-Error': message })

/**
 * A rejection the real server itself returns for a well-formed request (an
 * ownership or validation rule), as opposed to a client/server contract drift.
 * It deliberately omits the mock contract-error header so a spec that provokes
 * it on purpose is not reported as a route/query/method regression.
 */
const rejection = (status, message) => json({ error: message }, status)

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

/**
 * Per-test in-memory model of the account-scoped server state that the settings
 * data endpoints read and write. Created once per handler in
 * createApiMockHandler(), so saved preferences and the webhook endpoint
 * round-trip through a page reload inside a test but never leak into the next
 * one.
 */
const createAccountState = () => ({
  preferences: defaultPreferences(),
  webhookURL: '',
})

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
  createdBy: 1,
  circleId: null,
  items: [],
}

const smokeShoppingListSummary = {
  id: smokeShoppingList.id,
  name: smokeShoppingList.name,
  createdBy: smokeShoppingList.createdBy,
  circleId: smokeShoppingList.circleId,
  itemCount: 0,
  checkedCount: 0,
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
// Mirrors the server's lazily initialized circle categories. The task editor
// consumes real numeric ids (not display strings) and sends `categoryId` back
// on create/edit.
const defaultCategories = [
  { id: 101, name: 'household', color: '#64748b' },
  { id: 102, name: 'personal', color: '#8b5cf6' },
  { id: 103, name: 'work', color: '#2563eb' },
  { id: 104, name: 'school', color: '#16a34a' },
  { id: 105, name: 'health', color: '#dc2626' },
  { id: 106, name: 'finance', color: '#ca8a04' },
]
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
const createPreferenceEndpoints = account => {
  const merge = incoming => {
    if (!incoming || typeof incoming !== 'object') return account.preferences
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
      response: () => json({ res: account.preferences }),
    }),
    endpoint({
      method: 'PUT',
      path: /^\/api\/v1\/users\/preferences$/,
      validate: parseBody,
      response: request => {
        account.preferences = merge(parseBody(request))
        return json({ res: account.preferences })
      },
    }),
    endpoint({
      method: 'POST',
      path: /^\/api\/v1\/users\/preferences\/reset$/,
      response: () => {
        account.preferences = defaultPreferences()
        return json({ res: account.preferences })
      },
    }),
  ]
}

/**
 * The account data endpoints that share the per-test account state: the
 * portable export, the portable import, integration capability status, and the
 * webhook endpoint. Export renders the live preferences and import writes them
 * back, so an export -> import round-trip is observable instead of a canned
 * body, and a saved webhook URL is served by the capability endpoint the UI
 * refetches after Save.
 */
const createAccountDataEndpoints = account => [
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/users\/export$/,
    validate: hasAuthorization,
    response: () =>
      json(
        {
          format: 'dydan-user-export/v1',
          exportedAt: '2026-08-24T06:00:00Z',
          account: {
            id: smokeProfile.id,
            username: smokeProfile.username,
            displayName: smokeProfile.displayName,
            email: smokeProfile.email,
            timezone: smokeProfile.timezone,
            circleId: smokeProfile.circleID,
            userType: smokeProfile.userType,
          },
          preferences: account.preferences,
          data: {
            tasks: [],
            taskHistory: [],
            things: [],
            thingHistory: [],
            meters: [],
            meterReadings: [],
            notifications: [],
          },
        },
        200,
        {
          'Content-Disposition': 'attachment; filename="dydan-my-data.json"',
          'Cache-Control': 'no-store, private',
        },
      ),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/users\/import$/,
    // Mirrors importMyData: the document must be structurally well formed, then
    // the server applies its own format/ownership/preference rules and returns
    // the same rejections the real handler does.
    validate: request => {
      const body = parseBody(request)
      return (
        hasAuthorization(request) &&
        body !== null &&
        body !== undefined &&
        typeof body === 'object'
      )
    },
    response: request => {
      const body = parseBody(request)
      if (body.format !== 'dydan-user-export/v1' || !body.account) {
        return rejection(400, 'Invalid data export file')
      }
      if (
        body.account.id !== smokeProfile.id ||
        String(body.account.email ?? '').toLowerCase() !==
          smokeProfile.email.toLowerCase()
      ) {
        return rejection(403, 'This export file belongs to a different account')
      }
      if (!body.preferences || typeof body.preferences !== 'object') {
        return rejection(
          400,
          'The export file contains no preferences to restore',
        )
      }
      account.preferences = {
        ...defaultPreferences(),
        ...body.preferences,
        notifications: {
          ...defaultPreferences().notifications,
          ...(body.preferences.notifications ?? {}),
        },
        privacy: {
          ...defaultPreferences().privacy,
          ...(body.preferences.privacy ?? {}),
        },
      }
      return json({ res: account.preferences, restored: 'preferences' })
    },
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/users\/integrations$/,
    query: noUnexpectedQuery([]),
    validate: hasAuthorization,
    response: () =>
      json({
        res: {
          apiDocs: { enabled: false, url: '' },
          googleCalendar: { available: false },
          caldav: { available: false },
          alexa: { available: false },
          legal: { privacyPolicyUrl: '', termsUrl: '' },
          billing: { invoiceHistory: false },
          webhooks: {
            available: true,
            url: account.webhookURL,
            editable: true,
            plusOnly: false,
          },
        },
      }),
  }),
  endpoint({
    method: 'PUT',
    path: /^\/api\/v1\/users\/webhook$/,
    // Mirrors setWebhook: a `url` key must be present, but an empty string is
    // valid and clears the endpoint (the server only syntax-validates
    // non-empty URLs). Responds with the server's empty `{}` body.
    validate: request => {
      const body = parseBody(request)
      return (
        hasAuthorization(request) &&
        body !== null &&
        body !== undefined &&
        typeof body === 'object' &&
        typeof body.url === 'string'
      )
    },
    response: request => {
      account.webhookURL = String(parseBody(request)?.url ?? '').trim()
      return json({})
    },
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/users\/error-reports$/,
    validate: request => {
      const body = parseBody(request)
      return (
        body &&
        typeof body.summary === 'string' &&
        body.summary.length > 0 &&
        body.summary.length <= 200 &&
        typeof body.details === 'string' &&
        body.details.length <= 20_000 &&
        typeof body.screen === 'string' &&
        body.screen.length <= 64
      )
    },
    response: () =>
      json({ res: { id: 1, recordedAt: new Date().toISOString() } }, 201),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/payments\/invoices$/,
    query: noUnexpectedQuery(['limit']),
    response: () => json({ res: [] }),
  }),
]

/**
 * State for Maintenance's real create/edit/link/read operations. Keeping it
 * per API handler makes reload tests meaningful without leaking data between
 * browser specs, and mirrors the authoritative server response field names.
 */
const createMaintenanceState = () => ({
  assets: [],
  meterReadings: new Map(),
  meters: [],
  nextAssetID: 900,
  nextMeterID: 700,
  nextThingID: 800,
  things: [],
  thingHistory: new Map(),
})

const createMaintenanceEndpoints = state => {
  const now = () => new Date().toISOString()
  const assetFor = id => state.assets.find(asset => asset.id === Number(id))
  const meterFor = id => state.meters.find(meter => meter.id === Number(id))
  const thingFor = id => state.things.find(thing => thing.id === Number(id))
  const assetDetail = id => {
    const asset = assetFor(id)
    if (!asset) return null
    return {
      ...asset,
      history: [],
      maintenance: asset.maintenance ?? [],
      meters: state.meters.filter(meter => meter.assetId === asset.id),
    }
  }
  const requireName = request => {
    const body = parseBody(request)
    return body && typeof body.name === 'string' && body.name.trim().length > 0
  }
  return [
    endpoint({
      method: 'GET',
      path: /^\/api\/v1\/maintenance\/assets$/,
      query: noUnexpectedQuery(['includeArchived']),
      response: () => json({ res: state.assets }),
    }),
    endpoint({
      method: 'POST',
      path: /^\/api\/v1\/maintenance\/assets$/,
      validate: request => hasAuthorization(request) && requireName(request),
      response: request => {
        const body = parseBody(request)
        const asset = {
          id: state.nextAssetID++,
          name: body.name.trim(),
          category: body.category ?? '',
          description: body.description ?? null,
          archivedAt: null,
          maintenance: [],
        }
        state.assets.push(asset)
        return json({ res: asset }, 201)
      },
    }),
    endpoint({
      method: 'GET',
      path: /^\/api\/v1\/maintenance\/assets\/\d+$/,
      response: (_request, url) => {
        const detail = assetDetail(url.pathname.split('/').at(-1))
        return detail ? json({ res: detail }) : error(404, 'Asset not found')
      },
    }),
    endpoint({
      method: 'PUT',
      path: /^\/api\/v1\/maintenance\/assets\/\d+$/,
      validate: requireName,
      response: (request, url) => {
        const asset = assetFor(url.pathname.split('/').at(-1))
        if (!asset) return error(404, 'Asset not found')
        const body = parseBody(request)
        Object.assign(asset, {
          name: body.name.trim(),
          category: body.category ?? '',
          description: body.description ?? null,
        })
        return json({ res: asset })
      },
    }),
    endpoint({
      method: 'PATCH',
      path: /^\/api\/v1\/maintenance\/assets\/\d+\/archive$/,
      validate: request => typeof parseBody(request)?.archived === 'boolean',
      response: (request, url) => {
        const asset = assetFor(url.pathname.split('/')[5])
        if (!asset) return error(404, 'Asset not found')
        asset.archivedAt = parseBody(request).archived ? now() : null
        return { status: 204, body: '' }
      },
    }),
    endpoint({
      method: 'POST',
      path: /^\/api\/v1\/maintenance\/assets\/\d+\/links$/,
      validate: request => {
        const body = parseBody(request)
        return Boolean(body) && Boolean(body.meterId) !== Boolean(body.choreId)
      },
      response: (request, url) => {
        const asset = assetFor(url.pathname.split('/')[5])
        if (!asset) return error(404, 'Asset not found')
        const body = parseBody(request)
        if (body.meterId) {
          const meter = meterFor(body.meterId)
          if (!meter) return error(404, 'Asset or link target not found')
          meter.assetId = asset.id
        } else {
          asset.maintenance = [
            ...(asset.maintenance ?? []).filter(
              item => item.choreId !== body.choreId,
            ),
            { choreId: body.choreId, name: `Linked task ${body.choreId}` },
          ]
        }
        return { status: 204, body: '' }
      },
    }),
    endpoint({
      method: 'DELETE',
      path: /^\/api\/v1\/maintenance\/assets\/\d+\/links$/,
      query: url => noUnexpectedQuery(['meterId', 'choreId'])(url),
      response: (_request, url) => {
        const asset = assetFor(url.pathname.split('/')[5])
        if (!asset) return error(404, 'Asset not found')
        const meterId = Number(url.searchParams.get('meterId'))
        const choreId = Number(url.searchParams.get('choreId'))
        if (meterId) {
          const meter = meterFor(meterId)
          if (!meter || meter.assetId !== asset.id)
            return error(404, 'Meter link not found')
          delete meter.assetId
        } else if (choreId) {
          const before = asset.maintenance?.length ?? 0
          asset.maintenance = (asset.maintenance ?? []).filter(
            item => item.choreId !== choreId,
          )
          if (asset.maintenance.length === before)
            return error(404, 'Maintenance task link not found')
        } else return error(400, 'Specify one meterId or choreId')
        return { status: 204, body: '' }
      },
    }),
    endpoint({
      method: 'GET',
      path: /^\/api\/v1\/meters$/,
      response: () => json({ res: state.meters }),
    }),
    endpoint({
      method: 'POST',
      path: /^\/api\/v1\/meters$/,
      validate: requireName,
      response: request => {
        const body = parseBody(request)
        const meter = {
          id: state.nextMeterID++,
          name: body.name.trim(),
          unit: body.unit,
          currentReading: body.initialReading ?? 0,
        }
        state.meters.push(meter)
        state.meterReadings.set(meter.id, [])
        return json({ res: meter }, 201)
      },
    }),
    endpoint({
      method: 'PUT',
      path: /^\/api\/v1\/meters\/\d+$/,
      validate: requireName,
      response: (request, url) => {
        const meter = meterFor(url.pathname.split('/').at(-1))
        if (!meter) return error(404, 'Meter not found')
        const body = parseBody(request)
        Object.assign(meter, { name: body.name.trim(), unit: body.unit })
        return json({ res: meter })
      },
    }),
    endpoint({
      method: 'POST',
      path: /^\/api\/v1\/meters\/\d+\/readings$/,
      validate: requiresFields('reading'),
      response: (request, url) => {
        const meter = meterFor(url.pathname.split('/')[4])
        if (!meter) return error(404, 'Meter not found')
        const reading = Number(parseBody(request).reading)
        if (!Number.isInteger(reading) || reading < meter.currentReading)
          return error(400, 'Invalid reading')
        meter.currentReading = reading
        const history = state.meterReadings.get(meter.id) ?? []
        history.unshift({
          id: history.length + 1,
          meterId: meter.id,
          reading,
          recordedAt: now(),
        })
        state.meterReadings.set(meter.id, history)
        return json({ res: meter })
      },
    }),
    endpoint({
      method: 'GET',
      path: /^\/api\/v1\/meters\/\d+\/readings$/,
      query: url => noUnexpectedQuery(['offset'])(url),
      response: (_request, url) =>
        json({
          res:
            state.meterReadings.get(Number(url.pathname.split('/')[4])) ?? [],
        }),
    }),
    endpoint({
      method: 'GET',
      path: /^\/api\/v1\/things$/,
      response: () => json({ res: state.things }),
    }),
    endpoint({
      method: 'POST',
      path: /^\/api\/v1\/things$/,
      validate: requireName,
      response: request => {
        const body = parseBody(request)
        const thing = {
          id: state.nextThingID++,
          name: body.name.trim(),
          type: body.type,
          state: body.state ?? '',
        }
        state.things.push(thing)
        state.thingHistory.set(thing.id, [])
        return json({ res: thing }, 201)
      },
    }),
    endpoint({
      method: 'PUT',
      path: /^\/api\/v1\/things$/,
      validate: requireName,
      response: request => {
        const body = parseBody(request)
        const thing = thingFor(body.id)
        if (!thing) return error(404, 'Thing not found')
        Object.assign(thing, body)
        return json({ res: thing })
      },
    }),
    endpoint({
      method: 'PUT',
      path: /^\/api\/v1\/things\/\d+\/state$/,
      query: url => url.searchParams.has('value'),
      response: (_request, url) => {
        const thing = thingFor(url.pathname.split('/')[4])
        if (!thing) return error(404, 'Thing not found')
        thing.state = url.searchParams.get('value')
        const history = state.thingHistory.get(thing.id) ?? []
        history.unshift({
          id: history.length + 1,
          thingId: thing.id,
          state: thing.state,
          createdAt: now(),
        })
        state.thingHistory.set(thing.id, history)
        return json({ res: thing })
      },
    }),
    endpoint({
      method: 'GET',
      path: /^\/api\/v1\/things\/\d+\/history$/,
      query: url => noUnexpectedQuery(['offset'])(url),
      response: (_request, url) =>
        json({
          res: state.thingHistory.get(Number(url.pathname.split('/')[4])) ?? [],
        }),
    }),
    endpoint({
      method: 'DELETE',
      path: /^\/api\/v1\/things\/\d+$/,
      response: (_request, url) => {
        const id = Number(url.pathname.split('/').at(-1))
        const index = state.things.findIndex(thing => thing.id === id)
        if (index < 0) return error(404, 'Thing not found')
        state.things.splice(index, 1)
        state.thingHistory.delete(id)
        return json({})
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
    response: () => json({ res: [smokeShoppingListSummary] }),
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
    response: () => json({ res: defaultCategories }),
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
    method: 'POST',
    path: /^\/api\/v1\/users\/email-change$/,
    validate: request =>
      hasAuthorization(request) &&
      requiresFields('email', 'currentPassword')(request),
    response: () =>
      json({ message: 'Verification email sent', expiresInSeconds: 1800 }, 202),
  }),
  endpoint({
    method: 'GET',
    path: /^\/api\/v1\/admin\/email-delivery$/,
    response: () =>
      json({
        configured: false,
        source: 'none',
        provider: 'smtp',
        secretConfigured: false,
      }),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/users\/email-change\/verify$/,
    validate: requiresFields('token'),
    response: () =>
      json({ message: 'Email address updated. Please sign in again.' }),
  }),
  endpoint({
    method: 'POST',
    path: /^\/api\/v1\/auth\/logout$/,
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
  // Account state is created per handler so tests never leak saved webhook,
  // theme, or layout choices into one another. This mirrors the preference
  // endpoint's per-handler state.
  const account = createAccountState()
  const maintenance = createMaintenanceState()
  const contract = [
    ...createPreferenceEndpoints(account),
    ...createAccountDataEndpoints(account),
    ...createMaintenanceEndpoints(maintenance),
    ...apiMockContract,
  ]
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

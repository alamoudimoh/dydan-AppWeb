const json = body => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

export const hasAuthorization = request => {
  const headers = request.headers()
  return Boolean(headers.authorization || headers.Authorization)
}

const emptyList = { res: [] }

const smokeProfile = {
  id: 1,
  circleID: 3,
  userType: 0,
  displayName: 'Smoke User',
  timezone: 'UTC',
  username: 'smoke-user',
  email: 'smoke@example.test',
}

const smokeMembers = {
  res: [
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
  ],
}

const smokeSessions = {
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
}

const smokeChore = {
  id: 42,
  name: 'Smoke Chore',
  description: 'Probe chore fixture',
  assignedTo: 2,
  lastCompletedBy: 1,
  priority: 2,
  nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
  createdAt: new Date().toISOString(),
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

const emptyMaintenance = {
  res: { due: [], approaching: [], upcoming: [], assets: [] },
}

const progressPayload = {
  canViewFamily: true,
  canManage: true,
  members: [
    {
      userId: 1,
      name: 'Smoke User',
      today: 0,
      overdue: 0,
      upcoming: 0,
    },
    {
      userId: 2,
      name: 'Family Member',
      today: 0,
      overdue: 0,
      upcoming: 0,
    },
  ],
  unassigned: 0,
  categories: [],
  tasks: [],
  goals: [],
  completed: 0,
  overdue: 0,
  points: { earned: 0, redeemed: 0, available: 0 },
  maintenance: { completed: 0, overdue: 0, approaching: 0 },
  insights: [],
  rewards: [],
  current: 0,
  best: 0,
}

// Playwright resolves route handlers with the last registration winning, so
// generic collection patterns are registered before the specific detail
// endpoints they must not shadow (e.g. `/users/**` before `/users/profile`).
const handlers = [
  {
    pattern: '**/api/v1/resource**',
    handler: route => route.fulfill(json({})),
  },
  {
    pattern: '**/api/v1/auth/refresh**',
    handler: route => {
      // Only mint a session when the client presents an existing credential.
      // Public smoke tests clear storage, so return an empty success rather
      // than a 401 that the runtime-error guard would flag.
      if (!hasAuthorization(route.request())) {
        return route.fulfill(json({ res: null }))
      }
      return route.fulfill(
        json({
          token: 'smoke-test-token',
          access_token: 'smoke-test-token',
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      )
    },
  },
  {
    pattern: '**/api/v1/users/**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/chores/**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/shopping-lists/**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/routines**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/labels**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/categories**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/projects**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/filters**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/rewards**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/meters**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/maintenance/**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/maintenance',
    handler: route => route.fulfill(json(emptyMaintenance)),
  },
  {
    pattern: '**/api/v1/notifications**',
    handler: route =>
      route.fulfill(json({ res: [], unreadCount: 0, count: 0 })),
  },
  {
    pattern: '**/api/v1/progress/**',
    handler: route => route.fulfill(json(progressPayload)),
  },
  {
    pattern: '**/api/v1/realtime/sse/ticket**',
    handler: route => route.fulfill(json({ ticket: 'smoke-sse-ticket' })),
  },
  {
    pattern: '**/api/v1/realtime/sse**',
    handler: route =>
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
        body: 'event: connected\ndata: {}\n\n',
      }),
  },
  {
    pattern: '**/api/v1/circles**',
    handler: route =>
      route.fulfill(json({ res: [{ id: 3, name: 'Smoke Circle' }] })),
  },
  {
    pattern: '**/api/v1/circles/members**',
    handler: route => route.fulfill(json(smokeMembers)),
  },
  {
    pattern: '**/api/v1/users/profile',
    handler: route => {
      // Public auth pages must not show a returning user when the session
      // has been cleared. Without an Authorization header return an empty
      // success so the client sees no profile without logging a 401 error.
      if (!hasAuthorization(route.request())) {
        return route.fulfill(json({ res: null }))
      }
      return route.fulfill(json({ res: smokeProfile }))
    },
  },
  {
    pattern: '**/api/v1/auth/sessions',
    handler: route => route.fulfill(json(smokeSessions)),
  },
  {
    pattern: '**/api/v1/chores/42/details',
    handler: route => route.fulfill(json({ res: smokeChore })),
  },
  {
    pattern: '**/api/v1/chores/42/history',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/chores/42/timer**',
    handler: route => route.fulfill(json({ res: null })),
  },
  {
    pattern: '**/api/v1/chores/42',
    handler: route => route.fulfill(json({ res: smokeChore })),
  },
  {
    pattern: '**/api/v1/shopping-lists/7',
    handler: route => route.fulfill(json({ res: smokeShoppingList })),
  },
  {
    pattern: '**/api/v1/maintenance/assets/9',
    handler: route => route.fulfill(json({ res: smokeAsset })),
  },
]

export const installApiMocks = async page => {
  await page.route('**/api/v1/**', route => route.fulfill(json(emptyList)))

  for (const { handler, pattern } of handlers) {
    await page.route(pattern, handler)
  }
}

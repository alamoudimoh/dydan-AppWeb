const json = body => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

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
      isActive: true,
      role: 'admin',
      name: 'Smoke User',
    },
    {
      userId: 2,
      isActive: true,
      role: 'member',
      name: 'Family Member',
    },
  ],
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

const handlers = [
  {
    pattern: '**/api/v1/resource**',
    handler: route => route.fulfill(json({})),
  },
  {
    pattern: '**/api/v1/auth/refresh**',
    handler: route =>
      route.fulfill(
        json({
          token: 'smoke-test-token',
          access_token: 'smoke-test-token',
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      ),
  },
  {
    pattern: '**/api/v1/users/profile**',
    handler: route => route.fulfill(json({ res: smokeProfile })),
  },
  {
    pattern: '**/api/v1/circles/members**',
    handler: route => route.fulfill(json(smokeMembers)),
  },
  {
    pattern: '**/api/v1/circles**',
    handler: route =>
      route.fulfill(json({ res: [{ id: 3, name: 'Smoke Circle' }] })),
  },
  {
    pattern: '**/api/v1/users/**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/chores**',
    handler: route => route.fulfill(json(emptyList)),
  },
  {
    pattern: '**/api/v1/shopping-lists**',
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
]

export const installApiMocks = async page => {
  await page.route('**/api/v1/**', route => route.fulfill(json(emptyList)))

  for (const { handler, pattern } of handlers) {
    await page.route(pattern, handler)
  }
}

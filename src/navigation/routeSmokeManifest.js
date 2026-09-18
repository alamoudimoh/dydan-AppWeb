/**
 * Canonical route list for smoke/regression tests. Paths mirror RouterContext;
 * parameterized segments use stable fixture ids.
 */
export const ROUTE_SMOKE_FIXTURES = Object.freeze({
  choreId: '42',
  shoppingListId: '7',
  thingId: '3',
  assetId: '9',
  authProvider: 'google',
})

/** @typedef {'solo' | 'family' | 'child'} RouteSmokeAuthState */

export const ROUTE_SMOKE_AUTH_STATES = Object.freeze({
  SOLO: 'solo',
  FAMILY: 'family',
  CHILD: 'child',
})

/**
 * Every registered app route (and major settings entry) that should mount once
 * in smoke tests. `requiresFamily` routes need another active circle member.
 */
export const ROUTE_SMOKE_ENTRIES = Object.freeze([
  { path: '/', label: 'Dashboard / Home' },
  { path: '/today', label: 'Today' },
  { path: '/chores', label: 'All tasks' },
  { path: '/my/chores', label: 'My chores' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/search', label: 'Global search' },
  { path: '/archived', label: 'Archived tasks' },
  { path: '/notifications', label: 'Notifications' },
  { path: '/shopping', label: 'Shopping lists' },
  {
    path: `/shopping/${ROUTE_SMOKE_FIXTURES.shoppingListId}`,
    label: 'Shopping list detail',
  },
  { path: '/labels/', label: 'Categories' },
  { path: '/projects/', label: 'Projects' },
  { path: '/filters/', label: 'Filters' },
  { path: '/things', label: 'Things' },
  { path: `/things/${ROUTE_SMOKE_FIXTURES.thingId}`, label: 'Thing history' },
  { path: '/meters', label: 'Meters' },
  { path: '/maintenance', label: 'Maintenance' },
  {
    path: `/maintenance/assets/${ROUTE_SMOKE_FIXTURES.assetId}`,
    label: 'Maintenance asset detail',
  },
  { path: '/routines', label: 'Routines' },
  { path: '/settings', label: 'Settings overview' },
  { path: '/profile', label: 'Profile settings' },
  { path: '/settings/profile', label: 'Legacy profile redirect' },
  { path: '/settings/localization', label: 'Localization settings' },
  { path: '/settings/theme', label: 'Theme settings' },
  { path: '/settings/notifications', label: 'Notification settings' },
  { path: '/settings/storage', label: 'Storage settings' },
  { path: '/settings/sidepanel', label: 'Sidepanel settings' },
  { path: '/settings/advanced', label: 'Advanced settings' },
  { path: '/settings/developer', label: 'Developer settings' },
  { path: '/settings/detailed', label: 'Detailed settings' },
  { path: '/settings/circle', label: 'Circle settings' },
  { path: '/settings/account', label: 'Account settings' },
  { path: '/settings/subaccounts', label: 'Subaccounts settings' },
  { path: '/settings/mfa', label: 'MFA settings' },
  { path: '/settings/apitokens', label: 'API token settings' },
  {
    path: `/chores/${ROUTE_SMOKE_FIXTURES.choreId}`,
    label: 'Chore detail',
  },
  {
    path: `/chores/${ROUTE_SMOKE_FIXTURES.choreId}/edit`,
    label: 'Chore edit',
  },
  { path: '/chores/create', label: 'Create chore' },
  {
    path: `/chores/${ROUTE_SMOKE_FIXTURES.choreId}/history`,
    label: 'Chore history',
  },
  {
    path: `/chores/${ROUTE_SMOKE_FIXTURES.choreId}/timer`,
    label: 'Chore timer',
  },
  { path: '/family', label: 'Family progress', requiresFamily: true },
  { path: '/activities', label: 'Activities', requiresFamily: true },
  { path: '/points', label: 'Points', requiresFamily: true },
  { path: '/rewards', label: 'Rewards', requiresFamily: true },
  { path: '/login', label: 'Login' },
  { path: '/login/settings', label: 'Login settings' },
  { path: '/signup', label: 'Signup' },
  { path: '/forgot-password', label: 'Forgot password' },
  { path: '/password/update', label: 'Update password' },
  { path: '/onboarding', label: 'Onboarding' },
  { path: '/get-started', label: 'Get started' },
  { path: '/ready', label: 'Workspace ready' },
  { path: '/circle-setup', label: 'Circle setup' },
  { path: '/heard-about', label: 'Heard about' },
  { path: '/circle/join', label: 'Join circle' },
  {
    path: `/auth/${ROUTE_SMOKE_FIXTURES.authProvider}`,
    label: 'Auth provider callback',
  },
  { path: '/welcome', label: 'Landing' },
  { path: '/privacy', label: 'Privacy policy' },
  { path: '/terms', label: 'Terms' },
  { path: '/payments/success', label: 'Payment success' },
  { path: '/payments/cancel', label: 'Payment cancelled' },
  { path: '/not-a-real-route', label: 'Not found' },
])

export const routesForAuthState = authState =>
  ROUTE_SMOKE_ENTRIES.filter(entry => {
    if (entry.requiresFamily && authState === ROUTE_SMOKE_AUTH_STATES.SOLO) {
      return false
    }
    return true
  })

/** Route batches keep smoke tests within memory limits when run per file. */
export const ROUTE_SMOKE_GROUPS = Object.freeze({
  daily: [
    '/',
    '/today',
    '/chores',
    '/my/chores',
    '/calendar',
    '/search',
    '/archived',
    '/notifications',
  ],
  organize: [
    '/shopping',
    `/shopping/${ROUTE_SMOKE_FIXTURES.shoppingListId}`,
    '/labels/',
    '/projects/',
    '/filters/',
    '/things',
    `/things/${ROUTE_SMOKE_FIXTURES.thingId}`,
    '/meters',
    '/maintenance',
    `/maintenance/assets/${ROUTE_SMOKE_FIXTURES.assetId}`,
    '/routines',
  ],
  settings: [
    '/settings',
    '/profile',
    '/settings/profile',
    '/settings/localization',
    '/settings/theme',
    '/settings/notifications',
    '/settings/storage',
    '/settings/sidepanel',
    '/settings/advanced',
    '/settings/developer',
    '/settings/detailed',
    '/settings/circle',
    '/settings/account',
    '/settings/subaccounts',
    '/settings/mfa',
    '/settings/apitokens',
  ],
  chores: [
    `/chores/${ROUTE_SMOKE_FIXTURES.choreId}`,
    `/chores/${ROUTE_SMOKE_FIXTURES.choreId}/edit`,
    '/chores/create',
    `/chores/${ROUTE_SMOKE_FIXTURES.choreId}/history`,
    `/chores/${ROUTE_SMOKE_FIXTURES.choreId}/timer`,
  ],
  family: ['/family', '/activities', '/points', '/rewards'],
  public: [
    '/login',
    '/login/settings',
    '/signup',
    '/forgot-password',
    '/password/update',
    '/onboarding',
    '/get-started',
    '/ready',
    '/circle-setup',
    '/heard-about',
    '/circle/join',
    `/auth/${ROUTE_SMOKE_FIXTURES.authProvider}`,
    '/welcome',
    '/privacy',
    '/terms',
    '/payments/success',
    '/payments/cancel',
    '/not-a-real-route',
  ],
})

export const entriesForGroup = groupId => {
  const paths = new Set(ROUTE_SMOKE_GROUPS[groupId])
  return ROUTE_SMOKE_ENTRIES.filter(entry => paths.has(entry.path))
}

import {
  coveredRouteEntries,
  ROUTE_SMOKE_ACCOUNTING,
} from '../src/navigation/routeSmokeAccounting.js'

const toPageDescriptor = entry => {
  const accounting = ROUTE_SMOKE_ACCOUNTING[entry.path]
  return {
    id: entry.path,
    path: entry.path,
    auth: accounting.auth,
    nav: accounting.nav,
    ...(accounting.fullscreen ? { fullscreen: accounting.fullscreen } : {}),
    ...(accounting.heading ? { heading: accounting.heading } : {}),
    ...(accounting.text ? { text: accounting.text } : {}),
  }
}

/**
 * Critical browser smoke routes covered by e2e/smoke.spec.js. These remain
 * covered there (not in the group spec files) so the original baseline stays
 * intact.
 */
export const BROWSER_SMOKE_CRITICAL_PATHS = new Set([
  '/login',
  '/',
  '/shopping',
  '/family',
  '/settings',
  '/settings/profile',
  '/settings/localization',
  '/settings/storage',
  '/chores',
  '/routines',
])

export const BROWSER_SMOKE_PAGES = [
  {
    id: 'login',
    path: '/login',
    auth: false,
    heading: /sign in/i,
    nav: false,
  },
  {
    id: 'home',
    path: '/',
    auth: true,
    heading: /today/i,
    nav: true,
  },
  {
    id: 'shopping',
    path: '/shopping',
    auth: true,
    heading: /^shopping$/i,
    nav: true,
  },
  {
    id: 'family',
    path: '/family',
    auth: true,
    heading: /family progress/i,
    nav: true,
  },
  {
    id: 'settings',
    path: '/settings',
    auth: true,
    heading: /^settings$/i,
    nav: true,
  },
  {
    id: 'settings-profile',
    path: '/settings/profile',
    auth: true,
    heading: /profile settings/i,
    nav: true,
  },
  {
    id: 'settings-localization',
    path: '/settings/localization',
    auth: true,
    heading: /localization/i,
    nav: true,
  },
  {
    id: 'settings-storage',
    path: '/settings/storage',
    auth: true,
    heading: /storage settings/i,
    nav: true,
  },
  {
    id: 'chores',
    path: '/chores',
    auth: true,
    text: /no tasks match this view/i,
    nav: true,
  },
  {
    id: 'routines',
    path: '/routines',
    auth: true,
    heading: /routines/i,
    nav: true,
  },
]

/**
 * Additional covered routes per group, derived from the canonical accounting
 * and excluding the critical baseline covered by e2e/smoke.spec.js.
 */
export const GROUP_SMOKE_PAGES = Object.freeze(
  Object.fromEntries(
    ['daily', 'organize', 'settings', 'chores', 'family', 'public'].map(
      groupId => [
        groupId,
        coveredRouteEntries()
          .filter(
            entry =>
              ROUTE_SMOKE_ACCOUNTING[entry.path].group === groupId &&
              !BROWSER_SMOKE_CRITICAL_PATHS.has(entry.path),
          )
          .map(toPageDescriptor),
      ],
    ),
  ),
)

export const groupPagesFor = groupId => GROUP_SMOKE_PAGES[groupId]

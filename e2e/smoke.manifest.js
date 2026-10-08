/**
 * Route smoke manifest — self-contained and aligned with the approved runtime.
 *
 * Previously derived from src/navigation/routeSmokeAccounting.js (deleted when
 * the approved UI replaced the legacy Figma surface tree). This module now
 * describes the 15 live SCREEN_PATH routes in src/App.tsx directly, plus the
 * unauthenticated auth surface served at any path (historically /login).
 *
 * Each descriptor is consumed by e2e/helpers/smokeRunner.js:
 *   path    route to visit
 *   auth    true → install the smoke session, false → signed-out surface
 *   heading RegExp matched against the page's heading role (preferred)
 *   text    RegExp matched against the visible page text (when no heading)
 *   nav     true → assert the shell navigation (desktop .sidebar / mobile .mobile-nav)
 *
 * BROWSER_SMOKE_PAGES are the cross-browser / visual critical set; the group
 * descriptors partition the remaining routes so every live route is exercised
 * by at least one spec while keeping the original spec files intact.
 */

const PAGE = Object.freeze({
  login: {
    id: 'login',
    path: '/login',
    auth: false,
    heading: /welcome back/i,
    nav: false,
  },
  getStarted: {
    id: 'get-started',
    path: '/get-started',
    auth: false,
    heading: /welcome back/i,
    nav: false,
  },
  home: {
    id: 'home',
    path: '/',
    auth: true,
    // Focus home renders "Good morning|afternoon|evening, {me.name}".
    heading: /Smoke User/i,
    nav: true,
  },
  today: {
    id: 'today',
    path: '/today',
    auth: true,
    heading: /^today$/i,
    nav: true,
  },
  allTasks: {
    id: 'all-tasks',
    path: '/all-tasks',
    auth: true,
    heading: /^all tasks$/i,
    nav: true,
  },
  calendar: {
    id: 'calendar',
    path: '/calendar',
    auth: true,
    heading: /^calendar$/i,
    nav: true,
  },
  projects: {
    id: 'projects',
    path: '/projects',
    auth: true,
    heading: /^projects$/i,
    nav: true,
  },
  routines: {
    id: 'routines',
    path: '/routines',
    auth: true,
    heading: /^routines$/i,
    nav: true,
  },
  maintenance: {
    id: 'maintenance',
    path: '/maintenance',
    auth: true,
    heading: /^assets$/i,
    nav: true,
  },
  shopping: {
    id: 'shopping',
    path: '/shopping',
    auth: true,
    heading: /^shopping$/i,
    nav: true,
  },
  goals: {
    id: 'goals',
    path: '/goals',
    auth: true,
    heading: /^goals$/i,
    nav: true,
  },
  activity: {
    id: 'activity',
    path: '/activity',
    auth: true,
    heading: /^activity$/i,
    nav: true,
  },
  notifications: {
    id: 'notifications',
    path: '/notifications',
    auth: true,
    heading: /^notifications$/i,
    nav: true,
  },
  rewards: {
    id: 'rewards',
    path: '/rewards',
    auth: true,
    heading: /^rewards$/i,
    nav: true,
  },
  progress: {
    id: 'progress',
    path: '/progress',
    auth: true,
    heading: /^progress$/i,
    nav: true,
  },
  settings: {
    id: 'settings',
    path: '/settings',
    auth: true,
    heading: /^settings$/i,
    nav: true,
  },
  search: {
    id: 'search',
    path: '/search',
    auth: true,
    // Search has no static heading; the empty state proves the surface mounted.
    text: /find anything in dydan/i,
    nav: true,
  },
})

/**
 * Critical browser smoke routes covered by e2e/smoke.spec.js and the
 * cross-browser (Firefox/WebKit) and visual projects.
 */
export const BROWSER_SMOKE_CRITICAL_PATHS = new Set([
  '/login',
  '/',
  '/all-tasks',
  '/shopping',
  '/settings',
  '/routines',
])

export const BROWSER_SMOKE_PAGES = [
  PAGE.login,
  PAGE.home,
  PAGE.allTasks,
  PAGE.shopping,
  PAGE.settings,
  PAGE.routines,
]

/**
 * Additional covered routes per group, derived directly from the live route set.
 */
export const GROUP_SMOKE_PAGES = Object.freeze({
  public: [PAGE.login, PAGE.getStarted],
  daily: [PAGE.today, PAGE.calendar, PAGE.notifications],
  chores: [PAGE.allTasks],
  organize: [PAGE.projects, PAGE.maintenance, PAGE.search],
  family: [PAGE.goals, PAGE.activity, PAGE.rewards, PAGE.progress],
  settings: [PAGE.settings],
})

export const groupPagesFor = groupId => GROUP_SMOKE_PAGES[groupId] ?? []

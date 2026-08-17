/**
 * Critical browser smoke routes. Paths align with routeSmokeManifest groups;
 * this is intentionally smaller than the full 58-route manifest.
 */
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
    heading: /shopping lists/i,
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
    text: /no tasks yet/i,
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

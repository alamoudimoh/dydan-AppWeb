import { ROUTE_SMOKE_ENTRIES } from './routeSmokeManifest.js'

/**
 * Canonical browser-smoke accounting. Every registered route must resolve to
 * exactly one status:
 *
 *   - covered:   mounted deterministically in a Playwright smoke group with a
 *                stable heading or primary page text under the shared API mocks
 *   - excluded:  intentionally not browser-covered, with a documented reason
 *
 * `MISSING = 0` is enforced by routeSmokeAccounting.test.js.
 */
export const ROUTE_SMOKE_ACCOUNTING = Object.freeze({
  // daily
  '/': {
    status: 'covered',
    group: 'daily',
    auth: true,
    nav: true,
    heading: /today/i,
  },
  '/chores': {
    status: 'covered',
    group: 'daily',
    auth: true,
    nav: true,
    text: /no tasks yet/i,
  },
  '/my/chores': {
    status: 'covered',
    group: 'daily',
    auth: true,
    nav: true,
    text: /no tasks yet/i,
  },
  '/calendar': {
    status: 'covered',
    group: 'daily',
    auth: true,
    nav: true,
    heading: /^calendar$/i,
  },
  '/search': {
    status: 'covered',
    group: 'daily',
    auth: true,
    // Full-screen search palette replaces the app navigation shell.
    nav: false,
    fullscreen: true,
    text: /searching content available on this device/i,
  },
  '/archived': {
    status: 'covered',
    group: 'daily',
    auth: true,
    nav: true,
    heading: /^archived tasks$/i,
  },
  '/notifications': {
    status: 'covered',
    group: 'daily',
    auth: true,
    nav: true,
    heading: /^notifications$/i,
  },

  // organize
  '/shopping': {
    status: 'covered',
    group: 'organize',
    auth: true,
    nav: true,
    heading: /shopping lists/i,
  },
  '/shopping/7': {
    status: 'covered',
    group: 'organize',
    auth: true,
    nav: true,
    heading: /^smoke shopping list$/i,
  },
  '/labels/': {
    status: 'covered',
    group: 'organize',
    auth: true,
    nav: true,
    heading: /^categories$/i,
  },
  '/projects/': {
    status: 'covered',
    group: 'organize',
    auth: true,
    nav: true,
    heading: /^projects$/i,
  },
  '/filters/': {
    status: 'covered',
    group: 'organize',
    auth: true,
    nav: true,
    heading: /^filters$/i,
  },
  '/things': {
    status: 'covered',
    group: 'organize',
    auth: true,
    nav: true,
    heading: /^things$/i,
  },
  '/things/3': {
    status: 'covered',
    group: 'organize',
    auth: true,
    nav: true,
    text: /no history yet/i,
  },
  '/meters': {
    status: 'covered',
    group: 'organize',
    auth: true,
    nav: true,
    heading: /^meters$/i,
  },
  '/maintenance': {
    status: 'covered',
    group: 'organize',
    auth: true,
    nav: true,
    heading: /^maintenance$/i,
  },
  '/maintenance/assets/9': {
    status: 'covered',
    group: 'organize',
    auth: true,
    nav: true,
    heading: /^smoke asset$/i,
  },
  '/routines': {
    status: 'covered',
    group: 'organize',
    auth: true,
    nav: true,
    heading: /routines/i,
  },

  // settings
  '/settings': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /^settings$/i,
  },
  '/settings/profile': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /profile settings/i,
  },
  '/settings/localization': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /localization/i,
  },
  '/settings/theme': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /theme preferences/i,
  },
  '/settings/notifications': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /notification settings/i,
  },
  '/settings/storage': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /storage settings/i,
  },
  '/settings/sidepanel': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /sidepanel customization/i,
  },
  '/settings/advanced': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /advanced settings/i,
  },
  '/settings/developer': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /developer settings/i,
  },
  '/settings/detailed': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /profile settings/i,
  },
  '/settings/circle': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /circle settings/i,
  },
  '/settings/account': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /account settings/i,
  },
  '/settings/subaccounts': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /managed accounts/i,
  },
  '/settings/mfa': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /multi-factor authentication/i,
  },
  '/settings/apitokens': {
    status: 'covered',
    group: 'settings',
    auth: true,
    nav: true,
    heading: /api tokens/i,
  },

  // chores
  '/chores/42': {
    status: 'covered',
    group: 'chores',
    auth: true,
    nav: true,
    heading: /smoke chore/i,
  },
  '/chores/42/edit': {
    status: 'covered',
    group: 'chores',
    auth: true,
    nav: true,
    heading: /task settings/i,
  },
  '/chores/create': {
    status: 'covered',
    group: 'chores',
    auth: true,
    nav: true,
    heading: /task settings/i,
  },
  '/chores/42/history': {
    status: 'covered',
    group: 'chores',
    auth: true,
    nav: true,
    text: /no history yet/i,
  },
  '/chores/42/timer': {
    status: 'covered',
    group: 'chores',
    auth: true,
    nav: true,
    text: /no timer data/i,
  },

  // family
  '/family': {
    status: 'covered',
    group: 'family',
    auth: true,
    nav: true,
    heading: /family progress/i,
  },
  '/activities': {
    status: 'covered',
    group: 'family',
    auth: true,
    nav: true,
    heading: /^activities$/i,
  },
  '/points': {
    status: 'covered',
    group: 'family',
    auth: true,
    nav: true,
    heading: /^points leaderboard$/i,
  },
  '/rewards': {
    status: 'covered',
    group: 'family',
    auth: true,
    nav: true,
    heading: /^rewards$/i,
  },

  // public
  '/login': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /sign in/i,
  },
  '/login/settings': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /server settings/i,
  },
  '/signup': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /create your account/i,
  },
  '/forgot-password': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /reset your password/i,
  },
  '/password/update': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /this link is not valid/i,
  },
  '/onboarding': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /stop forgetting the little things/i,
  },
  '/get-started': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /donetick/i,
  },
  '/ready': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /you're all set/i,
  },
  '/circle-setup': {
    status: 'covered',
    group: 'public',
    auth: true,
    nav: true,
    heading: /bring your squad in/i,
  },
  '/heard-about': {
    status: 'covered',
    group: 'public',
    auth: true,
    nav: true,
    heading: /help us improve daydan/i,
  },
  '/circle/join': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /invite link is incomplete/i,
  },
  '/auth/google': {
    status: 'excluded',
    group: 'public',
    reason:
      'OAuth callback: requires a provider code/state exchange against the backend; without a real flow only the fallback error state renders.',
  },
  '/welcome': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /simplify tasks & chores/i,
  },
  '/privacy': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /^privacy policy$/i,
  },
  '/terms': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /terms of service/i,
  },
  '/payments/success': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /payment successful/i,
  },
  '/payments/cancel': {
    status: 'covered',
    group: 'public',
    auth: false,
    nav: false,
    heading: /payment has been cancelled/i,
  },
  '/test': {
    status: 'covered',
    group: 'public',
    auth: true,
    nav: true,
    heading: /test view/i,
  },
  '/not-a-real-route': {
    status: 'covered',
    group: 'public',
    auth: true,
    nav: true,
    text: /page not found/i,
  },
})

export const routeSmokeStatus = path => ROUTE_SMOKE_ACCOUNTING[path]?.status

export const coveredRouteEntries = () =>
  ROUTE_SMOKE_ENTRIES.filter(
    entry => routeSmokeStatus(entry.path) === 'covered',
  )

export const excludedRouteEntries = () =>
  ROUTE_SMOKE_ENTRIES.filter(
    entry => routeSmokeStatus(entry.path) === 'excluded',
  )

export const coveredRoutesInGroup = groupId =>
  coveredRouteEntries().filter(
    entry => ROUTE_SMOKE_ACCOUNTING[entry.path].group === groupId,
  )

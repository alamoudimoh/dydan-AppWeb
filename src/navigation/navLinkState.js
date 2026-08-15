import { NAV_LINK_IDS } from './navModel.js'

/** Canonical paths for sidebar link ids (active-state matching). */
export const NAV_LINK_PATHS = Object.freeze({
  [NAV_LINK_IDS.HOME]: '/',
  [NAV_LINK_IDS.ALL_TASKS]: '/chores',
  [NAV_LINK_IDS.CALENDAR]: '/calendar',
  [NAV_LINK_IDS.FAMILY_PROGRESS]: '/family',
  [NAV_LINK_IDS.ARCHIVED]: '/archived',
  [NAV_LINK_IDS.MAINTENANCE]: '/maintenance',
  [NAV_LINK_IDS.ROUTINES]: '/routines',
  [NAV_LINK_IDS.CATEGORIES]: '/labels',
  [NAV_LINK_IDS.PROJECTS]: '/projects',
  [NAV_LINK_IDS.SHOPPING_LISTS]: '/shopping',
  [NAV_LINK_IDS.FILTERS]: '/filters',
  [NAV_LINK_IDS.ACTIVITIES]: '/activities',
  [NAV_LINK_IDS.POINTS]: '/points',
  [NAV_LINK_IDS.REWARDS]: '/rewards',
  [NAV_LINK_IDS.PROFILE]: '/settings/profile',
  [NAV_LINK_IDS.SETTINGS]: '/settings',
})

/**
 * Returns whether a route-backed nav item should show the active state.
 * Action-only items (search, feedback) are never active.
 */
export const isNavLinkActive = (pathname, linkId) => {
  if (!linkId || !NAV_LINK_PATHS[linkId]) return false

  const target = NAV_LINK_PATHS[linkId]
  const path = pathname || ''

  if (linkId === NAV_LINK_IDS.HOME) {
    return path === '/' || path === ''
  }

  if (linkId === NAV_LINK_IDS.SETTINGS) {
    return path === '/settings' || path === '/settings/'
  }

  if (linkId === NAV_LINK_IDS.PROFILE) {
    return path === '/settings/profile' || path.startsWith('/settings/profile/')
  }

  return path === target || path.startsWith(`${target}/`)
}

export const NAV_SECTION_IDS = Object.freeze({
  DAILY: 'daily',
  ORGANIZE: 'organize',
  FAMILY: 'family',
  ACCOUNT: 'account',
  SUPPORT: 'support',
})

/** Stable link ids used by the sidebar plan and NavBar registry. */
export const NAV_LINK_IDS = Object.freeze({
  HOME: 'home',
  SEARCH: 'search',
  ALL_TASKS: 'allTasks',
  CALENDAR: 'calendar',
  FAMILY_PROGRESS: 'familyProgress',
  ARCHIVED: 'archived',
  MAINTENANCE: 'maintenance',
  ROUTINES: 'routines',
  CATEGORIES: 'categories',
  PROJECTS: 'projects',
  FILTERS: 'filters',
  ACTIVITIES: 'activities',
  POINTS: 'points',
  REWARDS: 'rewards',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  FEEDBACK: 'feedback',
  BUG_REPORT: 'bugReport',
})

const DAILY_LINKS = [
  NAV_LINK_IDS.HOME,
  NAV_LINK_IDS.SEARCH,
  NAV_LINK_IDS.ALL_TASKS,
  NAV_LINK_IDS.CALENDAR,
]

const ORGANIZE_LINKS = [
  NAV_LINK_IDS.ARCHIVED,
  NAV_LINK_IDS.MAINTENANCE,
  NAV_LINK_IDS.ROUTINES,
  NAV_LINK_IDS.CATEGORIES,
  NAV_LINK_IDS.PROJECTS,
  NAV_LINK_IDS.FILTERS,
]

const FAMILY_LINKS = [
  NAV_LINK_IDS.FAMILY_PROGRESS,
  NAV_LINK_IDS.POINTS,
  NAV_LINK_IDS.REWARDS,
  NAV_LINK_IDS.ACTIVITIES,
]

const ACCOUNT_LINKS = [NAV_LINK_IDS.PROFILE, NAV_LINK_IDS.SETTINGS]

const SUPPORT_LINKS = [NAV_LINK_IDS.FEEDBACK, NAV_LINK_IDS.BUG_REPORT]

/**
 * Active Circle is defined by the server-scoped profile circle id (RH-17).
 */
export const hasActiveFamilyCircle = profile => {
  const raw = profile?.circleID ?? profile?.circleId
  const id = Number(raw)
  return Number.isFinite(id) && id > 0
}

/**
 * Sidebar section plan: product features, optional family block, account, support.
 */
export const buildNavSectionPlan = (hasActiveCircle = false) => {
  const sections = [
    { id: NAV_SECTION_IDS.DAILY, linkIds: [...DAILY_LINKS] },
    { id: NAV_SECTION_IDS.ORGANIZE, linkIds: [...ORGANIZE_LINKS] },
  ]

  if (hasActiveCircle) {
    sections.push({ id: NAV_SECTION_IDS.FAMILY, linkIds: [...FAMILY_LINKS] })
  }

  sections.push(
    { id: NAV_SECTION_IDS.ACCOUNT, linkIds: [...ACCOUNT_LINKS] },
    { id: NAV_SECTION_IDS.SUPPORT, linkIds: [...SUPPORT_LINKS] },
  )

  return sections
}

/** Flat list of route targets for regression checks (excludes action-only items). */
export const collectNavRoutes = (sections, linkRegistry) =>
  sections.flatMap(section =>
    section.linkIds
      .map(id => linkRegistry[id]?.to)
      .filter(to => typeof to === 'string' && to.length > 0),
  )

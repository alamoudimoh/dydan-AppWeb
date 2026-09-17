/** Canonical Dydan browser storage keys. */

export const STORAGE_KEYS = {
  globalSearchRecents: {
    canonical: 'dydan.globalSearch.recents',
  },
  calendarView: {
    canonical: 'dydan.calendar.view',
  },
  dashboardUpcomingRange: {
    canonical: 'dydan.dashboard.upcomingRange',
  },
  homeView: {
    canonical: 'dydan.home.view',
  },
  todayView: {
    canonical: 'dydan.today.view',
  },
}

export const OFFLINE_DB = {
  canonical: 'dydan_offline',
  version: 2,
  objectStores: [
    'cached_chores',
    'command_queue',
    'sync_meta',
    'cached_history',
  ],
}

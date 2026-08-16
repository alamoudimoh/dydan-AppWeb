/** Canonical DayDan browser storage keys with legacy fallbacks. */

export const STORAGE_KEYS = {
  globalSearchRecents: {
    canonical: 'daydan.globalSearch.recents',
    legacy: ['donetick.globalSearch.recents'],
  },
  calendarView: {
    canonical: 'daydan.calendar.view',
    legacy: ['taskier.calendar.view'],
  },
  dashboardUpcomingRange: {
    canonical: 'daydan.dashboard.upcomingRange',
    legacy: ['taskier.dashboard.upcomingRange'],
  },
}

export const OFFLINE_DB = {
  canonical: 'daydan_offline',
  legacy: 'donetick_offline',
  migrationFlag: 'daydan.storage.offlineDbMigrated',
  version: 2,
  objectStores: [
    'cached_chores',
    'command_queue',
    'sync_meta',
    'cached_history',
  ],
}

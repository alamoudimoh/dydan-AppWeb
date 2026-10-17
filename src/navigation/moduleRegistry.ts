export type Screen =
  | 'home'
  | 'today'
  | 'all-tasks'
  | 'calendar'
  | 'projects'
  | 'routines'
  | 'assets'
  | 'shopping'
  | 'goals'
  | 'activity'
  | 'notifications'
  | 'rewards'
  | 'progress'
  | 'settings'
  | 'search'
  | 'error'
  | 'offline'
  | 'unavailable'
  | 'permission-denied'

export type NavigationGroup = 'primary' | 'organize' | 'space' | 'utility'

export type ModuleDefinition = {
  id: Screen
  path: string
  title: string
  labelKey: string
  icon: string
  group: NavigationGroup
  parent?: Screen
  childHidden?: boolean
  soloHidden?: boolean
  navigation?: boolean
}

export const MODULE_REGISTRY: readonly ModuleDefinition[] = [
  {
    id: 'home',
    path: '/',
    title: 'Home',
    labelKey: 'nav.home',
    icon: 'home',
    group: 'primary',
  },
  {
    id: 'today',
    path: '/today',
    title: 'Today',
    labelKey: 'nav.today',
    icon: 'today',
    group: 'primary',
  },
  {
    id: 'all-tasks',
    path: '/all-tasks',
    title: 'All Tasks',
    labelKey: 'nav.allTasks',
    icon: 'tasks',
    group: 'primary',
  },
  {
    id: 'calendar',
    path: '/calendar',
    title: 'Calendar',
    labelKey: 'nav.calendar',
    icon: 'calendar',
    group: 'primary',
  },
  {
    id: 'projects',
    path: '/projects',
    title: 'Projects',
    labelKey: 'nav.projects',
    icon: 'projects',
    group: 'organize',
    childHidden: true,
  },
  {
    id: 'routines',
    path: '/routines',
    title: 'Routines',
    labelKey: 'nav.routines',
    icon: 'routines',
    group: 'organize',
  },
  {
    id: 'assets',
    path: '/assets',
    title: 'Assets',
    labelKey: 'nav.assets',
    icon: 'maintenance',
    group: 'organize',
    childHidden: true,
  },
  {
    id: 'shopping',
    path: '/shopping',
    title: 'Shopping lists',
    labelKey: 'nav.shopping',
    icon: 'shopping',
    group: 'space',
  },
  {
    id: 'goals',
    path: '/goals',
    title: 'Goals',
    labelKey: 'nav.goals',
    icon: 'goals',
    group: 'space',
  },
  {
    id: 'rewards',
    path: '/rewards',
    title: 'Rewards',
    labelKey: 'nav.rewards',
    icon: 'gift',
    group: 'space',
  },
  {
    id: 'progress',
    path: '/progress',
    title: 'Progress',
    labelKey: 'nav.progress',
    icon: 'activity',
    group: 'space',
    soloHidden: true,
    childHidden: true,
  },
  {
    id: 'activity',
    path: '/activity',
    title: 'Activity',
    labelKey: 'nav.activity',
    icon: 'activity',
    group: 'space',
    soloHidden: true,
  },
  {
    id: 'notifications',
    path: '/notifications',
    title: 'Notifications',
    labelKey: 'nav.notifications',
    icon: 'bell',
    group: 'utility',
    navigation: false,
  },
  {
    id: 'settings',
    path: '/settings',
    title: 'Settings',
    labelKey: 'nav.settings',
    icon: 'settings',
    group: 'utility',
    navigation: false,
  },
  {
    id: 'search',
    path: '/search',
    title: 'Search',
    labelKey: 'nav.search',
    icon: 'search',
    group: 'utility',
    navigation: false,
  },
  {
    id: 'error',
    path: '/error',
    title: 'Error',
    labelKey: 'nav.error',
    icon: 'error',
    group: 'utility',
    navigation: false,
  },
  {
    id: 'offline',
    path: '/offline',
    title: 'Offline',
    labelKey: 'nav.offline',
    icon: 'wifi_off',
    group: 'utility',
    navigation: false,
  },
  {
    id: 'unavailable',
    path: '/unavailable',
    title: 'Unavailable',
    labelKey: 'nav.unavailable',
    icon: 'error',
    group: 'utility',
    navigation: false,
  },
  {
    id: 'permission-denied',
    path: '/permission-denied',
    title: 'Permission denied',
    labelKey: 'nav.permissionDenied',
    icon: 'lock',
    group: 'utility',
    navigation: false,
  },
] as const

export const MODULE_BY_ID = Object.fromEntries(
  MODULE_REGISTRY.map(module => [module.id, module]),
) as Record<Screen, ModuleDefinition>

export const SCREEN_PATH = Object.fromEntries(
  MODULE_REGISTRY.map(module => [module.id, module.path]),
) as Record<Screen, string>

export const PATH_SCREEN = Object.fromEntries(
  MODULE_REGISTRY.map(module => [module.path, module.id]),
) as Record<string, Screen>

export const NAVIGATION_GROUPS = {
  primary: MODULE_REGISTRY.filter(
    module => module.group === 'primary' && module.navigation !== false,
  ),
  organize: MODULE_REGISTRY.filter(
    module => module.group === 'organize' && module.navigation !== false,
  ),
  space: MODULE_REGISTRY.filter(
    module => module.group === 'space' && module.navigation !== false,
  ),
} as const

export const MOBILE_NAVIGATION = [
  MODULE_BY_ID.home,
  MODULE_BY_ID.today,
  MODULE_BY_ID.shopping,
  MODULE_BY_ID.goals,
  MODULE_BY_ID.settings,
] as const

export const LEGACY_ROUTE_REDIRECTS = Object.freeze({
  '/maintenance': '/assets',
})

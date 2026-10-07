import Avatar from '@mui/joy/Avatar'
import IconButton from '@mui/joy/IconButton'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  registerCapacitorListeners,
  registerPushNotifications,
} from './CapacitorListener'
import ConfirmDialog from './components/ConfirmDialog'
import CreateTaskModal from './components/CreateTaskModal'
import TaskDetailModal from './components/TaskDetailModal'
import { useLocalization } from './contexts/LocalizationContext'
import {
  Brand,
  Persona,
  useProductBrand,
  useProductPersona,
  useProductTheme,
  useProductView,
  View as CtxView,
} from './contexts/ThemeContext'
import type { Task } from './data'
import { useAuth } from './hooks/useAuth'
import { useTaskMutations } from './hooks/useHousehold'
import { useRealtimeSync } from './hooks/useRealtimeSync'
import {
  preferencesQueryKey,
  type SettingsPreferences,
  useSettingsPreferences,
  useSettingsPreferencesMutation,
} from './hooks/useSettingsPreferences'
import { useStatusBar } from './hooks/useStatusBar'
import { useSyncOnReconnect } from './hooks/useSyncOnReconnect'
import { useLiveData } from './model/liveData'
import ActivityScreen from './screens/ActivityScreen'
import AllTasksScreen from './screens/AllTasksScreen'
import AuthScreen from './screens/AuthScreen'
import CalendarScreen from './screens/CalendarScreen'
import EmailChangeVerificationScreen from './screens/EmailChangeVerificationScreen'
import ErrorScreen from './screens/ErrorScreen'
import FocusHome from './screens/FocusHome'
import GoalsScreen from './screens/GoalsScreen'
import MaintenanceScreen from './screens/MaintenanceScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import ProgressScreen from './screens/ProgressScreen'
import ProjectsScreen from './screens/ProjectsScreen'
import QuestHome from './screens/QuestHome'
import RewardsScreen from './screens/RewardsScreen'
import RoutinesScreen from './screens/RoutinesScreen'
import SearchScreen from './screens/SearchScreen'
import SettingsScreen from './screens/SettingsScreen'
import {
  OfflineScreen,
  PermissionDeniedScreen,
  UnavailableScreen,
} from './screens/SharedStatesScreens'
import ShoppingScreen from './screens/ShoppingScreen'
import TodayScreen from './screens/TodayScreen'
import * as Fetcher from './utils/Fetcher'
import { getAccessToken } from './utils/TokenStorage'

/* Types preserved for all existing screens */
export type Theme = Brand
export type View = CtxView
export type { Persona }
export type AppState = 'auth' | 'onboarding' | 'app'
export type Screen =
  | 'home'
  | 'today'
  | 'all-tasks'
  | 'calendar'
  | 'projects'
  | 'routines'
  | 'maintenance'
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

export type ConfirmDialogConfig = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
}

export type AppCtx = {
  theme: Theme
  view: View
  persona: Persona
  screen: Screen
  isRTL: boolean
  taskDetail: Task | null
  showCreateTask: boolean
  navigate: (s: Screen) => void
  setView: (v: View) => void
  setTheme: (t: Theme) => void
  setPersona: (p: Persona) => void
  toggleRTL: () => void
  openTask: (t: Task) => void
  closeTask: () => void
  openCreate: () => void
  closeCreate: () => void
  showToast: (msg: string) => void
  signOut: () => void
  goToOnboarding: () => void
  triggerSessionExpiry: () => void
  showConfirm: (config: ConfirmDialogConfig) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
}

/* UI priority ("high"/"medium"/"low") → server numeric priority.
   Server scale (see model/liveData toPriority): <=2 low, 3 medium, >=4 high. */
const PRIORITY_TO_NUM: Record<string, number> = { low: 2, medium: 3, high: 4 }
const priorityNum = (p?: Task['priority']) => (p ? PRIORITY_TO_NUM[p] : 3)

/* ─── Route ⇄ Screen mapping ─────────── */
const SCREEN_PATH: Record<Screen, string> = {
  home: '/',
  today: '/today',
  'all-tasks': '/all-tasks',
  calendar: '/calendar',
  projects: '/projects',
  routines: '/routines',
  maintenance: '/maintenance',
  shopping: '/shopping',
  goals: '/goals',
  activity: '/activity',
  notifications: '/notifications',
  rewards: '/rewards',
  progress: '/progress',
  settings: '/settings',
  search: '/search',
  error: '/error',
  offline: '/offline',
  unavailable: '/unavailable',
  'permission-denied': '/permission-denied',
}
const PATH_SCREEN: Record<string, Screen> = Object.fromEntries(
  Object.entries(SCREEN_PATH).map(([s, p]) => [p, s as Screen]),
)

/* ─── Icon system (preserved) ────────── */
const ICON_PATHS: Record<string, string> = {
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M9 22V12h6v10',
  today:
    'M8 7V3m8 4V3m-9 8h10|M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
  tasks:
    'M9 11l3 3L22 4|M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  calendar:
    'M8 7V3m8 4V3m-9 8h10|M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
  projects:
    'M2 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z',
  routines: 'M4 6h16|M4 12h16|M4 18h16',
  maintenance:
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  shopping:
    'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z|M3 6h18|M16 10a4 4 0 0 1-8 0',
  goals:
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  search: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  plus: 'M12 5v14|M5 12h14',
  check: 'M20 6 9 17l-5-5',
  chevron_right: 'M9 18l6-6-6-6',
  chevron_down: 'M6 9l6 6 6-6',
  x: 'M18 6 6 18|M6 6l12 12',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  fire: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  flame:
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z|M22 6l-10 7L2 6',
  users:
    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z|M23 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M17 8l-5-5-5 5|M12 3v12',
  help: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z|M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3|M12 17h.01',
  rtl: 'M3 9h14|M3 15h14|M7 5l-4 4 4 4|M21 9h-4|M21 15h-4',
  gift: 'M20 12v10H4V12|M2 7h20v5H2z|M12 22V7|M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z|M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9|M13.73 21a2 2 0 0 1-3.46 0',
  error:
    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z|M12 9v4|M12 17h.01',
  refresh:
    'M1 4v6h6|M23 20v-6h-6|M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  more: 'M5 12h.01|M12 12h.01|M19 12h.01',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z|M4 22v-7',
  globe:
    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z|M2 12h20|M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  clipboard:
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2|M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7|M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:
    'M3 6h18|M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6|M10 11v6|M14 11v6|M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z|M7 11V7a5 5 0 0 1 10 0v4',
  info: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z|M12 16v-4|M12 8h.01',
  send: 'M22 2 11 13|M22 2 15 22 9 13 2 9l20-7z',
  copy: 'M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  award:
    'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z|M8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  bars: 'M3 12h18|M3 6h18|M3 18h18',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  map: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z|M8 2v16|M16 6v16',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z|M7 7h.01',
  repeat:
    'M17 1l4 4-4 4|M3 11V9a4 4 0 0 1 4-4h14|M7 23l-4-4 4-4|M21 13v2a4 4 0 0 1-4 4H3',
  sparkle:
    'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z|M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75L19 3z|M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  phone:
    'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  monitor:
    'M8 21h8|M12 17v4|M2 3h20a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
  log_out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9',
  external:
    'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6|M15 3h6v6|M10 14 21 3',
  clock:
    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z|M12 6v6l4 2',
  database:
    'M12 2C6.48 2 2 4.24 2 7s4.48 5 10 5 10-2.24 10-5S17.52 2 12 2z|M2 7v5c0 2.76 4.48 5 10 5s10-2.24 10-5V7|M2 12v5c0 2.76 4.48 5 10 5s10-2.24 10-5v-5',
  wifi_off:
    'M1 1l22 22|M16.72 11.06A10.94 10.94 0 0 1 19 12.55|M5 12.55a10.94 10.94 0 0 1 5.17-2.39|M10.71 5.05A16 16 0 0 1 22.58 9|M1.42 9a15.91 15.91 0 0 1 4.7-2.88|M8.53 16.11a6 6 0 0 1 6.95 0|M12 20h.01',
}

export function Icon({
  className = '',
  name,
  size = 18,
  style,
}: {
  name: string
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  const paths = (ICON_PATHS[name] || ICON_PATHS['home']).split('|')
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
      style={style}
      aria-hidden='true'
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}

/* ─── Application logo ──────────── */
/**
 * The single application logo. Both themes render this same mark: the product
 * identity never changes with the palette, and no theme introduces a personal
 * brand mark. Its two ink colors resolve through --brand and --brand-detail,
 * so it follows the active palette.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox='0 0 100 100' aria-hidden='true'>
      <circle cx='50' cy='50' r='46' fill='var(--brand)' />
      <path
        d='M30 38 L50 26 L70 38 L65 66 L50 74 L35 66z'
        fill='none'
        stroke='var(--brand-detail)'
        strokeWidth='5.5'
        strokeLinejoin='round'
      />
      <circle cx='50' cy='50' r='10' fill='var(--brand-detail)' />
    </svg>
  )
}

/* ─── Nav definition ─────────────────── */
type NavDef = {
  id: Screen
  labelKey: string
  icon: string
  childHidden?: boolean
  soloHidden?: boolean
  badge?: string
}

const NAV_PRIMARY: NavDef[] = [
  { id: 'home', labelKey: 'nav.home', icon: 'home' },
  { id: 'today', labelKey: 'nav.today', icon: 'today' },
  { id: 'all-tasks', labelKey: 'nav.allTasks', icon: 'tasks' },
  { id: 'calendar', labelKey: 'nav.calendar', icon: 'calendar' },
]
const NAV_ORGANIZE: NavDef[] = [
  {
    id: 'projects',
    labelKey: 'nav.projects',
    icon: 'projects',
    childHidden: true,
  },
  { id: 'routines', labelKey: 'nav.routines', icon: 'routines' },
  {
    id: 'maintenance',
    labelKey: 'nav.maintenance',
    icon: 'maintenance',
    childHidden: true,
  },
]
const NAV_TEAM: NavDef[] = [
  { id: 'shopping', labelKey: 'nav.shopping', icon: 'shopping' },
  { id: 'goals', labelKey: 'nav.goals', icon: 'goals' },
  { id: 'rewards', labelKey: 'nav.rewards', icon: 'gift' },
  {
    id: 'progress',
    labelKey: 'nav.progress',
    icon: 'activity',
    soloHidden: true,
    childHidden: true,
  },
  {
    id: 'activity',
    labelKey: 'nav.activity',
    icon: 'activity',
    soloHidden: true,
  },
]

/* ─── Sidebar (Joy chrome) ───────────── */
function Sidebar({ ctx }: { ctx: AppCtx }) {
  const { t } = useLocalization()
  const { currentUser, members } = useLiveData()
  const isChild = ctx.persona === 'child'
  const isSolo = ctx.persona === 'solo'
  const currentMember = currentUser ?? members[0]

  const renderItem = (item: NavDef) => {
    if (isChild && item.childHidden) return null
    if (isSolo && item.soloHidden) return null
    return (
      <button
        key={item.id}
        className={`nav-item ${ctx.screen === item.id ? 'active' : ''}`}
        onClick={() => ctx.navigate(item.id)}
      >
        <Icon name={item.icon} size={15} />
        <span className='flex-1 text-start'>{t(item.labelKey)}</span>
      </button>
    )
  }

  const collapsed = ctx.sidebarCollapsed

  return (
    <nav
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      aria-label='Main navigation'
    >
      <div className='sidebar-header'>
        <LogoMark size={28} />
        <div className='flex-1 min-w-0 collapse-hide'>
          <div
            className='font-bold text-primary leading-tight'
            style={{ fontSize: 14 }}
          >
            {t('app.name')}
          </div>
          <div
            className='text-faint'
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
            }}
          >
            {isChild
              ? t('mode.quest')
              : ctx.view === 'quest'
                ? t('mode.questMode')
                : t('mode.focusMode')}
          </div>
        </div>
        <button
          className='collapse-toggle'
          onClick={ctx.toggleSidebar}
          title={collapsed ? 'Expand side panel' : 'Collapse side panel'}
          aria-label='Toggle side panel'
        >
          <Icon name={collapsed ? 'chevron_right' : 'bars'} size={16} />
        </button>
      </div>

      {!isChild && (
        <div
          className='px-3 py-3 border-b collapse-hide'
          style={{ borderColor: 'var(--line)' }}
        >
          <div className='view-toggle' role='group' aria-label='View mode'>
            <button
              type='button'
              className={`view-toggle-btn ${ctx.view === 'focus' ? 'active' : ''}`}
              aria-pressed={ctx.view === 'focus'}
              onClick={() => ctx.setView('focus')}
            >
              {t('mode.focus')}
            </button>
            <button
              type='button'
              className={`view-toggle-btn ${ctx.view === 'quest' ? 'active' : ''}`}
              aria-pressed={ctx.view === 'quest'}
              onClick={() => ctx.setView('quest')}
            >
              {t('mode.quest')}
            </button>
          </div>
        </div>
      )}

      <div className='flex-1 overflow-y-auto px-2 py-2'>
        {NAV_PRIMARY.map(renderItem)}
        <div className='section-label'>{t('nav.organize')}</div>
        {NAV_ORGANIZE.map(renderItem)}
        <div className='section-label'>{t('nav.team')}</div>
        {NAV_TEAM.map(renderItem)}
      </div>

      <div
        className='border-t px-2 pt-2 pb-3 flex flex-col gap-1'
        style={{ borderColor: 'var(--line)' }}
      >
        <div className='px-1 mb-1 collapse-hide'>
          <div
            className='section-label'
            style={{ padding: '4px 0 4px', fontSize: 9 }}
          >
            {t('nav.theme')}
          </div>
          <div className='view-toggle'>
            <button
              type='button'
              className={`view-toggle-btn ${ctx.theme === 'dydan' ? 'active' : ''}`}
              aria-pressed={ctx.theme === 'dydan'}
              onClick={() => ctx.setTheme('dydan')}
            >
              dydan
            </button>
            <button
              type='button'
              className={`view-toggle-btn ${ctx.theme === 'sovereign' ? 'active' : ''}`}
              aria-pressed={ctx.theme === 'sovereign'}
              onClick={() => ctx.setTheme('sovereign')}
            >
              sovereign
            </button>
          </div>
        </div>

        <button
          className='nav-item'
          onClick={ctx.toggleRTL}
          style={{ fontSize: 12 }}
          aria-label={ctx.isRTL ? t('lang.toEnglish') : t('lang.toArabic')}
        >
          <Icon name='globe' size={14} />
          <span>{ctx.isRTL ? t('lang.toEnglish') : t('lang.toArabic')}</span>
        </button>
        <button
          className={`nav-item ${ctx.screen === 'settings' ? 'active' : ''}`}
          onClick={() => ctx.navigate('settings')}
        >
          <Icon name='settings' size={14} />
          <span>{t('nav.settings')}</span>
        </button>
        <div
          className='flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-surface-2'
          style={{ borderRadius: 'var(--r-md)' }}
          onClick={() => ctx.navigate('settings')}
        >
          <Avatar
            className='sidebar-user-avatar'
            size='sm'
            sx={{
              bgcolor: currentMember?.avatarColor ?? 'var(--brand)',
              color: 'var(--pr-cream)',
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            {currentMember?.initials ?? '?'}
          </Avatar>
          <div className='min-w-0 flex-1 collapse-hide'>
            <div
              className='font-semibold text-primary truncate'
              style={{ fontSize: 13 }}
            >
              {currentMember?.name ?? '…'}
            </div>
            <div className='text-faint truncate' style={{ fontSize: 10 }}>
              {isSolo
                ? t('role.solo')
                : t(`role.${currentMember?.role ?? 'adult'}`)}
            </div>
          </div>
        </div>
        <button
          className='nav-item'
          onClick={ctx.signOut}
          style={{ fontSize: 12, color: 'var(--sig-over)' }}
        >
          <Icon name='log_out' size={14} />
          <span>{t('action.signOut')}</span>
        </button>
      </div>
    </nav>
  )
}

/* ─── Mobile bottom nav ──────────────── */
function MobileNav({ ctx }: { ctx: AppCtx }) {
  const { t } = useLocalization()
  const items: { id: Screen; icon: string; label: string }[] = [
    { id: 'home', icon: 'home', label: t('nav.home') },
    { id: 'today', icon: 'today', label: t('nav.today') },
    { id: 'shopping', icon: 'shopping', label: t('nav.shopping') },
    { id: 'goals', icon: 'goals', label: t('nav.goals') },
    { id: 'settings', icon: 'settings', label: t('nav.settings') },
  ]
  return (
    <div className='mobile-nav'>
      <div className='flex w-full'>
        {items.map(item => (
          <button
            key={item.id}
            className='flex-1 flex flex-col items-center justify-center gap-0.5 py-2'
            style={{
              color: ctx.screen === item.id ? 'var(--brand)' : 'var(--t-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
            onClick={() => ctx.navigate(item.id)}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ToastContainer({ toasts }: { toasts: { id: string; msg: string }[] }) {
  return (
    <div className='toast-container'>
      {toasts.map(t => (
        <div key={t.id} className='toast'>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

/* ─── Splash while restoring the session ── */
function SplashScreen(_props: { theme: Theme }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--page)',
        gap: 16,
      }}
    >
      <LogoMark size={56} />
      <div
        className='text-faint'
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        dydan
      </div>
    </div>
  )
}

/* ─── App ────────────────────────────── */
export default function App() {
  const routerNav = useNavigate()
  const location = useLocation()
  useStatusBar()
  useSyncOnReconnect()

  const { brand, setBrand } = useProductBrand()
  const { setMode } = useProductTheme()
  const { setView, view } = useProductView()
  const { persona, setPersona } = useProductPersona()
  const {
    isRTL,
    setDateFormat,
    setFirstDayOfWeek,
    setLanguage,
    setTimeFormat,
    t,
    toggleLang,
  } = useLocalization()

  const live = useLiveData()
  const { currentUser, members, notifications, tasks } = live
  const mutations = useTaskMutations()

  const {
    clearSessionExpired,
    isAuthenticated,
    isLoading: authLoading,
    isSessionExpired,
    profileLoading,
    signOut: realSignOut,
    triggerSessionExpiry: realSessionExpiry,
  } = useAuth()
  useRealtimeSync(isAuthenticated)
  const { data: settingsPreferences } = useSettingsPreferences()
  const preferenceMutations = useSettingsPreferencesMutation()

  /**
   * Merges a partial preference change into the last server-confirmed
   * preferences and writes the whole document, matching the PUT contract the
   * Settings screen uses. Reads the current cached value directly rather than
   * the render-time prop so rapid successive toggles cannot write a stale
   * document.
   */
  const persistPreference = useCallback(
    (patch: Partial<SettingsPreferences>) => {
      if (!getAccessToken()) return
      const current =
        preferenceMutations.client.getQueryData<SettingsPreferences>(
          preferencesQueryKey,
        ) ?? settingsPreferences
      if (!current) return
      const next = { ...current, ...patch }
      // Cache before dispatching. This makes a rapid sequence such as
      // Focus → Quest → Sovereign → Arabic merge each action into the prior
      // pending document instead of sending four stale full-document writes
      // that overwrite one another out of order.
      preferenceMutations.client.setQueryData(preferencesQueryKey, next)
      preferenceMutations.update.mutate(next, {
        onError: () => {
          // Do not roll back a newer preference write that has already
          // replaced this optimistic object in the cache.
          if (
            preferenceMutations.client.getQueryData(preferencesQueryKey) ===
            next
          ) {
            preferenceMutations.client.setQueryData(
              preferencesQueryKey,
              current,
            )
          }
        },
      })
    },
    // `client` is a stable QueryClient reference; depending on it is enough to
    // keep this callback from being rebuilt on every mutation state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferenceMutations.client, settingsPreferences],
  )

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [taskDetail, setTaskDetail] = useState<Task | null>(null)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([])
  const [confirmDialog, setConfirmDialog] =
    useState<ConfirmDialogConfig | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!settingsPreferences) return
    setBrand(settingsPreferences.theme)
    setMode(settingsPreferences.appearance)
    setView(settingsPreferences.defaultView)
    setLanguage(settingsPreferences.language)
    setDateFormat(settingsPreferences.dateFormat)
    setTimeFormat(settingsPreferences.timeFormat)
    setFirstDayOfWeek(settingsPreferences.firstDayOfWeek)
    if (settingsPreferences.rememberSidebar) {
      setSidebarCollapsed(settingsPreferences.sidebarCollapsed)
    }
    document.documentElement.dataset['density'] =
      settingsPreferences.compactMode ? 'compact' : 'comfortable'
  }, [
    setBrand,
    setDateFormat,
    setFirstDayOfWeek,
    setLanguage,
    setMode,
    setTimeFormat,
    setView,
    settingsPreferences,
  ])

  /* Persona is derived from the real account, never picked in a demo panel. */
  const effectivePersona: Persona = useMemo(() => {
    if (!currentUser) return 'parent'
    if (currentUser.role === 'child') return 'child'
    if (members.length <= 1) return 'solo'
    return 'parent'
  }, [currentUser, members.length])

  useEffect(() => {
    if (effectivePersona !== persona) setPersona(effectivePersona)
  }, [effectivePersona, persona, setPersona])

  const screen: Screen = PATH_SCREEN[location.pathname] ?? 'home'
  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    if (screen === 'search') searchInputRef.current?.focus()
  }, [screen])

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        routerNav('/search')
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [routerNav])

  useEffect(() => {
    registerCapacitorListeners(routerNav)
    void registerPushNotifications()
  }, [routerNav])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (screen !== 'all-tasks') return
    if (params.get('create') === '1') setShowCreateTask(true)
    const taskID = params.get('task')
    const task = taskID ? tasks.find(item => item.id === taskID) : undefined
    if (task) setTaskDetail(task)
  }, [location.search, screen, tasks])

  const showToast = useCallback((msg: string) => {
    const id = Date.now().toString() + Math.random()
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 2900)
  }, [])

  const setThemeCb = useCallback(
    (th: Theme) => {
      setBrand(th)
      // The sidebar brand switch is a real account preference, so it is
      // written to the server rather than reset on the next reload. Hydration
      // above calls `setBrand` directly, so replaying stored preferences never
      // issues a redundant write.
      persistPreference({ theme: th })
    },
    [setBrand, persistPreference],
  )
  const setViewCb = useCallback(
    (v: View) => {
      setView(v)
      persistPreference({ defaultView: v })
    },
    [setView, persistPreference],
  )

  /**
   * The sidebar language control flips between English and Arabic. Both the
   * localization context and the stored preference are updated so the choice
   * survives a reload instead of resetting on the next boot.
   */
  const toggleRTLcb = useCallback(() => {
    const nextLanguage = isRTL ? 'en' : 'ar-SA'
    toggleLang()
    setLanguage(nextLanguage)
    persistPreference({ language: nextLanguage })
  }, [isRTL, setLanguage, toggleLang, persistPreference])

  const setSidebarCollapsedCb = useCallback(
    (collapsed: boolean) => {
      setSidebarCollapsed(collapsed)
      // Only persisted when the account opted into remembering the sidebar;
      // otherwise the choice is deliberately per-session.
      if (settingsPreferences?.rememberSidebar) {
        persistPreference({ sidebarCollapsed: collapsed })
      }
    },
    [settingsPreferences?.rememberSidebar, persistPreference],
  )

  const toggleSidebarCb = useCallback(() => {
    setSidebarCollapsedCb(!sidebarCollapsed)
  }, [setSidebarCollapsedCb, sidebarCollapsed])

  const completeTask = useCallback(
    (id: string) => {
      mutations.completeTask.mutate(id)
      setTaskDetail(null)
    },
    [mutations.completeTask],
  )
  const reopenTask = useCallback(
    (id: string) => {
      mutations.undoTask.mutate(id)
      setTaskDetail(null)
    },
    [mutations.undoTask],
  )
  const deleteTask = useCallback(
    (id: string) => {
      mutations.removeTask.mutate(id)
      setTaskDetail(null)
    },
    [mutations.removeTask],
  )

  const isChild = effectivePersona === 'child'
  const isSolo = effectivePersona === 'solo'
  const activeView: View = isChild ? 'quest' : view

  const ctx: AppCtx = useMemo(
    () => ({
      theme: brand,
      view: activeView,
      persona: effectivePersona,
      screen,
      isRTL,
      taskDetail,
      showCreateTask,
      navigate: (s: Screen) => routerNav(SCREEN_PATH[s]),
      setView: setViewCb,
      setTheme: setThemeCb,
      setPersona: setPersona,
      toggleRTL: toggleRTLcb,
      openTask: (tk: Task) => setTaskDetail(tk),
      closeTask: () => setTaskDetail(null),
      openCreate: () => setShowCreateTask(true),
      closeCreate: () => {
        setShowCreateTask(false)
        setTaskToEdit(null)
      },
      showToast,
      signOut: () => {
        realSignOut()
      },
      goToOnboarding: () => setAuthMode('signup'),
      triggerSessionExpiry: () => {
        realSessionExpiry()
      },
      showConfirm: (c: ConfirmDialogConfig) => setConfirmDialog(c),
      sidebarCollapsed,
      toggleSidebar: toggleSidebarCb,
      setSidebarCollapsed: setSidebarCollapsedCb,
    }),
    [
      brand,
      activeView,
      effectivePersona,
      screen,
      isRTL,
      taskDetail,
      showCreateTask,
      sidebarCollapsed,
      routerNav,
      setViewCb,
      setThemeCb,
      setPersona,
      toggleRTLcb,
      toggleSidebarCb,
      setSidebarCollapsedCb,
      showToast,
      realSignOut,
      realSessionExpiry,
    ],
  )

  const openEditTask = (tk: Task) => {
    setTaskDetail(null)
    setTaskToEdit(tk)
  }

  /* ─── Auth gate ─── */
  if (location.pathname === '/email-change/verify') {
    return <EmailChangeVerificationScreen onComplete={realSignOut} />
  }

  if (authLoading || profileLoading) {
    return <SplashScreen theme={brand} />
  }

  if (!isAuthenticated) {
    return (
      <>
        {authMode === 'signup' ? (
          <OnboardingScreen
            theme={brand}
            onComplete={() => setAuthMode('signin')}
          />
        ) : (
          <AuthScreen
            theme={brand}
            isSessionExpired={isSessionExpired}
            onAuthenticated={() => {
              clearSessionExpired()
              routerNav('/')
            }}
            onCreateAccount={() => setAuthMode('signup')}
          />
        )}
        <ToastContainer toasts={toasts} />
      </>
    )
  }

  return (
    <div
      className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      <Sidebar ctx={ctx} />
      <main className='main-content' id='main-content'>
        <div className='app-topbar'>
          <div className='flex items-center gap-2 md:hidden'>
            <LogoMark size={22} />
            <span className='font-bold text-primary' style={{ fontSize: 15 }}>
              {t('app.name')}
            </span>
          </div>
          <div
            className='top-search flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg min-w-0 flex-1 max-w-[340px] ms-2'
            style={{ background: 'var(--search-bg)', fontSize: 13 }}
          >
            <Icon
              name='search'
              size={16}
              style={{ color: 'var(--t-muted)', flexShrink: 0 }}
            />
            <input
              ref={searchInputRef}
              type='search'
              value={searchQuery}
              aria-label='Search dydan'
              placeholder={t('action.searchPlaceholder')}
              onFocus={() => {
                if (screen !== 'search') routerNav('/search')
              }}
              onChange={e => {
                setSearchQuery(e.target.value)
                if (screen !== 'search') routerNav('/search')
              }}
              onKeyDown={e => {
                if (e.key === 'Escape') searchInputRef.current?.blur()
              }}
              className='min-w-0 flex-1 bg-transparent text-primary outline-none'
              style={{
                border: 'none',
                fontSize: 13,
                fontFamily: 'var(--font-ui)',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                className='btn btn-ghost btn-icon'
                aria-label='Clear search'
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                style={{ padding: 0, width: 22, height: 22, flexShrink: 0 }}
              >
                <Icon name='x' size={13} />
              </button>
            )}
          </div>
          <div className='flex gap-2 ms-auto'>
            <IconButton
              variant='solid'
              color='primary'
              title='new task'
              aria-label='new task'
              onClick={ctx.openCreate}
              sx={{ borderRadius: 'var(--r-md)', flexShrink: 0 }}
            >
              <Icon name='plus' size={18} />
            </IconButton>
            <div className='relative'>
              <IconButton
                variant='plain'
                color='neutral'
                onClick={() => ctx.navigate('notifications')}
              >
                <Icon name='bell' size={18} />
              </IconButton>
              {settingsPreferences?.showItemBadges !== false &&
                unreadCount > 0 && (
                  <span
                    className='absolute top-0.5 end-0.5 w-2 h-2 rounded-full bg-sig-over pointer-events-none'
                    style={{ background: 'var(--sig-over)' }}
                  />
                )}
            </div>
          </div>
        </div>

        <div className='main-scroll'>
          <Routes>
            <Route
              path='/'
              element={
                activeView === 'quest' ? (
                  <QuestHome
                    ctx={ctx}
                    tasks={tasks}
                    isSolo={isSolo}
                    onComplete={completeTask}
                  />
                ) : (
                  <FocusHome
                    ctx={ctx}
                    tasks={tasks}
                    isSolo={isSolo}
                    onComplete={completeTask}
                  />
                )
              }
            />
            <Route
              path='/today'
              element={
                <TodayScreen
                  ctx={ctx}
                  tasks={tasks}
                  onComplete={completeTask}
                />
              }
            />
            <Route
              path='/all-tasks'
              element={
                <AllTasksScreen
                  ctx={ctx}
                  tasks={tasks}
                  onComplete={completeTask}
                />
              }
            />
            <Route
              path='/calendar'
              element={<CalendarScreen ctx={ctx} tasks={tasks} />}
            />
            <Route path='/projects' element={<ProjectsScreen ctx={ctx} />} />
            <Route path='/routines' element={<RoutinesScreen ctx={ctx} />} />
            <Route
              path='/maintenance'
              element={<MaintenanceScreen ctx={ctx} />}
            />
            <Route
              path='/shopping'
              element={<ShoppingScreen ctx={ctx} isSolo={isSolo} />}
            />
            <Route
              path='/goals'
              element={
                <GoalsScreen ctx={ctx} isSolo={isSolo} isChild={isChild} />
              }
            />
            <Route
              path='/activity'
              element={<ActivityScreen ctx={ctx} isSolo={isSolo} />}
            />
            <Route
              path='/notifications'
              element={
                <NotificationsScreen
                  ctx={ctx}
                  readIds={readIds}
                  onMarkRead={id => {
                    setReadIds(prev => new Set(prev).add(id))
                    Fetcher.MarkNotificationRead(id).catch(() => {})
                  }}
                  onMarkAllRead={() => {
                    setReadIds(new Set(notifications.map(n => n.id)))
                    Fetcher.MarkAllNotificationsRead().catch(() => {})
                  }}
                />
              }
            />
            <Route
              path='/rewards'
              element={
                <RewardsScreen ctx={ctx} isChild={isChild} isSolo={isSolo} />
              }
            />
            <Route
              path='/progress'
              element={<ProgressScreen ctx={ctx} tasks={tasks} />}
            />
            <Route
              path='/settings'
              element={<SettingsScreen ctx={ctx} isSolo={isSolo} />}
            />
            <Route
              path='/search'
              element={
                <SearchScreen ctx={ctx} query={searchQuery} tasks={tasks} />
              }
            />
            <Route path='/error' element={<ErrorScreen ctx={ctx} />} />
            <Route path='/offline' element={<OfflineScreen ctx={ctx} />} />
            <Route
              path='/unavailable'
              element={<UnavailableScreen ctx={ctx} />}
            />
            <Route
              path='/permission-denied'
              element={<PermissionDeniedScreen ctx={ctx} />}
            />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </div>
      </main>
      <MobileNav ctx={ctx} />

      {taskDetail && (
        <TaskDetailModal
          task={taskDetail}
          ctx={ctx}
          onComplete={completeTask}
          onDelete={deleteTask}
          onEdit={openEditTask}
          onReopen={reopenTask}
        />
      )}
      {showCreateTask && (
        <CreateTaskModal
          ctx={ctx}
          onCreated={async (title, details) => {
            await mutations.createTask.mutateAsync({
              title,
              description: details?.description,
              priority: priorityNum(details?.priority),
              assigneeId: details?.assigneeId || (currentUser?.id ?? undefined),
              dueDate: details?.dueDate,
              points: details?.points,
              categoryId: details?.categoryId,
            })
          }}
        />
      )}
      {taskToEdit && (
        <CreateTaskModal
          ctx={ctx}
          taskToEdit={taskToEdit}
          onCreated={async (title, details) => {
            await mutations.updateTask.mutateAsync({
              id: taskToEdit.id,
              title,
              assigneeId: details?.assigneeId ?? undefined,
              // The task editor represents a cleared date as an empty string;
              // do not pass that through to the API mutation, where
              // `new Date('')` is invalid and would block an otherwise valid
              // point/category edit.
              dueDate: details?.dueDate || undefined,
              priority: priorityNum(details?.priority),
              points: details?.points,
              categoryId: details?.categoryId,
            })
          }}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          config={confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}
      <ToastContainer toasts={toasts} />
    </div>
  )
}

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
import {
  LEGACY_ROUTE_REDIRECTS,
  MOBILE_NAVIGATION,
  type ModuleDefinition,
  NAVIGATION_GROUPS,
  PATH_SCREEN,
  type Screen,
  SCREEN_PATH,
} from './navigation/moduleRegistry'
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
import { Icon, LogoMark } from './ui/Icon'
import * as Fetcher from './utils/Fetcher'
import { getAccessToken } from './utils/TokenStorage'

/* Types preserved for all existing screens */
export type Theme = Brand
export type View = CtxView
export type { Persona }
export type AppState = 'auth' | 'onboarding' | 'app'
export type { Screen } from './navigation/moduleRegistry'
export { Icon, LogoMark } from './ui/Icon'

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

/* ─── Sidebar (Joy chrome) ───────────── */
function Sidebar({ ctx }: { ctx: AppCtx }) {
  const { t } = useLocalization()
  const { currentUser, members } = useLiveData()
  const isChild = ctx.persona === 'child'
  const isSolo = ctx.persona === 'solo'
  const currentMember = currentUser ?? members[0]

  const renderItem = (item: ModuleDefinition) => {
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
        {NAVIGATION_GROUPS.primary.map(renderItem)}
        <div className='section-label'>{t('nav.organize')}</div>
        {NAVIGATION_GROUPS.organize.map(renderItem)}
        <div className='section-label'>{t('nav.team')}</div>
        {NAVIGATION_GROUPS.space.map(renderItem)}
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
  return (
    <div className='mobile-nav'>
      <div className='flex w-full'>
        {MOBILE_NAVIGATION.map(item => (
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
            {t(item.labelKey)}
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
              path={SCREEN_PATH.today}
              element={
                <TodayScreen
                  ctx={ctx}
                  tasks={tasks}
                  onComplete={completeTask}
                />
              }
            />
            <Route
              path={SCREEN_PATH['all-tasks']}
              element={
                <AllTasksScreen
                  ctx={ctx}
                  tasks={tasks}
                  onComplete={completeTask}
                />
              }
            />
            <Route
              path={SCREEN_PATH.calendar}
              element={<CalendarScreen ctx={ctx} tasks={tasks} />}
            />
            <Route
              path={SCREEN_PATH.projects}
              element={<ProjectsScreen ctx={ctx} />}
            />
            <Route
              path={SCREEN_PATH.routines}
              element={<RoutinesScreen ctx={ctx} />}
            />
            <Route
              path={SCREEN_PATH.assets}
              element={<MaintenanceScreen ctx={ctx} />}
            />
            {Object.entries(LEGACY_ROUTE_REDIRECTS).map(([from, to]) => (
              <Route
                key={from}
                path={from}
                element={<Navigate to={to} replace />}
              />
            ))}
            <Route
              path={SCREEN_PATH.shopping}
              element={<ShoppingScreen ctx={ctx} isSolo={isSolo} />}
            />
            <Route
              path={SCREEN_PATH.goals}
              element={
                <GoalsScreen ctx={ctx} isSolo={isSolo} isChild={isChild} />
              }
            />
            <Route
              path={SCREEN_PATH.activity}
              element={<ActivityScreen ctx={ctx} isSolo={isSolo} />}
            />
            <Route
              path={SCREEN_PATH.notifications}
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
              path={SCREEN_PATH.rewards}
              element={
                <RewardsScreen ctx={ctx} isChild={isChild} isSolo={isSolo} />
              }
            />
            <Route
              path={SCREEN_PATH.progress}
              element={<ProgressScreen ctx={ctx} tasks={tasks} />}
            />
            <Route
              path={SCREEN_PATH.settings}
              element={<SettingsScreen ctx={ctx} isSolo={isSolo} />}
            />
            <Route
              path={SCREEN_PATH.search}
              element={
                <SearchScreen ctx={ctx} query={searchQuery} tasks={tasks} />
              }
            />
            <Route
              path={SCREEN_PATH.error}
              element={<ErrorScreen ctx={ctx} />}
            />
            <Route
              path={SCREEN_PATH.offline}
              element={<OfflineScreen ctx={ctx} />}
            />
            <Route
              path={SCREEN_PATH.unavailable}
              element={<UnavailableScreen ctx={ctx} />}
            />
            <Route
              path={SCREEN_PATH['permission-denied']}
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

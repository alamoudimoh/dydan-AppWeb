import './styles/safe-area.css'

import { Button, LinearProgress, Typography, useColorScheme } from '@mui/joy'
import { Suspense, useCallback, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { hasAppShell } from '@/navigation/appShellModel'
import NavBar from '@/views/components/NavBar'

import { registerCapacitorListeners } from './CapacitorListener'
import PageTransition from './components/animations/PageTransition'
import RequireAuth from './components/auth/RequireAuth'
import ErrorBoundary from './components/ErrorBoundary'
import { ImpersonateUserProvider } from './contexts/ImpersonateUserContext'
import SSEProvider from './contexts/SSEContext'
import { AuthProvider } from './hooks/useAuth.jsx'
import useOnboardingGate from './hooks/useOnboardingGate'
import useStatusBar from './hooks/useStatusBar'
import { useSyncOnReconnect } from './hooks/useSyncOnReconnect'
import { useResource } from './queries/ResourceQueries'
import { GlobalSearchProvider } from './search/GlobalSearchContext'
import { recordRoute } from './service/DiagnosticsSession'
import { useNotification } from './service/NotificationProvider'
import NetworkBanner from './views/components/NetworkBanner'

const add = className => {
  document.getElementById('root').classList.add(className)
}

const remove = className => {
  document.getElementById('root').classList.remove(className)
}

// TODO: Update the interval to at 60 minutes
const intervalMS = 5 * 60 * 1000 // 5 minutes

const AppContent = () => {
  const { showNotification } = useNotification()
  const location = useLocation()
  const shellVisible = hasAppShell(location.pathname)
  // Product Experience 2 is the presentation authority for the application,
  // not only for its direct screen routes.  Keep this wrapper around every
  // route so nested details, settings, authentication, onboarding, loading,
  // offline, and error states resolve the literal PE2 variables and shared
  // primitives rather than falling back to the legacy visual system.
  useSyncOnReconnect()

  // Every route renders through this Outlet, so one listener here gives crash
  // reports the trail that led to the failure.
  useEffect(() => {
    recordRoute(location.pathname)
  }, [location.pathname])

  // First-launch native users see the onboarding flow before anything else.
  const isRedirectingToOnboarding = useOnboardingGate()

  // Initialize status bar with theme-aware configuration
  useStatusBar()

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        const id = setInterval(() => {
          r.update()
        }, intervalMS)
        // Store interval ID for potential cleanup if needed
        if (typeof window !== 'undefined') {
          window.__swUpdateInterval = id
        }
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      showNotification({
        type: 'custom',
        component: (
          <div>
            <Typography level='body-md'>
              A new version is now available. Click on reload button to update.
            </Typography>
            <Button
              color='secondary'
              size='small'
              onClick={() => {
                updateServiceWorker(true)
                setNeedRefresh(false)
              }}
              sx={{ marginInlineStart: 2 }}
            >
              Refresh
            </Button>
          </div>
        ),
        snackbarProps: {
          autoHideDuration: null, // Persistent until user action
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh])

  if (isRedirectingToOnboarding) return null

  return (
    <RequireAuth>
      <div className='pe2'>
        <a href='#main-content' className='skip-link'>
          Skip to content
        </a>
        <ImpersonateUserProvider>
          <NavBar />
          <main
            id='main-content'
            tabIndex={-1}
            className={
              shellVisible
                ? 'main-content figma-route-content'
                : 'figma-route-content'
            }
          >
            <PageTransition>
              {/* Route components are React.lazy chunks; Suspense keeps the shell
                mounted while a page bundle loads. */}
              <ErrorBoundary>
                <Suspense fallback={<LinearProgress />}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </PageTransition>
          </main>
        </ImpersonateUserProvider>
      </div>
    </RequireAuth>
  )
}

function App() {
  const resource = useResource()
  const { mode, systemMode } = useColorScheme()
  const navigate = useNavigate()

  // startOpenReplay()

  const setThemeClass = useCallback(() => {
    let value
    try {
      value = JSON.parse(localStorage.getItem('themeMode')) || mode
    } catch {
      value = mode
    }

    if (value === 'system') {
      if (systemMode === 'dark') {
        return add('dark')
      }
      return remove('dark')
    }

    if (value === 'dark') {
      return add('dark')
    }

    return remove('dark')
  }, [mode, systemMode])

  useEffect(() => {
    setThemeClass()
  }, [setThemeClass])

  useEffect(() => {
    registerCapacitorListeners(navigate)
  }, [navigate])

  return (
    <div>
      <NetworkBanner />

      <AuthProvider>
        <SSEProvider>
          <GlobalSearchProvider>
            <AppContent />
          </GlobalSearchProvider>
        </SSEProvider>
      </AuthProvider>
    </div>
  )
}

export default App

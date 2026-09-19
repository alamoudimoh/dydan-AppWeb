import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AuthState, useAuth } from '../../hooks/useAuth.jsx'
import {
  isPublicAppPath,
  markSessionExpired,
  storeReturnPath,
} from '../../utils/ReturnPath'
import LoadingComponent from '../../views/components/Loading'
import RestorePending from './RestorePending'
import SessionExpired from './SessionExpired'

/**
 * Route boundary for authenticated app surfaces. Public auth/legal routes render
 * outside this guard in App.jsx.
 *
 * The guard waits for the AuthProvider's boot-time session restore (cookie
 * refresh on the web, persisted tokens on native) before deciding whether a
 * visitor may see the protected surface.
 *
 * When restore failed for a transient reason (offline device, unreachable
 * server, secure-storage hiccup) the visitor sees a retryable pending state,
 * not the login screen: a connectivity problem must not be presented as a
 * definitive logout.
 */
const RequireAuth = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { authState, restorePending, sessionExpired } = useAuth()
  const isPublic = isPublicAppPath(location.pathname)

  useEffect(() => {
    if (authState !== AuthState.UNAUTHENTICATED || isPublic) return
    // A signed-in user whose boot restore was definitively rejected stays on
    // the page: the in-place SessionExpired surface (same URL) offers retry
    // and sign-in instead of bouncing the tab to /login.
    if (sessionExpired) return

    markSessionExpired()
    storeReturnPath(`${location.pathname}${location.search}${location.hash}`)
    navigate('/login?session=expired', { replace: true })
  }, [
    authState,
    isPublic,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    sessionExpired,
  ])

  // While restoring (isLoading) or while the login redirect is in flight,
  // show the spinner instead of the protected surface. A pending restore is
  // rendered consistently on any protected route.
  if (authState !== AuthState.AUTHENTICATED && !isPublic) {
    if (restorePending) {
      return <RestorePending />
    }
    if (sessionExpired) {
      return <SessionExpired />
    }
    return <LoadingComponent />
  }

  return children
}

export default RequireAuth

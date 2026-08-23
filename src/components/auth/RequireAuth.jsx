import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth.jsx'
import {
  isPublicAppPath,
  markSessionExpired,
  storeReturnPath,
} from '../../utils/ReturnPath'
import LoadingComponent from '../../views/components/Loading'

/**
 * Route boundary for authenticated app surfaces. Public auth/legal routes render
 * outside this guard in App.jsx.
 *
 * The guard waits for the AuthProvider's boot-time session restore (cookie
 * refresh on the web, persisted tokens on native) before deciding whether a
 * visitor may see the protected surface.
 */
const RequireAuth = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()
  const isPublic = isPublicAppPath(location.pathname)
  const [checkedPath, setCheckedPath] = useState(null)

  useEffect(() => {
    if (isLoading || checkedPath === location.pathname + location.search) return

    if (isPublicAppPath(location.pathname)) {
      setCheckedPath(location.pathname + location.search)
      return
    }

    if (!isAuthenticated) {
      markSessionExpired()
      storeReturnPath(`${location.pathname}${location.search}`)
      navigate('/login?session=expired', { replace: true })
    }
    setCheckedPath(location.pathname + location.search)
  }, [
    isAuthenticated,
    isLoading,
    isPublic,
    checkedPath,
    location.pathname,
    location.search,
    navigate,
  ])

  // While restoring (isLoading) or while the login redirect is in flight,
  // show the spinner instead of the protected surface.
  if (!isAuthenticated && !isPublic) {
    return <LoadingComponent />
  }

  return children
}

export default RequireAuth

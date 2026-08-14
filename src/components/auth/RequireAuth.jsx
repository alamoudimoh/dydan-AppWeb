import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  hasValidSession,
  isPublicAppPath,
  markSessionExpired,
  storeReturnPath,
} from '../../utils/ReturnPath'
import LoadingComponent from '../../views/components/Loading'

/**
 * Route boundary for authenticated app surfaces. Public auth/legal routes render
 * outside this guard in App.jsx.
 */
const RequireAuth = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [ready, setReady] = useState(() => {
    if (typeof window === 'undefined') return true
    const path = window.location.pathname
    return isPublicAppPath(path) || hasValidSession()
  })

  useEffect(() => {
    if (isPublicAppPath(location.pathname)) {
      setReady(true)
      return
    }

    if (hasValidSession()) {
      setReady(true)
      return
    }

    setReady(false)
    markSessionExpired()
    storeReturnPath(`${location.pathname}${location.search}`)
    navigate('/login?session=expired', { replace: true })
  }, [location.pathname, location.search, navigate])

  if (!ready) {
    return <LoadingComponent />
  }

  return children
}

export default RequireAuth

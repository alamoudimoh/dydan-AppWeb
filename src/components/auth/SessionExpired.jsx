import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth.jsx'
import { storeReturnPath } from '../../utils/ReturnPath'

/**
 * Rendered IN PLACE (the URL is untouched) when boot-time session restore
 * reached a definitive verdict (the server rejected the refresh credential)
 * while this device previously had a signed-in user.
 *
 * Refreshing must never bounce the tab away from the page being viewed, so
 * this surface keeps the exact URL. "Try again" re-runs the restore (a
 * server/proxy hiccup can look definitive for a moment); "Sign in again"
 * preserves the current URL as the return path and lands the user back on
 * exactly this page after re-authentication.
 */
const SessionExpired = () => {
  const { retryRestore } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const signInAgain = () => {
    storeReturnPath(`${location.pathname}${location.search}${location.hash}`)
    navigate('/login?session=expired', { replace: true })
  }

  return (
    <div
      role='alert'
      aria-live='assertive'
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
        padding: '1.5rem',
        textAlign: 'center',
      }}
    >
      <h2>Your session expired</h2>
      <p>
        Refreshing could not restore your sign-in on this device. Signing back
        in returns you to this page.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type='button' onClick={() => retryRestore()}>
          Try again
        </button>
        <button type='button' onClick={signInAgain}>
          Sign in again
        </button>
      </div>
    </div>
  )
}

export default SessionExpired

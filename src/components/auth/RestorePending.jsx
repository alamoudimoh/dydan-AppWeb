import { useAuth } from '../../hooks/useAuth.jsx'

/**
 * Rendered when boot-time session restore failed for a transient reason
 * (device offline, server unreachable, secure storage temporarily unreadable)
 * while a refresh credential may still exist. This is deliberately NOT the
 * login screen: representing a connectivity failure as a definitive logout
 * would be wrong, and no protected data is shown until a real refresh
 * succeeds.
 */
const RestorePending = () => {
  const { restorePending, retryRestore } = useAuth()
  const isStorage = restorePending?.reason === 'storage'

  return (
    <div
      role='status'
      aria-live='polite'
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
      <h2>
        {isStorage
          ? 'Secure storage is temporarily unavailable'
          : "You're offline"}
      </h2>
      <p>
        {isStorage
          ? 'Your sign-in could not be restored from secure storage. Your credentials were not changed.'
          : 'Sign-in will resume when your connection is back.'}
      </p>
      <button type='button' onClick={() => retryRestore()}>
        Try again
      </button>
    </div>
  )
}

export default RestorePending

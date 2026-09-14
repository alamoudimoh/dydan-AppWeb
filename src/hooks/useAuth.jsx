import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { apiClient } from '../utils/ApiClient'
import {
  isDefinitiveRefreshFailure,
  isTransientRefreshFailure,
  RefreshFailureKind,
} from '../utils/authErrors'
import { offlineDB } from '../utils/OfflineDB'
import {
  clearAllTokens,
  clearLegacyBrowserTokens,
  getAccessToken,
  getAccessTokenExpiry,
  getLegacyBrowserRefreshToken,
  isNative,
  migrateNativeCredentials,
  saveTokens,
} from '../utils/TokenStorage'

const AuthContext = createContext(null)

export const AuthState = Object.freeze({
  RESTORING: 'restoring',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  // The access token lives in memory on the web (restored via the HttpOnly
  // refresh cookie below); native builds read their persisted copy.
  const [token, setToken] = useState(() => getAccessToken())
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  /**
   * Non-null when boot-time session restore could not complete for a
   * transient reason ({ reason: 'connectivity' | 'storage' }) even though a
   * refresh credential may still exist locally. This is NOT a logout: the
   * user is offered a retry instead of a definitive login screen, and no
   * server-protected data becomes reachable until a real refresh succeeds.
   */
  const [restorePending, setRestorePending] = useState(null)
  const navigate = useNavigate()
  const isAuthenticated = !!token
  const authState =
    isLoading || restorePending
      ? AuthState.RESTORING
      : isAuthenticated
        ? AuthState.AUTHENTICATED
        : AuthState.UNAUTHENTICATED
  // Holds the latest boot-restore routine so retryRestore can re-run it.
  const restoreSessionRef = useRef(null)

  const isTokenExpired = () => {
    const expiry = getAccessTokenExpiry()
    if (!expiry) return false
    return new Date() >= new Date(expiry)
  }

  const clearAuth = async () => {
    setToken(null)
    setUser(null)
    setRestorePending(null)
    await clearAllTokens()
  }

  const establishSession = async data => {
    const accessToken = data.token || data.access_token
    if (!accessToken)
      throw new Error('Authentication response has no access token')
    await saveTokens({
      accessToken,
      accessTokenExpiry: data.expire || data.access_token_expiry,
      refreshToken: data.refresh_token,
      refreshTokenExpiry: data.refresh_token_expiry,
    })
    if (!isNative()) clearLegacyBrowserTokens()
    setRestorePending(null)
    setToken(accessToken)
    return accessToken
  }

  /**
   * Boot-time session establishment for browser/PWA clients:
   *
   * 1. Rotate any legacy localStorage refresh credential, then scrub it only
   *    after the server establishes the HttpOnly cookie.
   * 2. Restore/rotate the session through POST /auth/refresh using the
   *    HttpOnly cookie. A restored page therefore never relies on a
   *    JavaScript-readable credential.
   *
   * Native builds first migrate refresh credentials into OS secure storage,
   * then refresh to repopulate the memory-only access token.
   */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        await apiClient.init()

        const nativePlatform = isNative()

        if (!nativePlatform) {
          // One-time migration from the legacy localStorage token build.
          const legacyRefreshToken = getLegacyBrowserRefreshToken()

          // Restore or rotate through the HttpOnly refresh cookie. A missing
          // cookie simply means "not signed in" - no forced-logout redirect.
          const result = await apiClient.refreshToken({
            allowLogoutFallback: false,
            legacyRefreshToken,
          })
          if (result.success && result.token) clearLegacyBrowserTokens()
          if (
            legacyRefreshToken &&
            !result.success &&
            isDefinitiveRefreshFailure(result.kind)
          ) {
            clearLegacyBrowserTokens()
          }
          if (applyRefreshResult(result)) return
        } else {
          const migration = await migrateNativeCredentials()
          if (migration.status === 'failed') {
            console.error(
              'Native credential migration failed:',
              migration.error,
            )
          }

          const result = await apiClient.refreshToken({
            allowLogoutFallback: false,
          })
          if (applyRefreshResult(result)) return
        }
      } catch (error) {
        console.error('Session restore failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    /**
     * Decide what a failed refresh means for boot state. Definitive failures
     * (auth rejection, expired/absent credential) land logged-out; transient
     * ones (offline, unreachable server, secure-store hiccup) keep a
     * retryable pending state instead of pretending the user signed out.
     */
    const applyRefreshResult = result => {
      if (result.success && result.token) {
        setRestorePending(null)
        setToken(result.token)
        return true
      }
      if (!result.success && isTransientRefreshFailure(result.kind)) {
        setRestorePending({
          reason:
            result.kind === RefreshFailureKind.STORAGE
              ? 'storage'
              : 'connectivity',
        })
      } else {
        setRestorePending(null)
        setToken(null)
      }
      return false
    }

    restoreSessionRef.current = restoreSession
    restoreSession()
    return () => {
      restoreSessionRef.current = null
    }
  }, [])

  /**
   * Retry boot-time session restoration after a transient failure
   * (connectivity came back, secure storage recovered). Never throws;
   * failures simply keep or refresh the pending state.
   */
  const retryRestore = useCallback(async () => {
    const run = restoreSessionRef.current
    if (!run) return { success: false, error: 'restore-unavailable' }
    setRestorePending(null)
    setIsLoading(true)
    try {
      await run()
      return { success: !!getAccessToken() }
    } catch (error) {
      console.error('Session restore retry failed:', error)
      return { success: false, error: error?.message || 'restore-failed' }
    }
  }, [])

  // Deferred refresh when connectivity returns: a boot that failed offline
  // retries automatically instead of stranding the user on a stale screen.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handleOnline = () => {
      if (restorePending?.reason === 'connectivity') {
        retryRestore()
      }
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [restorePending, retryRestore])

  const login = async credentials => {
    setIsLoading(true)
    try {
      // Ensure apiClient is initialized with the correct URL
      await apiClient.init()
      const currentBaseURL = apiClient.getApiURL()

      const nativePlatform = isNative()

      const config = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }

      // Only use credentials for web, not for native apps
      if (!nativePlatform) {
        config.credentials = 'include'
      }

      const response = await fetch(`${currentBaseURL}/auth/login`, config)

      if (!response.ok) {
        const res = await response.json()
        // `status` is passed back so callers can tell a rejected password from
        // an unreachable or broken server without parsing the message.
        return {
          success: false,
          status: response.status,
          error: res?.error || 'Login failed',
        }
      }

      const data = await response.json()
      const userToken = data.token || data.access_token

      if (data.mfaRequired) {
        return { success: true, data }
      }

      if (userToken) {
        try {
          await offlineDB.clearAll()
        } catch (e) {
          console.error('Error clearing offline data on login', e)
        }

        // Use centralized token storage. On the web this keeps the access
        // token in memory only and leaves the refresh credential in the
        // server's HttpOnly cookie.
        await establishSession(data)

        const profileResponse = await apiClient.get('/users/profile')
        if (!profileResponse.ok) {
          await clearAuth()
          return {
            success: false,
            status: profileResponse.status,
            error: 'Login succeeded, but the user profile could not be loaded',
          }
        }

        const profile = await profileResponse.json()
        setUser(profile?.res || null)
      } else {
        return {
          success: false,
          error: 'Login response did not include an access token',
        }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Network error' }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUser = async () => {
    if (!token) return null

    try {
      const response = await apiClient.get('/users/profile')

      if (!response.ok) {
        return null
      }

      const userData = await response.json()
      setUser(userData)
      return userData
    } catch (error) {
      console.error('Fetch user error:', error)
      return null
    }
  }

  const value = useMemo(
    () => ({
      token,
      user,
      authState,
      isLoading,
      isAuthenticated,
      restorePending,
      retryRestore,
      login,
      establishSession,
      fetchUser,
      clearAuth,
    }),
    [
      token,
      user,
      authState,
      isLoading,
      isAuthenticated,
      restorePending,
      retryRestore,
      login,
      establishSession,
      fetchUser,
      clearAuth,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

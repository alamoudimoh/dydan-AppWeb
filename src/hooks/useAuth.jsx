import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiClient } from '../utils/ApiClient'
import { offlineDB } from '../utils/OfflineDB'
import {
  adoptLegacyStoredToken,
  clearAllTokens,
  getAccessToken,
  getAccessTokenExpiry,
  hasAccessToken,
  saveTokens,
} from '../utils/TokenStorage'

const AuthContext = createContext(null)

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
  const navigate = useNavigate()
  const isAuthenticated = !!token

  const isTokenExpired = () => {
    const expiry = getAccessTokenExpiry()
    if (!expiry) return false
    return new Date() >= new Date(expiry)
  }

  const clearAuth = async () => {
    setToken(null)
    setUser(null)
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
    setToken(accessToken)
    return accessToken
  }

  /**
   * Boot-time session establishment for browser/PWA clients:
   *
   * 1. Migrate any legacy localStorage token into the new model and scrub it
   *    from storage immediately (one-time upgrade path).
   * 2. Restore/rotate the session through POST /auth/refresh using the
   *    HttpOnly cookie. A restored page therefore never relies on a
   *    JavaScript-readable credential.
   *
   * Native builds keep reading their persisted tokens synchronously and skip
   * the cookie dance entirely.
   */
  useEffect(() => {
    let cancelled = false
    const restoreSession = async () => {
      try {
        await apiClient.init()

        const isNative =
          typeof window !== 'undefined' &&
          window.Capacitor?.isNativePlatform?.()

        if (!isNative) {
          // One-time migration from the legacy localStorage token build.
          const adopted = adoptLegacyStoredToken()
          if (adopted) {
            console.info(
              'Migrated legacy stored session out of localStorage; rotating credentials',
            )
          }

          // Restore or rotate through the HttpOnly refresh cookie. A missing
          // cookie simply means "not signed in" - no forced-logout redirect.
          const result = await apiClient.refreshToken({
            allowLogoutFallback: false,
          })
          if (cancelled) return
          if (result.success && result.token) {
            setToken(result.token)
          } else if (hasAccessToken()) {
            // Migration adopted a still-valid access token but the refresh
            // rotation failed (e.g. very old server). Keep working until it
            // expires; the next refresh attempt will require a fresh login.
            setToken(getAccessToken())
          } else {
            setToken(null)
          }
        } else if (isNative && !token && hasAccessToken()) {
          setToken(getAccessToken())
        }
      } catch (error) {
        console.error('Session restore failed:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    restoreSession()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async credentials => {
    setIsLoading(true)
    try {
      // Ensure apiClient is initialized with the correct URL
      await apiClient.init()
      const currentBaseURL = apiClient.getApiURL()

      const isNative =
        typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()

      const config = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }

      // Only use credentials for web, not for native apps
      if (!isNative) {
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

  const value = {
    token,
    user,
    isLoading,
    isAuthenticated,
    login,
    establishSession,
    fetchUser,
    clearAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

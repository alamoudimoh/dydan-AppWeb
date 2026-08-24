import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

// Token storage keys
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'token',
  ACCESS_TOKEN_EXPIRY: 'token_expiry',
  REFRESH_TOKEN: 'refresh_token',
  REFRESH_TOKEN_EXPIRY: 'refresh_token_expiry',
}

// Legacy keys written by older builds. They are only ever removed.
const LEGACY_TOKEN_KEYS = ['ca_token', 'ca_expiration', 'access_token']

// Cache platform detection to avoid repeated checks
let _isNativePlatform = null

// Platform detection
const isNativePlatform = () => {
  if (_isNativePlatform === null) {
    try {
      _isNativePlatform =
        typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()
    } catch (error) {
      console.warn('Platform detection failed, defaulting to web:', error)
      _isNativePlatform = false
    }
  }
  return _isNativePlatform
}

// ---------------------------------------------------------------------------
// Browser/PWA credential model
//
// The browser keeps its access token in this module-scope memory ONLY: a page
// reload starts unauthenticated and restores the session through the HttpOnly
// refresh cookie via POST /auth/refresh. Nothing token-like is ever written to
// localStorage/sessionStorage/IndexedDB on the web. Native builds keep their
// established contract (localStorage access token + Capacitor Preferences
// refresh token), which lives in an app-private WebView storage.
// ---------------------------------------------------------------------------

let memoryAccessToken = null
let memoryAccessTokenExpiry = null

/**
 * Synchronously read the current access token.
 * Web: module memory. Native: localStorage.
 */
export const getAccessToken = () => {
  if (!isNativePlatform()) {
    return memoryAccessToken
  }
  try {
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
  } catch {
    return null
  }
}

/**
 * Synchronously read the current access-token expiry (ISO string or null).
 */
export const getAccessTokenExpiry = () => {
  if (!isNativePlatform()) {
    return memoryAccessTokenExpiry
  }
  try {
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN_EXPIRY)
  } catch {
    return null
  }
}

export const hasAccessToken = () => Boolean(getAccessToken())

/**
 * Store just the browser-side access credential (memory on web,
 * localStorage on native). Refresh credentials never pass through here on
 * the web — they live in the server's HttpOnly cookie.
 */
export const setAccessToken = ({ accessToken, accessTokenExpiry }) => {
  if (!accessToken) {
    return
  }
  if (isNativePlatform()) {
    try {
      localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken)
      if (accessTokenExpiry) {
        localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN_EXPIRY, accessTokenExpiry)
      }
    } catch (error) {
      console.error('Error persisting access token:', error)
    }
    return
  }
  memoryAccessToken = accessToken
  memoryAccessTokenExpiry = accessTokenExpiry || null
}

// Track if we're currently clearing tokens to prevent race conditions
let clearingTokens = false

/**
 * Save tokens based on platform.
 * Web: access token in memory only (refresh handled by HttpOnly cookie).
 * Native: access token in localStorage + refresh token in Capacitor Preferences.
 */
export const saveTokens = async ({
  accessToken,
  accessTokenExpiry,
  refreshToken,
  refreshTokenExpiry,
}) => {
  setAccessToken({ accessToken, accessTokenExpiry })

  if (!Capacitor.isNativePlatform()) {
    // Web: the refresh credential stays in the HttpOnly cookie set by the
    // server. Never persist it client-side.
    return
  }

  // On native platforms, also save refresh tokens to Capacitor Preferences
  try {
    if (refreshToken) {
      await Preferences.set({
        key: TOKEN_KEYS.REFRESH_TOKEN,
        value: refreshToken,
      })
    }
    if (refreshTokenExpiry) {
      await Preferences.set({
        key: TOKEN_KEYS.REFRESH_TOKEN_EXPIRY,
        value: refreshTokenExpiry,
      })
    }
  } catch (error) {
    console.error(
      'Failed to save refresh tokens to Capacitor Preferences:',
      error,
    )
    // Don't throw - access token is still saved
  }
}

/**
 * Get refresh token from storage
 * Web: Returns null (uses HTTP-only cookies)
 * Native: Returns from Capacitor Preferences
 */
export const getRefreshToken = async () => {
  if (!isNativePlatform()) {
    return null // Web uses HTTP-only cookies
  }

  try {
    const { value } = await Preferences.get({ key: TOKEN_KEYS.REFRESH_TOKEN })
    return value
  } catch (error) {
    console.error('Error reading refresh token from Preferences:', error)
    return null
  }
}

/**
 * Get refresh token expiry from storage
 * Web: Returns null (uses HTTP-only cookies)
 * Native: Returns from Capacitor Preferences
 */
export const getRefreshTokenExpiry = async () => {
  if (!isNativePlatform()) {
    return null // Web uses HTTP-only cookies
  }

  try {
    const { value } = await Preferences.get({
      key: TOKEN_KEYS.REFRESH_TOKEN_EXPIRY,
    })
    return value
  } catch (error) {
    console.error('Error reading refresh token expiry from Preferences:', error)
    return null
  }
}

/**
 * Check if refresh token is expired
 * Web: Returns false (backend handles cookie expiration)
 * Native: Checks expiry from Capacitor Preferences
 */
export const isRefreshTokenExpired = async () => {
  if (!isNativePlatform()) {
    return false // Web uses cookies, backend handles expiration
  }

  const expiry = await getRefreshTokenExpiry()
  if (!expiry) {
    return true // No expiry means no token
  }

  try {
    const expiryDate = new Date(expiry)
    if (isNaN(expiryDate.getTime())) {
      console.error('Invalid refresh token expiry date:', expiry)
      return true // Treat invalid date as expired
    }
    return new Date() >= expiryDate
  } catch (error) {
    console.error('Error parsing refresh token expiry:', error)
    return true // Treat parse error as expired
  }
}

/**
 * Clear all tokens from all storage locations.
 * Idempotent - safe to call multiple times.
 *
 * On every platform this also removes legacy localStorage keys so sessions
 * migrated from old builds leave no duplicated persistent credentials behind.
 */
export const clearAllTokens = async () => {
  if (clearingTokens) {
    return // Already clearing, don't run concurrently
  }

  clearingTokens = true

  try {
    // Always scrub localStorage of anything token-shaped (legacy cleanup).
    const keysToRemove = [
      TOKEN_KEYS.ACCESS_TOKEN,
      TOKEN_KEYS.ACCESS_TOKEN_EXPIRY,
      TOKEN_KEYS.REFRESH_TOKEN,
      TOKEN_KEYS.REFRESH_TOKEN_EXPIRY,
      ...LEGACY_TOKEN_KEYS,
    ]
    for (const key of keysToRemove) {
      try {
        localStorage.removeItem(key)
      } catch {
        // storage unavailable - nothing to clean
      }
    }

    memoryAccessToken = null
    memoryAccessTokenExpiry = null

    // Clear Capacitor Preferences on native
    if (isNativePlatform()) {
      try {
        await Preferences.remove({ key: TOKEN_KEYS.REFRESH_TOKEN })
        await Preferences.remove({ key: TOKEN_KEYS.REFRESH_TOKEN_EXPIRY })
      } catch (error) {
        console.error('Error clearing tokens from Preferences:', error)
      }
    }
  } catch (error) {
    console.error('Error clearing tokens:', error)
  } finally {
    clearingTokens = false
  }
}

/**
 * One-time migration for users upgrading from the legacy build that kept the
 * access token in localStorage. The token is adopted into the correct
 * runtime location (memory on web, unchanged on native) and then removed
 * from localStorage so no duplicate persistent copy survives. Callers should
 * follow up with a refresh request to rotate into a fresh cookie-backed
 * session where possible.
 *
 * Returns the adopted token, or null when there was nothing to migrate.
 */
export const adoptLegacyStoredToken = () => {
  let legacyToken = null
  let legacyExpiry = null
  try {
    legacyToken = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
    legacyExpiry = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN_EXPIRY)
  } catch {
    return null
  }

  if (!isNativePlatform()) {
    try {
      localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN_EXPIRY)
      for (const key of LEGACY_TOKEN_KEYS) {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('Failed to remove legacy refresh token storage:', error)
    }
  }
  if (!legacyToken) {
    return null
  }

  if (isNativePlatform()) {
    // Native already persists by design; nothing to move.
    return legacyToken
  }

  memoryAccessToken = legacyToken
  memoryAccessTokenExpiry = legacyExpiry

  // Remove the legacy copies immediately after successful adoption so we
  // never hold two persistent credentials.
  try {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN_EXPIRY)
  } catch (error) {
    console.error('Failed to remove legacy token storage:', error)
  }
  return legacyToken
}

/**
 * Export platform detection helper
 */
export const isNative = isNativePlatform

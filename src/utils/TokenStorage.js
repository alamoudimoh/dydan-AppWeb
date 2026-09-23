import { SecureStorage } from '@aparajita/capacitor-secure-storage'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

import {
  migrateNativeCredentialStorage,
  NATIVE_CREDENTIAL_KEYS,
  NativeCredentialErrorCode,
  NativeCredentialStorageError,
  persistNativeRefreshCredentials,
  readNativeRefreshCredential,
} from './NativeCredentialStorage.js'

// Token storage keys
const TOKEN_KEYS = {
  ACCESS_TOKEN: NATIVE_CREDENTIAL_KEYS.accessToken,
  ACCESS_TOKEN_EXPIRY: NATIVE_CREDENTIAL_KEYS.accessTokenExpiry,
  REFRESH_TOKEN: NATIVE_CREDENTIAL_KEYS.refreshToken,
  REFRESH_TOKEN_EXPIRY: NATIVE_CREDENTIAL_KEYS.refreshTokenExpiry,
}

// Legacy keys written by older builds. They are only ever removed.
const LEGACY_TOKEN_KEYS = ['ca_token', 'ca_expiration', 'access_token']

const BROWSER_LEGACY_KEYS = [
  TOKEN_KEYS.ACCESS_TOKEN,
  TOKEN_KEYS.ACCESS_TOKEN_EXPIRY,
  TOKEN_KEYS.REFRESH_TOKEN,
  TOKEN_KEYS.REFRESH_TOKEN_EXPIRY,
  ...LEGACY_TOKEN_KEYS,
]

// Cache platform detection to avoid repeated checks
let _isNativePlatform = null

// Platform detection
const isNativePlatform = () => {
  if (_isNativePlatform === null) {
    try {
      _isNativePlatform = Capacitor.isNativePlatform()
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
// localStorage/sessionStorage/IndexedDB on the web. Native access tokens use
// the same memory-only model, while refresh credentials use OS secure storage.
// ---------------------------------------------------------------------------

let memoryAccessToken = null
let memoryAccessTokenExpiry = null

// Minimal change-notification channel so providers that gate their queries on
// token presence (e.g. LiveDataProvider, mounted above the auth gate) can
// re-render when credentials are stored/cleared. React Query re-evaluates
// each query's `enabled` option on render, so a single re-render is enough.
const tokenListeners = new Set()
let tokenVersion = 0
const notifyTokenChange = () => {
  tokenVersion += 1
  for (const listener of tokenListeners) listener(tokenVersion)
}

/** Subscribe to access-token lifecycle changes. Returns an unsubscribe fn. */
export const subscribeTokenChanges = listener => {
  tokenListeners.add(listener)
  return () => {
    tokenListeners.delete(listener)
  }
}

/** Monotonic version bumped on every save/clear of the access credential. */
export const getTokenVersion = () => tokenVersion

/**
 * Synchronously read the current access token.
 * Web and native: module memory.
 */
export const getAccessToken = () => memoryAccessToken

/**
 * Synchronously read the current access-token expiry (ISO string or null).
 */
export const getAccessTokenExpiry = () => memoryAccessTokenExpiry

export const hasAccessToken = () => Boolean(getAccessToken())

/**
 * Store the access credential in memory on every platform. Refresh credentials
 * never pass through here on the web; they live in the HttpOnly cookie.
 */
export const setAccessToken = ({ accessToken, accessTokenExpiry }) => {
  if (!accessToken) {
    return
  }
  memoryAccessToken = accessToken
  memoryAccessTokenExpiry = accessTokenExpiry || null
  notifyTokenChange()
}

// Track if we're currently clearing tokens to prevent race conditions
let clearingTokens = false

/**
 * Save tokens based on platform.
 * Web: access token in memory only (refresh handled by HttpOnly cookie).
 * Native: access token in memory + refresh token and expiry in secure storage.
 */
export const saveTokens = async ({
  accessToken,
  accessTokenExpiry,
  refreshToken,
  refreshTokenExpiry,
}) => {
  if (!Capacitor.isNativePlatform()) {
    // Web: the refresh credential stays in the HttpOnly cookie set by the
    // server. Never persist it client-side.
    setAccessToken({ accessToken, accessTokenExpiry })
    return { status: 'saved-memory' }
  }

  if (!accessToken) {
    throw new NativeCredentialStorageError(
      NativeCredentialErrorCode.INVALID_CREDENTIALS,
      'Native authentication response has no access token',
    )
  }
  await persistNativeRefreshCredentials(SecureStorage, {
    refreshToken,
    refreshTokenExpiry,
  })
  setAccessToken({ accessToken, accessTokenExpiry })
  legacyRefreshFallbackEnabled = false
  return { status: 'saved-secure' }
}

let legacyRefreshFallbackEnabled = false

/**
 * Get refresh token from storage
 * Web: Returns null (uses HTTP-only cookies)
 * Native: Returns from secure storage. An intact Preferences value is only
 * available after a failed migration, for the upgrade recovery window.
 */
export const getRefreshToken = async () => {
  if (!isNativePlatform()) {
    return null // Web uses HTTP-only cookies
  }

  try {
    const value = await readNativeRefreshCredential(
      SecureStorage,
      TOKEN_KEYS.REFRESH_TOKEN,
    )
    if (value || !legacyRefreshFallbackEnabled) return value
  } catch (error) {
    if (!legacyRefreshFallbackEnabled) throw error
  }
  const { value } = await Preferences.get({ key: TOKEN_KEYS.REFRESH_TOKEN })
  return value
}

/**
 * Get refresh token expiry from storage
 * Web: Returns null (uses HTTP-only cookies)
 * Native: Returns from secure storage, with migration-only legacy fallback.
 */
export const getRefreshTokenExpiry = async () => {
  if (!isNativePlatform()) {
    return null // Web uses HTTP-only cookies
  }

  try {
    const value = await readNativeRefreshCredential(
      SecureStorage,
      TOKEN_KEYS.REFRESH_TOKEN_EXPIRY,
    )
    if (value || !legacyRefreshFallbackEnabled) return value
  } catch (error) {
    if (!legacyRefreshFallbackEnabled) throw error
  }
  const { value } = await Preferences.get({
    key: TOKEN_KEYS.REFRESH_TOKEN_EXPIRY,
  })
  return value
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
    for (const key of BROWSER_LEGACY_KEYS) {
      try {
        localStorage.removeItem(key)
      } catch {
        // storage unavailable - nothing to clean
      }
    }

    memoryAccessToken = null
    memoryAccessTokenExpiry = null
    notifyTokenChange()

    const errors = []
    if (isNativePlatform()) {
      const removals = await Promise.allSettled([
        SecureStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN),
        SecureStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN_EXPIRY),
        Preferences.remove({ key: TOKEN_KEYS.REFRESH_TOKEN }),
        Preferences.remove({ key: TOKEN_KEYS.REFRESH_TOKEN_EXPIRY }),
      ])
      for (const removal of removals) {
        if (removal.status === 'rejected') errors.push(removal.reason)
      }
    }
    legacyRefreshFallbackEnabled = false
    return { status: errors.length ? 'partial' : 'cleared', errors }
  } catch (error) {
    console.error('Error clearing tokens:', error)
  } finally {
    clearingTokens = false
  }
}

/**
 * One-time migration for users upgrading from the legacy build that kept the
 * access token in localStorage. The token is adopted into the correct
 * runtime location (memory on web, unchanged on native). The caller removes
 * the shipped legacy copy only after the refresh credential has successfully
 * rotated into an HttpOnly cookie, so a transient restore failure cannot
 * destroy the user's only session.
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

  if (!legacyToken) {
    return null
  }

  if (isNativePlatform()) return null

  memoryAccessToken = legacyToken
  memoryAccessTokenExpiry = legacyExpiry

  return legacyToken
}

export const getLegacyBrowserRefreshToken = () => {
  if (isNativePlatform()) return null
  try {
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN)
  } catch {
    return null
  }
}

export const clearLegacyBrowserTokens = () => {
  if (isNativePlatform()) return
  try {
    for (const key of BROWSER_LEGACY_KEYS) localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to remove migrated browser credentials:', error)
  }
}

export const migrateNativeCredentials = async () => {
  if (!isNativePlatform()) {
    return { status: 'not-native', canUseLegacyRefresh: false }
  }

  const result = await migrateNativeCredentialStorage({
    secureStore: SecureStorage,
    preferences: Preferences,
    localStorage: typeof localStorage === 'undefined' ? null : localStorage,
  })
  legacyRefreshFallbackEnabled = result.canUseLegacyRefresh

  if (result.status === 'failed' && result.accessToken) {
    memoryAccessToken = result.accessToken
    memoryAccessTokenExpiry = result.accessTokenExpiry || null
  }
  return result
}

export { NativeCredentialStorageError }

/**
 * Export platform detection helper
 */
export const isNative = isNativePlatform

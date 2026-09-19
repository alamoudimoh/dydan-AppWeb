import { Preferences } from '@capacitor/preferences'

import { API_URL } from '../Config'
import { networkManager } from '../hooks/NetworkManager'
import {
  recordApiFailure,
  recordServerVersionFromResponse,
} from '../service/DiagnosticsSession'
import { syncActiveCircleId } from './ActiveCircle'
import {
  classifyRefreshStatus,
  classifyRefreshThrow,
  isDefinitiveRefreshFailure,
  RefreshFailureKind as REFRESH_FAILURE_KIND,
} from './authErrors'
import { logout, RefreshToken } from './Fetcher'
import { isOAuthExchangeInProgress } from './OAuthExchangeState'
import { offlineDB } from './OfflineDB'
import {
  getCurrentReturnPath,
  markSessionExpired,
  storeReturnPath,
} from './ReturnPath'
import { clearSignedIn } from './SessionPresence'
import {
  clearAllTokens,
  getAccessToken,
  getAccessTokenExpiry,
  isNative,
  isRefreshTokenExpired,
  saveTokens,
} from './TokenStorage'

const OAUTH_EXCHANGE_IN_PROGRESS = 'OAuth exchange in progress'

class ApiClient {
  constructor() {
    this.customServerURL = `${API_URL}/api/v1`
    this.isRefreshing = false
    this.failedQueue = []
    this.lastRefreshTime = 0
    this.refreshCooldown = 3 * 1000 // 3 seconds in milliseconds
    this.refreshPromise = null // single-flight refresh handle
  }

  async init(force = false) {
    if (this.initPromise && !force) {
      return this.initPromise
    }

    if (this.initialized && !force) {
      return Promise.resolve()
    }

    this.initPromise = this._doInit().finally(() => {
      this.initPromise = null
    })
    return this.initPromise
  }

  async _doInit() {
    const { value: serverURL } = await Preferences.get({
      key: 'customServerUrl',
    })

    // During browser development, keep API traffic on the same origin and let
    // Vite proxy it to the backend. This avoids client-side port filtering and
    // mixed-content/CORS failures while native and production builds retain
    // their configured or user-selected server URL.
    const developmentURL =
      import.meta.env.DEV && typeof window !== 'undefined'
        ? window.location.origin
        : null
    this.customServerURL = `${developmentURL || serverURL || API_URL}/api/v1`
    this.initialized = true
  }
  getApiURL() {
    return this.customServerURL
  }

  useDefaultServer() {
    this.customServerURL = `${API_URL}/api/v1`
    this.initialized = true
  }

  /**
   * Refresh the access credential. Single-flight: concurrent callers share
   * one in-flight request so parallel 401s can never trigger two rotations.
   *
   * @param {object} [options]
   * @param {boolean} [options.allowLogoutFallback] When false (session restore
   *   at boot), a failed refresh just reports failure instead of tearing the
   *   app down with a forced logout redirect.
   */
  refreshToken(options = {}) {
    // No session exists yet while an OAuth code exchange is in flight, so there
    // is nothing to refresh. Callers must treat this as a non-fatal failure
    // (see request()) rather than an expired session.
    if (isOAuthExchangeInProgress()) {
      return Promise.resolve({
        success: false,
        error: OAUTH_EXCHANGE_IN_PROGRESS,
      })
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this._doRefresh(options).finally(() => {
        this.refreshPromise = null
      })
    }
    return this.refreshPromise
  }

  async _doRefresh(options = {}) {
    const allowLogoutFallback = options.allowLogoutFallback !== false

    // Check if refresh token is expired BEFORE attempting refresh (native only;
    // web relies on the server rejecting the cookie). A secure-store read
    // failure here must not escape as an unhandled rejection: it is a
    // transient device/storage condition, so report it as such and leave all
    // credentials untouched.
    let refreshExpired = false
    try {
      refreshExpired = await isRefreshTokenExpired()
    } catch (storageError) {
      console.error(
        'Secure storage unreadable while checking refresh expiry:',
        storageError,
      )
      return {
        success: false,
        kind: classifyRefreshThrow(storageError),
        error: storageError.message || 'Refresh credential unreadable',
      }
    }
    if (refreshExpired) {
      console.log('Refresh token expired, forcing logout')
      if (allowLogoutFallback) {
        await this.handleLogout()
      }
      return {
        success: false,
        kind: REFRESH_FAILURE_KIND.EXPIRED,
        error: 'Refresh token expired',
      }
    }

    try {
      let refreshReq = await RefreshToken(options.legacyRefreshToken)

      // A rejected migration token must not mask a newer valid cookie.
      if (
        options.legacyRefreshToken &&
        [400, 401, 403].includes(refreshReq.status)
      ) {
        refreshReq = await RefreshToken()
      }

      // A parallel browser tab may have won rotation. The server deliberately
      // issues no credentials to this stale request; retry against the shared
      // successor cookie after the winning response has landed.
      for (let retry = 0; refreshReq.status === 409 && retry < 3; retry += 1) {
        await new Promise(resolve => setTimeout(resolve, 50))
        refreshReq = await RefreshToken()
      }

      if (refreshReq.ok) {
        const data = await refreshReq.json()
        const newToken = data.token || data.access_token

        // Save all tokens including rotated refresh token. On the web the
        // access token lands in memory and the rotated refresh token stays in
        // the HttpOnly cookie the response carries.
        await saveTokens({
          accessToken: newToken,
          accessTokenExpiry: data.expire || data.access_token_expiry,
          refreshToken: data.refresh_token,
          refreshTokenExpiry: data.refresh_token_expiry,
        })

        // Update last refresh time
        this.lastRefreshTime = Date.now()
        this.isRefreshing = false

        return { success: true, token: newToken }
      } else {
        const kind = classifyRefreshStatus(refreshReq.status)
        // Only definitive verdicts tear the session down; transient server
        // trouble leaves the (server-enforced) session state untouched.
        if (allowLogoutFallback && isDefinitiveRefreshFailure(kind)) {
          await this.handleLogout()
        }
        return { success: false, kind, error: 'Refresh failed' }
      }
    } catch (error) {
      return {
        success: false,
        kind: classifyRefreshThrow(error),
        error: error.message,
      }
    } finally {
      this.isRefreshing = false
    }
  }

  getToken() {
    return getAccessToken()
  }

  getTokenExpiry() {
    return getAccessTokenExpiry()
  }

  getHeaders(customHeaders = {}) {
    const headers = {
      ...customHeaders,
    }
    const token = this.getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const impersonateUserId = localStorage.getItem('impersonatedUserId')
    if (impersonateUserId) {
      headers['X-Impersonate-User-ID'] = impersonateUserId
    }

    return headers
  }

  // Process queued requests after refresh attempt
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ reject, resolve }) => {
      if (error) {
        reject(error)
      } else {
        resolve(token)
      }
    })

    this.failedQueue = []
  }

  // Helper to avoid repeating cleanup code
  async handleLogout() {
    // Backstop for every forced-logout path: never tear down the session while
    // an OAuth exchange is running, or we clear the tokens it just saved and
    // reload the page out from under it.
    if (isOAuthExchangeInProgress()) {
      console.log('Skipping forced logout: OAuth exchange in progress')
      return
    }

    // An expired session on an invite link would otherwise drop the code on the
    // way to /login. Stash it first so sign-in returns to the join.
    try {
      const { pathname, search } = window.location
      if (pathname === '/circle/join') {
        const code = new URLSearchParams(search).get('code')
        if (code) {
          const { setPendingInvite } = await import('./PendingInvite')
          setPendingInvite(code)
        }
      }
    } catch (e) {
      console.error('Error preserving pending invite on logout', e)
    }

    // Revoke while native still has its body refresh credential and the web
    // still has its HttpOnly cookie. Local cleanup follows even if offline.
    try {
      await logout()
    } catch (e) {
      console.error('Error during logout', e)
    }

    await clearAllTokens()
    clearSignedIn()
    syncActiveCircleId(null)
    try {
      await offlineDB.clearAll()
    } catch (e) {
      console.error('Error clearing offline data on logout', e)
    }
    try {
      // Dynamic import sidesteps the ApiClient <-> ImageCache module cycle
      const { clearImageCache } = await import('./ImageCache')
      await clearImageCache()
    } catch (e) {
      console.error('Error clearing image cache on logout', e)
    }
    try {
      // Dynamic import sidesteps the ApiClient <-> WidgetService module cycle
      const { clearWidgetData } = await import('../service/WidgetService')
      await clearWidgetData()
    } catch (e) {
      console.error('Error clearing widget data on logout', e)
    }
    if (window.location.pathname !== '/login') {
      markSessionExpired()
      storeReturnPath(getCurrentReturnPath())
      window.location.href = '/login?session=expired'
    }
    // fire and forget
  }
  async request(endpoint, options = {}) {
    await this.init()
    const url = `${this.customServerURL}${endpoint}`

    // Abort after 10s so a dead/unreachable server doesn't hang the UI
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)

    const config = {
      ...options,
      headers: this.getHeaders(options.headers),
      signal: options.signal ?? controller.signal,
    }
    if (!isNative() && config.credentials === undefined) {
      config.credentials = 'include'
    }

    try {
      // 1. Initial Request
      let response = await fetch(url, config)
      clearTimeout(timeoutId)

      // Passive diagnostics: learn the server build from whatever it already
      // answers, and keep the last few refusals for crash reports.
      recordServerVersionFromResponse(response)
      if (!response.ok) {
        recordApiFailure({
          endpoint,
          method: config.method,
          status: response.status,
        })
      }

      // 2. Check for 401 (Unauthorized)
      if (response.status === 401) {
        // Always queue this request first
        const queuedPromise = new Promise((resolve, reject) => {
          this.failedQueue.push({
            resolve: async token => {
              if (!token) {
                reject(new Error('Token refresh failed'))
                return
              }
              try {
                const newHeaders = this.getHeaders(options?.headers)
                const retryConfig = {
                  ...config,
                  headers: newHeaders,
                }
                const retryResponse = await fetch(url, retryConfig)
                resolve(retryResponse)
              } catch (error) {
                reject(error)
              }
            },
            reject,
          })
        })

        // Single-flight: every parallel 401 shares one refresh request, so a
        // rotated refresh token can never be double-spent by racing requests.
        const refreshResult = await this.refreshToken()

        if (refreshResult.success) {
          // Process queue with success - this will retry all queued requests
          this.processQueue(null, refreshResult.token)
          return queuedPromise
        }

        if (refreshResult.error === OAUTH_EXCHANGE_IN_PROGRESS) {
          // Expected 401: the code exchange hasn't produced tokens yet. Fail
          // just this request — logging out here would wipe storage and hard
          // navigate to /login, aborting the exchange fetch mid-flight.
          queuedPromise.catch(() => {}) // not returned below; keep it handled
          this.processQueue(new Error(refreshResult.error), null)
          return response
        }

        // Actual refresh failure - the forced-logout side effect already ran
        // inside refreshToken (when allowed).
        this.processQueue(new Error(refreshResult.error), null)
        return null
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      // fetch() threw = network-level failure or timeout — mark server
      // unreachable. Caller-initiated aborts (component unmount, query
      // cancellation) say nothing about server health, so skip those.
      const externalAbort =
        error?.name === 'AbortError' && options.signal?.aborted
      if (!externalAbort) {
        networkManager.setServerUnreachable()
        recordApiFailure({ endpoint, method: config.method, status: 'network' })
      }
      console.error('Request failed', error)
      throw error
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  async post(endpoint, data, options = {}) {
    options.headers = options.headers || {}
    if (!options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json'
    }

    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? data : undefined,
    })
  }

  async put(endpoint, data, options = {}) {
    options.headers = options.headers || {}
    if (!options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json'
    }
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? data : undefined,
    })
  }

  async delete(endpoint, options = {}) {
    options.headers = options.headers || {}
    if (!options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json'
    }
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }

  async upload(endpoint, formData, options = {}) {
    const headers = options.headers || {}
    delete headers['Content-Type']

    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers,
    })
  }

  getAssetURL(path) {
    return `${this.customServerURL}/assets/${path}`
  }
}

export const apiClient = new ApiClient()

import Cookies from 'js-cookie'

import { getAccessToken, getAccessTokenExpiry } from './TokenStorage.js'

// Shared with PendingInvite OAuth round-trips; one cookie for all post-auth redirects.
export const RETURN_PATH_COOKIE = 'ca_redirect'

const AUTH_ONLY_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/password/update',
  '/auth/',
  '/welcome',
  '/onboarding',
  '/get-started',
  '/ready',
]

/**
 * Accepts only same-app relative paths so a stored return URL cannot become an
 * open redirect.
 */
export const isSafeInternalPath = path => {
  if (!path || typeof path !== 'string') return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.includes('://')) return false

  const pathname = path.split('?')[0].split('#')[0]
  return !AUTH_ONLY_PREFIXES.some(
    prefix =>
      pathname === prefix ||
      (prefix.endsWith('/') && pathname.startsWith(prefix)),
  )
}

export const getCurrentReturnPath = () => {
  if (typeof window === 'undefined') return ''
  return `${window.location.pathname}${window.location.search}`
}

export const storeReturnPath = path => {
  const candidate = path || getCurrentReturnPath()
  const safe = isSafeInternalPath(candidate) ? candidate : '/chores'
  Cookies.set(RETURN_PATH_COOKIE, safe, { expires: 1 })
  try {
    sessionStorage.setItem('return_path_pending', safe)
  } catch {
    // Storage may be unavailable in some webviews.
  }
  return safe
}

export const consumeReturnPath = (fallback = '/chores') => {
  let path = null
  try {
    path = sessionStorage.getItem('return_path_pending')
    sessionStorage.removeItem('return_path_pending')
  } catch {
    // Ignore unavailable storage.
  }

  const fromCookie = Cookies.get(RETURN_PATH_COOKIE)
  if (fromCookie) Cookies.remove(RETURN_PATH_COOKIE)

  const chosen = path || fromCookie
  return isSafeInternalPath(chosen) ? chosen : fallback
}

export const markSessionExpired = () => {
  try {
    sessionStorage.setItem('session_expired', '1')
  } catch {
    // Ignore unavailable storage.
  }
}

export const wasSessionExpired = () => {
  try {
    return sessionStorage.getItem('session_expired') === '1'
  } catch {
    return false
  }
}

export const clearSessionExpired = () => {
  try {
    sessionStorage.removeItem('session_expired')
  } catch {
    // Ignore unavailable storage.
  }
}

export const isPublicAppPath = pathname => {
  if (!pathname) return true
  const publicExact = [
    '/login',
    '/signup',
    '/forgot-password',
    '/password/update',
    '/login/settings',
    '/welcome',
    '/onboarding',
    '/get-started',
    '/ready',
    '/circle/join',
    '/privacy',
    '/terms',
    '/landing',
  ]
  if (publicExact.includes(pathname)) return true
  if (pathname.startsWith('/auth/')) return true
  if (pathname.startsWith('/payments/')) return true
  return false
}

export const hasValidSession = () => {
  const token = getAccessToken()
  if (!token) return false
  const expiry = getAccessTokenExpiry()
  if (!expiry) return true
  const expiryDate = new Date(expiry)
  if (Number.isNaN(expiryDate.getTime())) return true
  return new Date() < expiryDate
}

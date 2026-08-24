import * as Sentry from '@sentry/react'

/**
 * Sentry frontend error-monitoring baseline (Phase 6.3).
 *
 * Deliberately conservative: the SDK is only initialised when a DSN is
 * provided, traces default to off, Session Replay and profiling are not
 * enabled, and user-identifying PII is scrubbed by default. With no DSN the
 * app behaves exactly as it did before Sentry was installed.
 */

const DEFAULT_TRACES_SAMPLE_RATE = 0

const SENSITIVE_FIELD_NAMES = [
  'password',
  'secret',
  'token',
  'authorization',
  'cookie',
  'apikey',
  'clientid',
]

const normalizeKey = key =>
  String(key)
    .toLowerCase()
    .replace(/[^a-z]/g, '')

const isSensitiveKey = key => {
  const normalized = normalizeKey(key)
  return SENSITIVE_FIELD_NAMES.some(name => normalized.includes(name))
}

const scrub = value => {
  if (Array.isArray(value)) return value.map(scrub)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !isSensitiveKey(key))
        .map(([key, entry]) => [key, scrub(entry)]),
    )
  }
  return value
}

const sanitizeUrl = value => {
  if (!value) return value
  try {
    const parsed = new URL(value, window.location.origin)
    for (const key of [
      'code',
      'state',
      'token',
      'access_token',
      'refresh_token',
    ]) {
      parsed.searchParams.delete(key)
    }
    return parsed.toString()
  } catch {
    return String(value).split('?')[0]
  }
}

/**
 * Centralized beforeSend sanitizer: drops obviously sensitive fields already
 * known in this app (auth tokens, authorization headers, cookies, passwords)
 * from request headers, extras, and contexts, and never attaches the user by
 * default. Not a generic redaction framework.
 */
export const sanitizeSentryEvent = event => {
  if (!event) return event
  const scrubbed = { ...event }
  if (scrubbed.request?.headers) {
    scrubbed.request = {
      ...scrubbed.request,
      headers: Object.fromEntries(
        Object.entries(scrubbed.request.headers).filter(
          ([key]) => !isSensitiveKey(key),
        ),
      ),
    }
  }
  if (scrubbed.request?.url) {
    scrubbed.request = {
      ...scrubbed.request,
      url: sanitizeUrl(scrubbed.request.url),
    }
  }
  if (scrubbed.breadcrumbs) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.map(crumb => {
      if (!crumb.data) return crumb
      const data = { ...crumb.data }
      for (const key of ['url', 'from', 'to']) {
        if (data[key]) data[key] = sanitizeUrl(data[key])
      }
      return { ...crumb, data }
    })
  }
  if (scrubbed.extra) scrubbed.extra = scrub(scrubbed.extra)
  if (scrubbed.contexts) scrubbed.contexts = scrub(scrubbed.contexts)
  scrubbed.user = null
  return scrubbed
}

/**
 * Parse a traces sample rate from a raw env string. Anything that isn't a
 * number in [0, 1] falls back to the conservative default of 0 (tracing off).
 */
export const parseSampleRate = value => {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_TRACES_SAMPLE_RATE
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return DEFAULT_TRACES_SAMPLE_RATE
  }
  return parsed
}

export const readSentryConfig = () => {
  const mode = import.meta.env.MODE
  return {
    enabled: Boolean(import.meta.env.VITE_SENTRY_DSN),
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment:
      import.meta.env.VITE_SENTRY_ENVIRONMENT || mode || 'production',
    tracesSampleRate: parseSampleRate(
      import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
    ),
    release: `daydan-app@${import.meta.env.VITE_APP_VERSION || 'dev'}`,
  }
}

/**
 * Initializes Sentry only when a DSN is configured. Returns whether the SDK
 * was initialized; callers can rely on it being a no-op otherwise.
 */
export const initSentry = () => {
  const config = readSentryConfig()
  if (!config.enabled) return false
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    tracesSampleRate: config.tracesSampleRate,
    beforeSend: sanitizeSentryEvent,
  })
  return true
}

/**
 * ErrorBoundary wrapper. When Sentry is disabled it is a pure passthrough so
 * runtime behaviour is identical to an app without Sentry; when enabled it
 * captures React render/runtime errors via the SDK.
 */
export const SentryBoundary = ({ children }) => {
  if (!readSentryConfig().enabled) return children
  return <Sentry.ErrorBoundary>{children}</Sentry.ErrorBoundary>
}

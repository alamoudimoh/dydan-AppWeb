import { readLocalStorageItem, writeLocalStorageItem } from './storage.js'
import { STORAGE_KEYS } from './storageKeys.js'

/**
 * Local-first privacy preferences.
 *
 * These flags control the user's own device experience: which identity
 * fields are presented on their profile card and whether crash/error
 * diagnostics may be shared. Each preference sits behind a canonical storage
 * key so it survives reloads and can later be promoted to API-backed
 * enforcement without changing the UI contract.
 */
export const PRIVACY_PREFERENCES = Object.freeze({
  showTimezone: 'showTimezone',
  showEmail: 'showEmail',
  shareDiagnostics: 'shareDiagnostics',
})

const DEFAULT_VALUES = Object.freeze({
  [PRIVACY_PREFERENCES.showTimezone]: true,
  [PRIVACY_PREFERENCES.showEmail]: true,
  [PRIVACY_PREFERENCES.shareDiagnostics]: true,
})

const parseStoredBoolean = value => {
  if (value == null) return null
  if (typeof value === 'boolean') return value
  return String(value) === 'true'
}

/**
 * Read a privacy preference, falling back to its default when nothing has
 * been stored yet (defaults are permissive for freshly created accounts).
 */
export const getPrivacyPreference = preference => {
  const parsed = parseStoredBoolean(
    readLocalStorageItem(STORAGE_KEYS.privacy[preference]),
  )
  return parsed === null ? DEFAULT_VALUES[preference] : parsed
}

/** Persist a privacy preference for this device. */
export const setPrivacyPreference = (preference, value) => {
  writeLocalStorageItem(
    STORAGE_KEYS.privacy[preference],
    String(Boolean(value)),
  )
}

/** Convenience guard used before capturing diagnostics (Sentry, etc.). */
export const isDiagnosticsSharingEnabled = () =>
  getPrivacyPreference(PRIVACY_PREFERENCES.shareDiagnostics)

/** True when the profile card may present the user's timezone. */
export const isTimezoneVisibleOnProfile = () =>
  getPrivacyPreference(PRIVACY_PREFERENCES.showTimezone)

/** True when the profile card may present the user's contact email. */
export const isEmailVisibleOnProfile = () =>
  getPrivacyPreference(PRIVACY_PREFERENCES.showEmail)

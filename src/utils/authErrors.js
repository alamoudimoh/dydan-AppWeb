import {
  NativeCredentialErrorCode,
  NativeCredentialStorageError,
} from './NativeCredentialStorage.js'

/**
 * Stable failure kinds for the refresh flow. These let auth bootstrap
 * distinguish "definitively logged out" (auth rejection, expired/absent or
 * malformed credential) from transient conditions (offline device,
 * unreachable server, secure-store hiccup) without string-matching error
 * messages at call sites.
 */
export const RefreshFailureKind = Object.freeze({
  /** No refresh credential exists locally (native). Definitive. */
  CREDENTIAL_ABSENT: 'credential-absent',
  /** Secure storage could not be read/written/verified. Transient, fail-closed. */
  STORAGE: 'storage',
  /** The request never reached the server (offline, DNS, TLS). Transient. */
  NETWORK: 'network',
  /** Server answered non-OK without definitively rejecting (5xx etc.). Transient. */
  SERVER: 'server',
  /** Server definitively rejected the credential (401/403). Definitive. */
  AUTH: 'auth',
  /** Credential expired or locally unusable (malformed). Definitive. */
  EXPIRED: 'expired',
})

export const isNativeCredentialStorageError = error =>
  error instanceof NativeCredentialStorageError ||
  (error && error.name === 'NativeCredentialStorageError')

const DEVICE_STORAGE_ERROR_CODES = new Set([
  NativeCredentialErrorCode.SECURE_READ_FAILED,
  NativeCredentialErrorCode.SECURE_WRITE_FAILED,
  NativeCredentialErrorCode.SECURE_VERIFY_FAILED,
  NativeCredentialErrorCode.LEGACY_READ_FAILED,
  NativeCredentialErrorCode.LEGACY_CLEANUP_FAILED,
])

const MALFORMED_ERROR_CODES = new Set([
  NativeCredentialErrorCode.MALFORMED_LEGACY_EXPIRY,
  NativeCredentialErrorCode.MALFORMED_SECURE_EXPIRY,
])

/**
 * True when an error represents an OS-backed secure-storage failure rather
 * than a verdict about the credential itself.
 */
export const isSecureStorageFailure = error =>
  isNativeCredentialStorageError(error) === true &&
  DEVICE_STORAGE_ERROR_CODES.has(error.code)

/**
 * True when a thrown error represents "the request never got an answer".
 * Covers web fetch TypeErrors and the message shapes seen from Capacitor
 * native HTTP stacks.
 */
export const isNetworkTransportError = error => {
  if (!error) return false
  if (error instanceof TypeError) return true
  const message = String(error.message || '')
  return (
    /failed to fetch/i.test(message) ||
    /network request failed/i.test(message) ||
    /network error/i.test(message) ||
    /load failed/i.test(message) ||
    /err_(connection|internet|name|address)/i.test(message)
  )
}

/**
 * Classify a thrown refresh-flow error into a RefreshFailureKind. Pure:
 * no storage access, no state mutation.
 */
export const classifyRefreshThrow = error => {
  if (!error) return RefreshFailureKind.NETWORK
  const message = String(error.message || '')
  if (/no refresh token available/i.test(message)) {
    return RefreshFailureKind.CREDENTIAL_ABSENT
  }
  if (isNativeCredentialStorageError(error)) {
    if (DEVICE_STORAGE_ERROR_CODES.has(error.code)) {
      return RefreshFailureKind.STORAGE
    }
    if (MALFORMED_ERROR_CODES.has(error.code)) {
      return RefreshFailureKind.EXPIRED
    }
    // INVALID_CREDENTIALS and any future code: fail closed as a device
    // storage condition so we never destroy state on an unknown shape.
    return RefreshFailureKind.STORAGE
  }
  if (isNetworkTransportError(error)) {
    return RefreshFailureKind.NETWORK
  }
  return RefreshFailureKind.NETWORK
}

/**
 * Map a non-OK refresh response onto a kind. 400 (no cookie/body credential
 * presented), 401 and 403 are definitive rejections; anything else the server
 * says is treated as a server-side condition rather than proof the session is
 * dead.
 */
export const classifyRefreshStatus = status => {
  if (status === 400 || status === 401 || status === 403) {
    return RefreshFailureKind.AUTH
  }
  return RefreshFailureKind.SERVER
}

/**
 * Kinds that must NOT be presented to the user as a definitive logout when a
 * local refresh credential may still exist.
 */
export const isTransientRefreshFailure = kind =>
  kind === RefreshFailureKind.NETWORK ||
  kind === RefreshFailureKind.SERVER ||
  kind === RefreshFailureKind.STORAGE

/**
 * Kinds that prove the session is over and justify tearing it down (in-session
 * forced logout). Complement of isTransientRefreshFailure plus the expired
 * pre-check verdict.
 */
export const isDefinitiveRefreshFailure = kind =>
  !isTransientRefreshFailure(kind)

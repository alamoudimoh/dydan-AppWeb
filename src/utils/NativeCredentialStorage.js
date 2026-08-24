export const NATIVE_CREDENTIAL_KEYS = Object.freeze({
  accessToken: 'token',
  accessTokenExpiry: 'token_expiry',
  refreshToken: 'refresh_token',
  refreshTokenExpiry: 'refresh_token_expiry',
})

export const NativeCredentialErrorCode = Object.freeze({
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  MALFORMED_LEGACY_EXPIRY: 'MALFORMED_LEGACY_EXPIRY',
  MALFORMED_SECURE_EXPIRY: 'MALFORMED_SECURE_EXPIRY',
  LEGACY_READ_FAILED: 'LEGACY_READ_FAILED',
  SECURE_READ_FAILED: 'SECURE_READ_FAILED',
  SECURE_WRITE_FAILED: 'SECURE_WRITE_FAILED',
  SECURE_VERIFY_FAILED: 'SECURE_VERIFY_FAILED',
  LEGACY_CLEANUP_FAILED: 'LEGACY_CLEANUP_FAILED',
})

export class NativeCredentialStorageError extends Error {
  constructor(code, message, cause) {
    super(message, { cause })
    this.name = 'NativeCredentialStorageError'
    this.code = code
  }
}

const isValidExpiry = value =>
  typeof value === 'string' &&
  value.length > 0 &&
  Number.isFinite(Date.parse(value))

const storageError = (code, message, cause) =>
  new NativeCredentialStorageError(code, message, cause)

export const readNativeRefreshCredential = async (secureStore, key) => {
  try {
    return await secureStore.getItem(key)
  } catch (cause) {
    throw storageError(
      NativeCredentialErrorCode.SECURE_READ_FAILED,
      `Failed to read ${key} from native secure storage`,
      cause,
    )
  }
}

export const persistNativeRefreshCredentials = async (
  secureStore,
  { refreshToken, refreshTokenExpiry },
) => {
  if (!refreshToken || !isValidExpiry(refreshTokenExpiry)) {
    throw storageError(
      NativeCredentialErrorCode.INVALID_CREDENTIALS,
      'Native refresh token and a valid expiry are required',
    )
  }

  try {
    await secureStore.setItem(NATIVE_CREDENTIAL_KEYS.refreshToken, refreshToken)
    await secureStore.setItem(
      NATIVE_CREDENTIAL_KEYS.refreshTokenExpiry,
      refreshTokenExpiry,
    )
  } catch (cause) {
    throw storageError(
      NativeCredentialErrorCode.SECURE_WRITE_FAILED,
      'Failed to write native refresh credentials to secure storage',
      cause,
    )
  }

  let storedToken
  let storedExpiry
  try {
    storedToken = await readNativeRefreshCredential(
      secureStore,
      NATIVE_CREDENTIAL_KEYS.refreshToken,
    )
    storedExpiry = await readNativeRefreshCredential(
      secureStore,
      NATIVE_CREDENTIAL_KEYS.refreshTokenExpiry,
    )
  } catch (cause) {
    throw storageError(
      NativeCredentialErrorCode.SECURE_READ_FAILED,
      'Failed to verify native refresh credentials in secure storage',
      cause,
    )
  }

  if (storedToken !== refreshToken || storedExpiry !== refreshTokenExpiry) {
    throw storageError(
      NativeCredentialErrorCode.SECURE_VERIFY_FAILED,
      'Secure storage did not return the exact refresh credentials written',
    )
  }
}

const readPreference = async (preferences, key) => {
  const result = await preferences.get({ key })
  return result?.value ?? null
}

const scrubLegacyAccessToken = localStorage => {
  if (!localStorage) return
  localStorage.removeItem(NATIVE_CREDENTIAL_KEYS.accessToken)
  localStorage.removeItem(NATIVE_CREDENTIAL_KEYS.accessTokenExpiry)
}

const legacyAccessCredential = localStorage => {
  if (!localStorage) return { accessToken: null, accessTokenExpiry: null }
  return {
    accessToken: localStorage.getItem(NATIVE_CREDENTIAL_KEYS.accessToken),
    accessTokenExpiry: localStorage.getItem(
      NATIVE_CREDENTIAL_KEYS.accessTokenExpiry,
    ),
  }
}

const failedMigration = (error, legacyAccess, canUseLegacyRefresh = false) => ({
  status: 'failed',
  error,
  canUseLegacyRefresh,
  ...legacyAccess,
})

export const migrateNativeCredentialStorage = async ({
  localStorage,
  preferences,
  secureStore,
}) => {
  let legacyAccess
  try {
    legacyAccess = legacyAccessCredential(localStorage)
  } catch (cause) {
    legacyAccess = { accessToken: null, accessTokenExpiry: null }
  }

  let legacyRefreshToken
  let legacyRefreshTokenExpiry
  try {
    ;[legacyRefreshToken, legacyRefreshTokenExpiry] = await Promise.all([
      readPreference(preferences, NATIVE_CREDENTIAL_KEYS.refreshToken),
      readPreference(preferences, NATIVE_CREDENTIAL_KEYS.refreshTokenExpiry),
    ])
  } catch (cause) {
    return failedMigration(
      storageError(
        NativeCredentialErrorCode.LEGACY_READ_FAILED,
        'Failed to read legacy native refresh credentials',
        cause,
      ),
      legacyAccess,
    )
  }

  const hasAnyLegacyRefresh = Boolean(
    legacyRefreshToken || legacyRefreshTokenExpiry,
  )
  if (hasAnyLegacyRefresh) {
    if (!legacyRefreshToken || !isValidExpiry(legacyRefreshTokenExpiry)) {
      return failedMigration(
        storageError(
          NativeCredentialErrorCode.MALFORMED_LEGACY_EXPIRY,
          'Legacy native refresh credentials are incomplete or malformed',
        ),
        legacyAccess,
      )
    }

    try {
      await persistNativeRefreshCredentials(secureStore, {
        refreshToken: legacyRefreshToken,
        refreshTokenExpiry: legacyRefreshTokenExpiry,
      })
    } catch (error) {
      return failedMigration(error, legacyAccess, true)
    }

    const removals = await Promise.allSettled([
      preferences.remove({ key: NATIVE_CREDENTIAL_KEYS.refreshToken }),
      preferences.remove({ key: NATIVE_CREDENTIAL_KEYS.refreshTokenExpiry }),
    ])
    try {
      scrubLegacyAccessToken(localStorage)
    } catch {
      // A subsequent idempotent run retries local cleanup.
    }
    if (removals.some(result => result.status === 'rejected')) {
      return failedMigration(
        storageError(
          NativeCredentialErrorCode.LEGACY_CLEANUP_FAILED,
          'Secure credentials were verified but legacy cleanup was interrupted',
        ),
        { accessToken: null, accessTokenExpiry: null },
      )
    }
    return { status: 'migrated', canUseLegacyRefresh: false }
  }

  let secureRefreshToken
  let secureRefreshTokenExpiry
  try {
    ;[secureRefreshToken, secureRefreshTokenExpiry] = await Promise.all([
      secureStore.getItem(NATIVE_CREDENTIAL_KEYS.refreshToken),
      secureStore.getItem(NATIVE_CREDENTIAL_KEYS.refreshTokenExpiry),
    ])
  } catch (cause) {
    return failedMigration(
      storageError(
        NativeCredentialErrorCode.SECURE_READ_FAILED,
        'Failed to read native refresh credentials from secure storage',
        cause,
      ),
      legacyAccess,
    )
  }

  if (!secureRefreshToken && !secureRefreshTokenExpiry) {
    try {
      scrubLegacyAccessToken(localStorage)
    } catch {
      // There is no refresh session to recover; retry cleanup next boot.
    }
    return { status: 'empty', canUseLegacyRefresh: false }
  }
  if (!secureRefreshToken || !isValidExpiry(secureRefreshTokenExpiry)) {
    return failedMigration(
      storageError(
        NativeCredentialErrorCode.MALFORMED_SECURE_EXPIRY,
        'Secure native refresh credentials are incomplete or malformed',
      ),
      legacyAccess,
    )
  }

  try {
    scrubLegacyAccessToken(localStorage)
  } catch {
    // Credentials are secure; local cleanup remains safe to retry.
  }
  return { status: 'already-secure', canUseLegacyRefresh: false }
}

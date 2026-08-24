import assert from 'node:assert/strict'
import test from 'node:test'

import {
  migrateNativeCredentialStorage,
  NATIVE_CREDENTIAL_KEYS,
  NativeCredentialErrorCode,
  persistNativeRefreshCredentials,
} from './NativeCredentialStorage.js'

const futureExpiry = '2030-02-01T00:00:00Z'

const createAdapters = ({ local = {}, preferences = {}, secure = {} } = {}) => {
  const preferenceValues = new Map(Object.entries(preferences))
  const localValues = new Map(Object.entries(local))
  const secureValues = new Map(Object.entries(secure))
  const calls = { localSet: [], preferenceSet: [], secureSet: [] }

  return {
    calls,
    preferenceValues,
    localValues,
    secureValues,
    preferences: {
      get: async ({ key }) => ({ value: preferenceValues.get(key) ?? null }),
      set: async ({ key, value }) => {
        calls.preferenceSet.push([key, value])
        preferenceValues.set(key, value)
      },
      remove: async ({ key }) => preferenceValues.delete(key),
    },
    localStorage: {
      getItem: key => localValues.get(key) ?? null,
      setItem: (key, value) => {
        calls.localSet.push([key, value])
        localValues.set(key, value)
      },
      removeItem: key => localValues.delete(key),
    },
    secureStore: {
      getItem: async key => secureValues.get(key) ?? null,
      setItem: async (key, value) => {
        calls.secureSet.push([key, value])
        secureValues.set(key, value)
      },
      removeItem: async key => secureValues.delete(key),
    },
  }
}

const legacySession = () =>
  createAdapters({
    preferences: {
      [NATIVE_CREDENTIAL_KEYS.refreshToken]: 'legacy-refresh',
      [NATIVE_CREDENTIAL_KEYS.refreshTokenExpiry]: futureExpiry,
    },
    local: {
      [NATIVE_CREDENTIAL_KEYS.accessToken]: 'legacy-access',
      [NATIVE_CREDENTIAL_KEYS.accessTokenExpiry]: '2030-01-01T00:00:00Z',
    },
  })

test('native credential migration verifies secure values before legacy cleanup', async () => {
  const adapters = legacySession()

  const result = await migrateNativeCredentialStorage(adapters)

  assert.equal(result.status, 'migrated')
  assert.equal(
    adapters.secureValues.get(NATIVE_CREDENTIAL_KEYS.refreshToken),
    'legacy-refresh',
  )
  assert.equal(
    adapters.secureValues.get(NATIVE_CREDENTIAL_KEYS.refreshTokenExpiry),
    futureExpiry,
  )
  assert.equal(adapters.preferenceValues.size, 0)
  assert.equal(adapters.localValues.size, 0)
  assert.deepEqual(adapters.calls.preferenceSet, [])
  assert.deepEqual(adapters.calls.localSet, [])
})

test('interrupted secure write retains every legacy credential', async () => {
  const adapters = legacySession()
  adapters.secureStore.setItem = async key => {
    if (key === NATIVE_CREDENTIAL_KEYS.refreshTokenExpiry) {
      throw new Error('device locked')
    }
  }

  const result = await migrateNativeCredentialStorage(adapters)

  assert.equal(result.status, 'failed')
  assert.equal(result.error.code, NativeCredentialErrorCode.SECURE_WRITE_FAILED)
  assert.equal(result.canUseLegacyRefresh, true)
  assert.equal(
    adapters.preferenceValues.get(NATIVE_CREDENTIAL_KEYS.refreshToken),
    'legacy-refresh',
  )
  assert.equal(
    adapters.localValues.get(NATIVE_CREDENTIAL_KEYS.accessToken),
    'legacy-access',
  )
})

test('read-back mismatch retains legacy credentials', async () => {
  const adapters = legacySession()
  adapters.secureStore.getItem = async key =>
    key === NATIVE_CREDENTIAL_KEYS.refreshToken ? 'wrong-value' : futureExpiry

  const result = await migrateNativeCredentialStorage(adapters)

  assert.equal(result.status, 'failed')
  assert.equal(
    result.error.code,
    NativeCredentialErrorCode.SECURE_VERIFY_FAILED,
  )
  assert.equal(adapters.preferenceValues.size, 2)
  assert.equal(adapters.localValues.size, 2)
})

test('malformed legacy expiry is explicit and causes no writes or cleanup', async () => {
  const adapters = legacySession()
  adapters.preferenceValues.set(
    NATIVE_CREDENTIAL_KEYS.refreshTokenExpiry,
    'not-a-date',
  )

  const result = await migrateNativeCredentialStorage(adapters)

  assert.equal(result.status, 'failed')
  assert.equal(
    result.error.code,
    NativeCredentialErrorCode.MALFORMED_LEGACY_EXPIRY,
  )
  assert.deepEqual(adapters.calls.secureSet, [])
  assert.equal(adapters.preferenceValues.size, 2)
  assert.equal(adapters.localValues.size, 2)
})

test('migration is idempotent after secure write and cleanup', async () => {
  const adapters = legacySession()

  assert.equal(
    (await migrateNativeCredentialStorage(adapters)).status,
    'migrated',
  )
  assert.equal(
    (await migrateNativeCredentialStorage(adapters)).status,
    'already-secure',
  )
  assert.equal(adapters.preferenceValues.size, 0)
  assert.equal(adapters.localValues.size, 0)
})

test('fresh secure save reports failure when exact persistence cannot be verified', async () => {
  const adapters = createAdapters()
  adapters.secureStore.getItem = async () => null

  await assert.rejects(
    persistNativeRefreshCredentials(adapters.secureStore, {
      refreshToken: 'fresh-refresh',
      refreshTokenExpiry: futureExpiry,
    }),
    error => error.code === NativeCredentialErrorCode.SECURE_VERIFY_FAILED,
  )
  assert.deepEqual(adapters.calls.preferenceSet, [])
  assert.deepEqual(adapters.calls.localSet, [])
})

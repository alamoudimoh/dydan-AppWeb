import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  classifyRefreshStatus,
  classifyRefreshThrow,
  isNetworkTransportError,
  isSecureStorageFailure,
  isTransientRefreshFailure,
  RefreshFailureKind,
} from './authErrors.js'
import { NativeCredentialStorageError } from './NativeCredentialStorage.js'

const secureReadError = cause =>
  new NativeCredentialStorageError(
    'SECURE_READ_FAILED',
    'Secure storage read failed',
    cause,
  )

test('network transport detection covers web and native shapes', () => {
  assert.equal(isNetworkTransportError(new TypeError('Failed to fetch')), true)
  assert.equal(
    isNetworkTransportError(new Error('Network request failed')),
    true,
  )
  assert.equal(isNetworkTransportError(new Error('Load failed')), true)
  assert.equal(isNetworkTransportError(null), false)
  assert.equal(isNetworkTransportError(new Error('boom')), false)
})

test('classifyRefreshThrow maps each failure source to a stable kind', () => {
  // Absent credential (native Fetcher throws before any request).
  assert.equal(
    classifyRefreshThrow(new Error('No refresh token available')),
    RefreshFailureKind.CREDENTIAL_ABSENT,
  )

  // Device secure-store failures stay transient.
  assert.equal(
    classifyRefreshThrow(secureReadError(new Error('keychain busy'))),
    RefreshFailureKind.STORAGE,
  )
  assert.equal(
    classifyRefreshThrow(
      new NativeCredentialStorageError(
        'SECURE_WRITE_FAILED',
        'Secure storage write failed',
      ),
    ),
    RefreshFailureKind.STORAGE,
  )

  // Malformed local credentials are definitive, not transient.
  assert.equal(
    classifyRefreshThrow(
      new NativeCredentialStorageError(
        'MALFORMED_SECURE_EXPIRY',
        'Malformed expiry',
      ),
    ),
    RefreshFailureKind.EXPIRED,
  )

  // Network transport errors.
  assert.equal(
    classifyRefreshThrow(new TypeError('Failed to fetch')),
    RefreshFailureKind.NETWORK,
  )
  assert.equal(
    classifyRefreshThrow(new Error('Network request failed')),
    RefreshFailureKind.NETWORK,
  )

  // Unknown throws fail toward the transient bucket: they are never proof of
  // logout, and never justify erasing credentials.
  assert.equal(
    classifyRefreshThrow(new Error('something unexpected')),
    RefreshFailureKind.NETWORK,
  )
  assert.equal(classifyRefreshThrow(undefined), RefreshFailureKind.NETWORK)
})

test('classifyRefreshStatus separates definitive rejection from server trouble', () => {
  assert.equal(classifyRefreshStatus(401), RefreshFailureKind.AUTH)
  assert.equal(classifyRefreshStatus(403), RefreshFailureKind.AUTH)
  assert.equal(classifyRefreshStatus(500), RefreshFailureKind.SERVER)
  assert.equal(classifyRefreshStatus(409), RefreshFailureKind.SERVER)
  assert.equal(classifyRefreshStatus(429), RefreshFailureKind.SERVER)
})

test('transient kinds never include definitive verdicts', () => {
  assert.equal(isTransientRefreshFailure(RefreshFailureKind.NETWORK), true)
  assert.equal(isTransientRefreshFailure(RefreshFailureKind.SERVER), true)
  assert.equal(isTransientRefreshFailure(RefreshFailureKind.STORAGE), true)
  assert.equal(isTransientRefreshFailure(RefreshFailureKind.AUTH), false)
  assert.equal(isTransientRefreshFailure(RefreshFailureKind.EXPIRED), false)
  assert.equal(
    isTransientRefreshFailure(RefreshFailureKind.CREDENTIAL_ABSENT),
    false,
  )
})

test('secure-storage failure detection ignores unrelated errors', () => {
  assert.equal(isSecureStorageFailure(secureReadError()), true)
  assert.equal(isSecureStorageFailure(new Error('plain error')), false)
  assert.equal(isSecureStorageFailure(null), false)
})

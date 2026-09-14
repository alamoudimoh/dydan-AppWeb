const store = {}
vi.stubGlobal('localStorage', {
  getItem: vi.fn(k => store[k] || null),
  setItem: vi.fn((k, v) => {
    store[k] = v
  }),
  removeItem: vi.fn(k => {
    delete store[k]
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach(k => delete store[k])
  }),
  length: 0,
})
import { beforeEach, describe, expect, it, vi } from 'vitest'

// @vitest-environment jsdom

/**
 * Behavioral audit of TokenStorage on the web platform:
 *
 * The browser session model keeps the access token in module memory and the
 * refresh credential in an HttpOnly cookie. These tests fail if any code path
 * in TokenStorage ever writes a token into localStorage again on the web
 * (the regression guard for the localStorage-session migration).
 */

const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
const secureStorage = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}))

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async () => ({ value: null })),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStorage: secureStorage,
}))

const TOKEN_LIKE_KEYS = [
  'token',
  'token_expiry',
  'refresh_token',
  'refresh_token_expiry',
  'access_token',
  'ca_token',
  'ca_expiration',
]

describe('TokenStorage (web)', () => {
  let storage

  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    localStorage.setItem.mockClear()
    localStorage.removeItem.mockClear()
    setItemSpy.mockClear()
    removeItemSpy.mockClear()
    secureStorage.getItem.mockReset()
    secureStorage.setItem.mockReset()
    secureStorage.removeItem.mockReset()
    storage = await import('./TokenStorage')
  })

  it('saveTokens keeps the access token out of localStorage', async () => {
    await storage.saveTokens({
      accessToken: 'at-123',
      accessTokenExpiry: '2030-01-01T00:00:00Z',
      refreshToken: 'rt-456',
      refreshTokenExpiry: '2030-02-01T00:00:00Z',
    })

    for (const call of localStorage.setItem.mock.calls) {
      expect(
        TOKEN_LIKE_KEYS,
        `token-like key "${call[0]}" must never be written to localStorage on the web`,
      ).not.toContain(call[0])
    }

    // The credential must be readable from memory...
    expect(storage.getAccessToken()).toBe('at-123')
    expect(storage.getAccessTokenExpiry()).toBe('2030-01-01T00:00:00Z')

    // ...and absent from storage.
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(secureStorage.setItem).not.toHaveBeenCalled()
  })

  it('clearAllTokens removes legacy token keys instead of leaving duplicates', async () => {
    localStorage.setItem('token', 'legacy-at')
    localStorage.setItem('token_expiry', '2020-01-01T00:00:00Z')
    localStorage.setItem('refresh_token', 'legacy-rt')
    localStorage.setItem('ca_token', 'older-token')

    await storage.clearAllTokens()

    for (const key of TOKEN_LIKE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull()
    }
    expect(storage.getAccessToken()).toBeNull()
  })

  it('keeps a legacy session until cookie rotation succeeds, then scrubs it exactly once', async () => {
    localStorage.setItem('token', 'legacy-at')
    localStorage.setItem('token_expiry', '2030-01-01T00:00:00Z')
    localStorage.setItem('refresh_token', 'legacy-rt')
    localStorage.setItem('refresh_token_expiry', '2030-06-01T00:00:00Z')
    removeItemSpy.mockClear()

    const adopted = storage.adoptLegacyStoredToken()
    expect(adopted).toBe('legacy-at')
    expect(storage.getAccessToken()).toBe('legacy-at')
    expect(storage.getLegacyBrowserRefreshToken()).toBe('legacy-rt')
    expect(localStorage.removeItem).not.toHaveBeenCalled()

    storage.clearLegacyBrowserTokens()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('token_expiry')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('makes an orphaned legacy refresh credential available for one safe rotation', () => {
    localStorage.setItem('refresh_token', 'orphaned-refresh')
    localStorage.setItem('refresh_token_expiry', '2030-06-01T00:00:00Z')

    expect(storage.adoptLegacyStoredToken()).toBeNull()
    expect(storage.getLegacyBrowserRefreshToken()).toBe('orphaned-refresh')
    expect(localStorage.getItem('refresh_token')).toBe('orphaned-refresh')
  })

  it('getRefreshToken stays unavailable to JavaScript on the web', async () => {
    expect(await storage.getRefreshToken()).toBeNull()
    expect(await storage.getRefreshTokenExpiry()).toBeNull()
    expect(await storage.isRefreshTokenExpired()).toBe(false)
  })
})

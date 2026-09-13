import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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

const mocks = vi.hoisted(() => ({
  secure: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  preferences: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => 'android' },
}))

vi.mock('@capacitor/preferences', () => ({ Preferences: mocks.preferences }))

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStorage: mocks.secure,
}))

describe('TokenStorage (native)', () => {
  let storage

  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    for (const adapter of Object.values(mocks)) {
      for (const method of Object.values(adapter)) method.mockReset()
    }
    mocks.secure.getItem.mockResolvedValue(null)
    mocks.secure.setItem.mockResolvedValue(undefined)
    mocks.secure.removeItem.mockResolvedValue(undefined)
    mocks.preferences.get.mockResolvedValue({ value: null })
    mocks.preferences.remove.mockResolvedValue(undefined)
    storage = await import('./TokenStorage')
  })

  it('writes new refresh credentials only to secure storage and keeps access in memory', async () => {
    const values = new Map()
    mocks.secure.setItem.mockImplementation(async (key, value) => {
      values.set(key, value)
    })
    mocks.secure.getItem.mockImplementation(
      async key => values.get(key) ?? null,
    )

    await storage.saveTokens({
      accessToken: 'native-access',
      accessTokenExpiry: '2030-01-01T00:00:00Z',
      refreshToken: 'native-refresh',
      refreshTokenExpiry: '2030-02-01T00:00:00Z',
    })

    expect(storage.getAccessToken()).toBe('native-access')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('token_expiry')).toBeNull()
    expect(mocks.preferences.set).not.toHaveBeenCalled()
    expect(mocks.secure.setItem).toHaveBeenCalledTimes(2)
  })

  it('does not establish an access-only session when secure save fails', async () => {
    mocks.secure.setItem.mockRejectedValue(new Error('keystore locked'))

    await expect(
      storage.saveTokens({
        accessToken: 'must-not-be-adopted',
        accessTokenExpiry: '2030-01-01T00:00:00Z',
        refreshToken: 'refresh',
        refreshTokenExpiry: '2030-02-01T00:00:00Z',
      }),
    ).rejects.toMatchObject({ code: 'SECURE_WRITE_FAILED' })

    expect(storage.getAccessToken()).toBeNull()
    expect(mocks.preferences.set).not.toHaveBeenCalled()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('logout clears secure storage, Preferences legacy values, and localStorage legacy values', async () => {
    for (const key of [
      'token',
      'token_expiry',
      'refresh_token',
      'refresh_token_expiry',
      'ca_token',
      'ca_expiration',
      'access_token',
    ]) {
      localStorage.setItem(key, 'legacy')
    }

    const result = await storage.clearAllTokens()

    expect(result).toEqual({ status: 'cleared', errors: [] })
    expect(mocks.secure.removeItem).toHaveBeenCalledWith('refresh_token')
    expect(mocks.secure.removeItem).toHaveBeenCalledWith('refresh_token_expiry')
    expect(mocks.preferences.remove).toHaveBeenCalledWith({
      key: 'refresh_token',
    })
    expect(mocks.preferences.remove).toHaveBeenCalledWith({
      key: 'refresh_token_expiry',
    })
    expect(localStorage.length).toBe(0)
  })

  it('account deletion uses the same secure credential cleanup', () => {
    const source = readFileSync(
      resolve('src/views/Modals/Inputs/UserDeletionModal.jsx'),
      'utf8',
    )
    expect(source).toContain(
      "import { clearAllTokens } from '../../../utils/TokenStorage'",
    )
    expect(source).toContain('await clearAllTokens()')
    expect(source).not.toContain("localStorage.removeItem('ca_token')")
  })
})

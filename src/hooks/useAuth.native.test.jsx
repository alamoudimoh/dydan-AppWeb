import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider, useAuth } from './useAuth'

// @vitest-environment jsdom

const mocks = vi.hoisted(() => ({
  apiClient: {
    getApiURL: vi.fn(),
    init: vi.fn(),
    refreshToken: vi.fn(),
  },
  storage: {
    adoptLegacyStoredToken: vi.fn(),
    clearAllTokens: vi.fn(),
    getAccessToken: vi.fn(),
    getAccessTokenExpiry: vi.fn(),
    hasAccessToken: vi.fn(),
    isNative: vi.fn(),
    migrateNativeCredentials: vi.fn(),
    saveTokens: vi.fn(),
  },
}))

vi.mock('../utils/ApiClient', () => ({ apiClient: mocks.apiClient }))
vi.mock('../utils/OfflineDB', () => ({
  offlineDB: { clearAll: vi.fn() },
}))
vi.mock('../utils/TokenStorage', () => mocks.storage)

const AuthState = () => {
  const { isAuthenticated, isLoading } = useAuth()
  return <div>{isLoading ? 'loading' : String(isAuthenticated)}</div>
}

describe('AuthProvider native bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.storage.isNative.mockReturnValue(true)
    mocks.storage.getAccessToken.mockReturnValue(null)
    mocks.storage.getAccessTokenExpiry.mockReturnValue(null)
    mocks.storage.hasAccessToken.mockReturnValue(false)
    mocks.storage.migrateNativeCredentials.mockResolvedValue({
      status: 'already-secure',
    })
    mocks.apiClient.init.mockResolvedValue(undefined)
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: true,
      token: 'repopulated-access',
    })
  })

  it('migrates before refreshing to repopulate memory after a cold restart', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthState />
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('true')).toBeTruthy())
    expect(mocks.storage.migrateNativeCredentials).toHaveBeenCalledOnce()
    expect(mocks.apiClient.refreshToken).toHaveBeenCalledWith({
      allowLogoutFallback: false,
    })
    expect(
      mocks.storage.migrateNativeCredentials.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.apiClient.refreshToken.mock.invocationCallOrder[0])
  })
})

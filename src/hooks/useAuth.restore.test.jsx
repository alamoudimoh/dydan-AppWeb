import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

/**
 * Probe that exposes the full boot-state surface so each scenario can assert
 * exactly how a failed restore was represented to the user.
 */
const RestoreProbe = () => {
  const { isAuthenticated, isLoading, restorePending, retryRestore } = useAuth()
  if (isLoading) return <div>loading</div>
  if (restorePending) {
    return (
      <div>
        <span>{`pending:${restorePending.reason}`}</span>
        <button type='button' onClick={() => retryRestore()}>
          retry
        </button>
      </div>
    )
  }
  return <div>{String(isAuthenticated)}</div>
}

const renderBootstrap = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <RestoreProbe />
      </AuthProvider>
    </MemoryRouter>,
  )

describe('AuthProvider transient restore failures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    mocks.storage.isNative.mockReturnValue(true)
    mocks.storage.getAccessToken.mockReturnValue(null)
    mocks.storage.getAccessTokenExpiry.mockReturnValue(null)
    mocks.storage.hasAccessToken.mockReturnValue(false)
    mocks.storage.migrateNativeCredentials.mockResolvedValue({
      status: 'already-secure',
    })
    mocks.apiClient.init.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
  })

  it('offline cold start with a secure credential shows a retryable connectivity state, not logout', async () => {
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: false,
      kind: 'network',
      error: 'Failed to fetch',
    })

    renderBootstrap()

    await waitFor(() =>
      expect(screen.getByText('pending:connectivity')).toBeTruthy(),
    )
    // Fail-closed: no access token, and nothing was erased.
    expect(mocks.storage.clearAllTokens).not.toHaveBeenCalled()
  })

  it('retry after connectivity restores completes the deferred refresh', async () => {
    const user = userEvent.setup()
    mocks.apiClient.refreshToken
      .mockResolvedValueOnce({
        success: false,
        kind: 'network',
        error: 'Failed to fetch',
      })
      .mockResolvedValueOnce({ success: true, token: 'restored-access' })
    mocks.storage.getAccessToken.mockReturnValue(null)

    renderBootstrap()
    await waitFor(() =>
      expect(screen.getByText('pending:connectivity')).toBeTruthy(),
    )

    await user.click(screen.getByRole('button', { name: 'retry' }))

    await waitFor(() => expect(screen.getByText('true')).toBeTruthy())
    expect(mocks.apiClient.refreshToken).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(/pending:/)).toBeNull()
  })

  it('auto-retries when connectivity comes back via the online event', async () => {
    mocks.apiClient.refreshToken
      .mockResolvedValueOnce({
        success: false,
        kind: 'network',
        error: 'Network request failed',
      })
      .mockResolvedValueOnce({ success: true, token: 'online-again-access' })

    renderBootstrap()
    await waitFor(() =>
      expect(screen.getByText('pending:connectivity')).toBeTruthy(),
    )

    await actAsync(async () => {
      window.dispatchEvent(new Event('online'))
    })

    await waitFor(() => expect(screen.getByText('true')).toBeTruthy())
    expect(mocks.apiClient.refreshToken).toHaveBeenCalledTimes(2)
  })

  it('invalid or revoked refresh credential lands on the definitive login path', async () => {
    // The server answers 401/403 -> classified as an auth rejection.
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: false,
      kind: 'auth',
      error: 'Refresh failed',
    })

    renderBootstrap()

    await waitFor(() => expect(screen.getByText('false')).toBeTruthy())
    expect(screen.queryByText(/pending:/)).toBeNull()
  })

  it('no local credential at all lands on the login path without a pending state', async () => {
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: false,
      kind: 'credential-absent',
      error: 'No refresh token available',
    })

    renderBootstrap()

    await waitFor(() => expect(screen.getByText('false')).toBeTruthy())
    expect(screen.queryByText(/pending:/)).toBeNull()
  })

  it('expired local refresh credential lands on the login path without a pending state', async () => {
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: false,
      kind: 'expired',
      error: 'Refresh token expired',
    })

    renderBootstrap()

    await waitFor(() => expect(screen.getByText('false')).toBeTruthy())
    expect(screen.queryByText(/pending:/)).toBeNull()
  })

  it('transient secure-storage failure keeps credentials and shows the storage state', async () => {
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: false,
      kind: 'storage',
      error: 'Secure read failed',
    })

    renderBootstrap()

    await waitFor(() =>
      expect(screen.getByText('pending:storage')).toBeTruthy(),
    )
    // The only valid credential must never be destroyed by a read error.
    expect(mocks.storage.clearAllTokens).not.toHaveBeenCalled()
  })

  it('web cold start offline shows the connectivity state instead of login redirect', async () => {
    mocks.storage.isNative.mockReturnValue(false)
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: false,
      kind: 'network',
      error: 'Failed to fetch',
    })

    renderBootstrap()

    await waitFor(() =>
      expect(screen.getByText('pending:connectivity')).toBeTruthy(),
    )
  })
})

async function actAsync(fn) {
  const { act } = await import('@testing-library/react')
  await act(fn)
}

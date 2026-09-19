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
    clearAllTokens: vi.fn(),
    clearLegacyBrowserTokens: vi.fn(),
    getAccessToken: vi.fn(),
    getAccessTokenExpiry: vi.fn(),
    getLegacyBrowserRefreshToken: vi.fn(),
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
  const {
    isAuthenticated,
    isLoading,
    restorePending,
    retryRestore,
    sessionExpired,
  } = useAuth()
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
  if (sessionExpired) {
    return (
      <div>
        <span>session-expired</span>
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
    mocks.storage.getLegacyBrowserRefreshToken.mockReturnValue(null)
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
    // The server answers 401/403 -> classified as an auth rejection. Without
    // a device-local sign-in marker this is a fresh visitor: plain redirect.
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: false,
      kind: 'auth',
      error: 'Refresh failed',
    })

    renderBootstrap()

    await waitFor(() => expect(screen.getByText('false')).toBeTruthy())
    expect(screen.queryByText(/pending:/)).toBeNull()
    expect(screen.queryByText('session-expired')).toBeNull()
  })

  it('definitive restore failure keeps a signed-in device on the page', async () => {
    // A user who signed in here before must not be bounced to /login by a
    // refresh: the in-place session-expired surface keeps the current URL.
    window.localStorage.setItem('dydan.signed-in', '1')
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: false,
      kind: 'auth',
      error: 'Refresh failed',
    })

    renderBootstrap()

    await waitFor(() =>
      expect(screen.getByText('session-expired')).toBeTruthy(),
    )
    expect(screen.queryByText(/pending:/)).toBeNull()
    expect(mocks.storage.clearAllTokens).not.toHaveBeenCalled()
  })

  it('a successful retry clears the in-place session-expired verdict', async () => {
    window.localStorage.setItem('dydan.signed-in', '1')
    mocks.apiClient.refreshToken
      .mockResolvedValueOnce({
        success: false,
        kind: 'auth',
        error: 'Refresh failed',
      })
      .mockResolvedValueOnce({
        success: true,
        token: 'recovered-access',
      })

    renderBootstrap()

    await waitFor(() =>
      expect(screen.getByText('session-expired')).toBeTruthy(),
    )

    await userEvent.click(screen.getByRole('button', { name: 'retry' }))

    await waitFor(() => expect(screen.getByText('true')).toBeTruthy())
    expect(screen.queryByText('session-expired')).toBeNull()
  })

  it('scrubs a rejected legacy browser credential so the cookie can recover', async () => {
    mocks.storage.isNative.mockReturnValue(false)
    mocks.storage.getLegacyBrowserRefreshToken.mockReturnValue('stale-legacy')
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: false,
      kind: 'auth',
      error: 'Refresh failed',
    })

    renderBootstrap()

    await waitFor(() => expect(screen.getByText('false')).toBeTruthy())
    expect(mocks.storage.clearLegacyBrowserTokens).toHaveBeenCalledOnce()
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

  it('web cold start restores an HttpOnly-cookie session without persistent tokens', async () => {
    mocks.storage.isNative.mockReturnValue(false)
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: true,
      token: 'cookie-restored-access',
    })

    renderBootstrap()

    await waitFor(() => expect(screen.getByText('true')).toBeTruthy())
    expect(mocks.apiClient.refreshToken).toHaveBeenCalledWith({
      allowLogoutFallback: false,
      legacyRefreshToken: null,
    })
  })

  it('scrubs shipped browser credentials only after successful cookie rotation', async () => {
    mocks.storage.isNative.mockReturnValue(false)
    mocks.storage.getLegacyBrowserRefreshToken.mockReturnValue('legacy-refresh')
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: true,
      token: 'rotated-access',
    })

    renderBootstrap()

    await waitFor(() => expect(screen.getByText('true')).toBeTruthy())
    expect(mocks.apiClient.refreshToken).toHaveBeenCalledWith({
      allowLogoutFallback: false,
      legacyRefreshToken: 'legacy-refresh',
    })
    expect(mocks.storage.clearLegacyBrowserTokens).toHaveBeenCalledOnce()
  })

  it('retains shipped browser credentials when rotation is transiently unavailable', async () => {
    mocks.storage.isNative.mockReturnValue(false)
    mocks.storage.getLegacyBrowserRefreshToken.mockReturnValue('legacy-refresh')
    mocks.apiClient.refreshToken.mockResolvedValue({
      success: false,
      kind: 'network',
      error: 'Failed to fetch',
    })

    renderBootstrap()

    await waitFor(() =>
      expect(screen.getByText('pending:connectivity')).toBeTruthy(),
    )
    expect(mocks.storage.clearLegacyBrowserTokens).not.toHaveBeenCalled()
  })
})

async function actAsync(fn) {
  const { act } = await import('@testing-library/react')
  await act(fn)
}

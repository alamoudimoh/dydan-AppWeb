// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../service/NotificationProvider', () => ({
  useNotification: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}))

vi.mock('../../utils/Fetcher', () => ({
  GetMFAStatus: vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ mfaEnabled: true }),
    }),
  ),
  UpdatePassword: vi.fn(),
}))

vi.mock('../../components/settings/AccountSessionsCard', () => ({
  default: () => <div data-testid='account-sessions-card' />,
}))

vi.mock('../Modals/Inputs/PasswordChangeModal', () => ({
  default: () => null,
}))

vi.mock('../Modals/Inputs/UserDeletionModal', () => ({
  default: () => null,
}))

vi.mock('./SettingsLayout', () => ({
  default: ({ children, title }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

vi.mock('../../queries/UserQueries', () => ({
  useUserProfile: () => ({
    data: { id: 1, provider: 0, displayName: 'Dana' },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}))

import SecuritySettings from './SecuritySettings.jsx'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('SecuritySettings', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
  })

  const renderPage = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CssVarsProvider>
            <SecuritySettings />
          </CssVarsProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    )
  }

  it('renders the security hub with sign-in, two-factor, sessions and the danger zone', async () => {
    vi.stubEnv('VITE_IS_SELF_HOSTED', 'false')
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'security.title' }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('security.mfaEnabled')).toBeInTheDocument()
    })
    expect(screen.getByTestId('account-sessions-card')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'security.deleteAccount' }),
    ).toBeInTheDocument()
  })

  it('keeps the password controls visible on self-hosted installs only', () => {
    vi.stubEnv('VITE_IS_SELF_HOSTED', 'true')
    renderPage()

    expect(
      screen.getByRole('button', { name: 'security.changePassword' }),
    ).toBeInTheDocument()
  })

  it('shows the danger zone at the bottom, visually distinct from the rest', () => {
    vi.stubEnv('VITE_IS_SELF_HOSTED', 'false')
    renderPage()

    expect(screen.getByText('security.dangerZone')).toBeInTheDocument()
    expect(screen.getByText('security.deleteAccountHelp')).toBeInTheDocument()
  })
})

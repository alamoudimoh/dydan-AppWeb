// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-easy-crop', () => ({
  default: () => null,
}))

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}))

vi.mock('../../contexts/LocalizationContext', () => ({
  useLocalization: () => ({ intlLocale: 'en-US' }),
}))

vi.mock('../../service/NotificationProvider', () => ({
  useNotification: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}))

vi.mock('../../utils/ApiClient', () => ({
  apiClient: { getApiURL: () => 'http://localhost/api/v1/' },
}))

vi.mock('../../utils/Fetcher', () => ({
  UpdateUserDetails: vi.fn(),
}))

vi.mock('../../utils/SettingsPrivacy', () => ({
  getPrivacyPreference: () => true,
  PRIVACY_PREFERENCES: {
    showTimezone: 'showTimezone',
    showEmail: 'showEmail',
  },
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
    data: {
      id: 1,
      displayName: 'Dana',
      username: 'dana',
      email: 'dana@example.com',
      provider: 0,
      timezone: 'UTC',
      created_at: '2026-01-01T00:00:00Z',
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCircleMembers: () => ({
    data: { res: [{ userId: 1, role: 'owner' }] },
  }),
}))

import ProfileSettings from './ProfileSettings.jsx'

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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
}))

describe('ProfileSettings', () => {
  afterEach(() => {
    cleanup()
  })

  const renderPage = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    return render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CssVarsProvider>
            <ProfileSettings />
          </CssVarsProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    )
  }

  it('renders identity & presentation with a live preview card', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('profile-preview-card')).toBeInTheDocument()
    })
    expect(screen.getByText('profile.handle')).toBeInTheDocument()
    expect(screen.getByText('profile.email')).toBeInTheDocument()
    expect(screen.getByText('profile.role')).toBeInTheDocument()
  })

  it('links profile fields to privacy settings via "Who can see this?"', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('profile-preview-card')).toBeInTheDocument()
    })
    expect(
      screen.getAllByRole('button', { name: 'profile.whoCanSee' }).length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('points account owners to Security settings for passwords, sessions and deletion', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('profile-preview-card')).toBeInTheDocument()
    })

    // Profile is identity & presentation only now.
    expect(
      screen.queryByText('accountSettings.dangerZone'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'accountSettings.deleteAccount' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'accountSettings.changePassword' }),
    ).not.toBeInTheDocument()

    // The way in to account security lives on the profile as a link.
    expect(
      screen.getByRole('button', { name: 'profile.openSecurity' }),
    ).toBeInTheDocument()
  })
})

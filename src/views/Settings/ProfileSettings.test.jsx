// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
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

vi.mock('../../components/settings/AccountIdentityCard', () => ({
  default: () => <div data-testid='account-identity-card' />,
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
      timezone: 'UTC',
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

  it('renders without useCircleMembers ReferenceError', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <CssVarsProvider>
          <ProfileSettings />
        </CssVarsProvider>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('account-identity-card')).toBeInTheDocument()
    })
  })
})

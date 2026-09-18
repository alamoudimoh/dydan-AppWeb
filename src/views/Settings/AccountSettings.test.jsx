// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}))

vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: {
    configure: vi.fn(),
    getOfferings: vi.fn(),
    getCustomerInfo: vi.fn(),
  },
}))

vi.mock('../../contexts/LocalizationContext', () => ({
  useLocalization: () => ({ fmt: { date: () => 'Jan 1, 2027' } }),
}))

vi.mock('../../service/NotificationProvider', () => ({
  useNotification: () => ({ showNotification: vi.fn() }),
}))

vi.mock('../../utils/Fetcher', () => ({
  CancelSubscription: vi.fn(),
}))

vi.mock('../../components/SubscriptionModal', () => ({
  default: () => null,
}))

vi.mock('../Modals/Inputs/NativeCancelSubscriptionModal', () => ({
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

let mockSubscription = 'free'
vi.mock('../../queries/UserQueries', () => ({
  useUserProfile: () => ({
    data: {
      id: 1,
      subscription: mockSubscription,
      expiration: '2027-01-01',
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}))

import AccountSettings from './AccountSettings.jsx'

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

describe('AccountSettings', () => {
  afterEach(() => {
    cleanup()
    mockSubscription = 'free'
  })

  const renderPage = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(
      <QueryClientProvider client={queryClient}>
        <CssVarsProvider>
          <AccountSettings />
        </CssVarsProvider>
      </QueryClientProvider>,
    )
  }

  it('renders subscription management only', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'accountSettings.subscription' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/accountSettings\.subscriptionStatus/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'accountSettings.upgrade' }),
    ).toBeInTheDocument()
  })

  it('keeps Profile-owned controls out of Settings (Profile owns identity, password, sessions, deletion)', () => {
    renderPage()

    expect(
      screen.queryByRole('button', { name: 'accountSettings.changePassword' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'accountSettings.deleteAccount' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('accountSettings.dangerZone'),
    ).not.toBeInTheDocument()
  })

  it('shows the cancel action only for an active subscription', () => {
    mockSubscription = 'active'
    renderPage()

    expect(
      screen.getByRole('button', { name: 'accountSettings.cancel' }),
    ).toBeInTheDocument()
  })
})

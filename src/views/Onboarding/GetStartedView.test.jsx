// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { APP_DISPLAY_NAME } from '../../config/AppBranding'

const translations = {
  'onboarding.getStarted.subtitle':
    'Create an account to sync everywhere, or sign in and pick up where you left off.',
  'onboarding.getStarted.signInSubtitle':
    'Sign in to your account to pick up where you left off.',
  'auth.createAccount': 'Create an account',
  'auth.alreadyHaveAccount': 'Already have an account?',
  'auth.signIn': 'Sign in',
  'auth.connectSelfHosted': 'Connect to self-hosted',
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => (key in translations ? translations[key] : key),
  }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../utils/Onboarding', () => ({
  haptic: vi.fn(),
  isNativeApp: () => false,
  markOnboardingSeen: vi.fn(),
}))

vi.mock('../../queries/ResourceQueries', () => ({
  useResource: () => ({ data: {}, isLoading: false, error: null }),
}))

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

import { MemoryRouter } from 'react-router-dom'

import GetStartedView from './GetStartedView.jsx'

const renderWithProviders = ui =>
  render(
    <MemoryRouter>
      <CssVarsProvider>{ui}</CssVarsProvider>
    </MemoryRouter>,
  )

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('GetStartedView', () => {
  it('renders the canonical product identity as the page heading', () => {
    renderWithProviders(<GetStartedView />)

    expect(
      screen.getByRole('heading', { level: 1, name: APP_DISPLAY_NAME }),
    ).toBeInTheDocument()
  })

  it('does not render legacy Donetick branding', () => {
    const { container } = renderWithProviders(<GetStartedView />)

    expect(screen.queryByText(/donetick/i)).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/donetick/i)
  })

  it('exposes the canonical identity in the logo accessible name', () => {
    renderWithProviders(<GetStartedView />)

    expect(screen.getByAltText(APP_DISPLAY_NAME)).toBeInTheDocument()
  })

  it('navigates to signup when Create an account is pressed', () => {
    renderWithProviders(<GetStartedView />)

    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))

    expect(mockNavigate).toHaveBeenCalledWith('/signup')
  })

  it('navigates to login when Already have an account is pressed', () => {
    renderWithProviders(<GetStartedView />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Already have an account?' }),
    )

    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})

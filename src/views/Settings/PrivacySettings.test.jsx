// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const privacyMock = vi.hoisted(() => ({
  get: vi.fn(() => true),
  set: vi.fn(),
}))

vi.mock('../../utils/SettingsPrivacy', () => ({
  getPrivacyPreference: privacyMock.get,
  setPrivacyPreference: privacyMock.set,
  PRIVACY_PREFERENCES: {
    showTimezone: 'showTimezone',
    showEmail: 'showEmail',
    shareDiagnostics: 'shareDiagnostics',
  },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}))

import PrivacySettings from './PrivacySettings.jsx'

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

describe('PrivacySettings', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  const renderPage = () =>
    render(
      <MemoryRouter>
        <CssVarsProvider>
          <PrivacySettings />
        </CssVarsProvider>
      </MemoryRouter>,
    )

  it('renders the privacy hub organized by visibility, household, data, and diagnostics', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'privacy.title' }),
    ).toBeInTheDocument()
    expect(screen.getByText('privacy.profileVisibility')).toBeInTheDocument()
    expect(screen.getByText('privacy.household')).toBeInTheDocument()
    expect(screen.getByText('privacy.dataStorage')).toBeInTheDocument()
    expect(screen.getByText('privacy.diagnostics')).toBeInTheDocument()
  })

  it('persists profile-visibility preferences when toggled', async () => {
    const user = userEvent.setup()
    renderPage()

    const timezoneSwitch = screen
      .getByTestId('privacy-show-timezone')
      .querySelector('input')
    await user.click(timezoneSwitch)

    expect(privacyMock.set).toHaveBeenCalledWith('showTimezone', false)
    expect(privacyMock.set).not.toHaveBeenCalledWith('showEmail', false)
  })

  it('persists the diagnostics opt-out', async () => {
    const user = userEvent.setup()
    renderPage()

    const diagnosticsSwitch = screen
      .getByTestId('privacy-share-diagnostics')
      .querySelector('input')
    await user.click(diagnosticsSwitch)

    expect(privacyMock.set).toHaveBeenCalledWith('shareDiagnostics', false)
  })

  it('links to household, storage, and the privacy policy', () => {
    renderPage()

    expect(
      screen.getByRole('button', { name: 'privacy.manageHousehold' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'privacy.openStorage' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'privacy.readPolicy' }),
    ).toBeInTheDocument()
  })
})

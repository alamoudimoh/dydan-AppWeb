// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  profile: { id: 1, userType: 0, displayName: 'Dana' },
  members: { res: [{ userId: 1, role: 'admin' }] },
}))

vi.mock('../../queries/UserQueries', () => ({
  useUserProfile: () => ({ data: state.profile, isLoading: false }),
  useCircleMembers: () => ({ data: state.members, isLoading: false }),
}))

vi.mock('../../components/FigmaIcon', () => ({
  default: () => null,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}))

import SettingsNav from './SettingsNav.jsx'

describe('SettingsNav', () => {
  afterEach(() => {
    cleanup()
    state.profile = { id: 1, userType: 0, displayName: 'Dana' }
  })

  const renderNav = () =>
    render(
      <MemoryRouter>
        <SettingsNav />
      </MemoryRouter>,
    )

  it('offers Overview and Profile to every account', () => {
    renderNav()

    expect(
      screen.getByRole('link', { name: 'settingsNav.overview' }),
    ).toHaveAttribute('href', '/settings')
    expect(
      screen.getByRole('link', { name: 'settingsNav.profile' }),
    ).toHaveAttribute('href', '/profile')
  })

  it('hides account-management items for child accounts', () => {
    state.profile = { id: 2, userType: 1, displayName: 'Kid' }
    renderNav()

    expect(
      screen.queryByRole('link', { name: 'settingsNav.security' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'settingsNav.twoFactor' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'settingsNav.billing' }),
    ).not.toBeInTheDocument()

    // Personal configuration stays available to everyone.
    expect(
      screen.getByRole('link', { name: 'settingsNav.privacy' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'settingsNav.notifications' }),
    ).toBeInTheDocument()
  })

  it('exposes account management to owners and adults', () => {
    renderNav()

    expect(
      screen.getByRole('link', { name: 'settingsNav.security' }),
    ).toHaveAttribute('href', '/settings/security')
    expect(
      screen.getByRole('link', { name: 'settingsNav.twoFactor' }),
    ).toHaveAttribute('href', '/settings/mfa')
    expect(
      screen.getByRole('link', { name: 'settingsNav.billing' }),
    ).toHaveAttribute('href', '/settings/account')
  })

  it('groups everything under category sections', () => {
    renderNav()

    expect(screen.getByText('settingsNav.accountSecurity')).toBeInTheDocument()
    expect(screen.getByText('settingsNav.preferences')).toBeInTheDocument()
    expect(screen.getByText('settingsNav.privacyGroup')).toBeInTheDocument()
    expect(
      screen.getByText('settingsNav.integrationsGroup'),
    ).toBeInTheDocument()
    expect(screen.getByText('settingsNav.advancedGroup')).toBeInTheDocument()
  })
})

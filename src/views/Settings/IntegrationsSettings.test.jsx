// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  profile: { id: 1, userType: 0, subscription: 'plus' },
  members: { res: [{ userId: 1, role: 'admin' }] },
}))

vi.mock('../../queries/UserQueries', () => ({
  useUserProfile: () => ({ data: state.profile }),
  useCircleMembers: () => ({ data: state.members }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}))

import IntegrationsSettings from './IntegrationsSettings.jsx'

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

describe('IntegrationsSettings', () => {
  afterEach(() => {
    cleanup()
    state.profile = { id: 1, userType: 0, subscription: 'plus' }
    state.members = { res: [{ userId: 1, role: 'admin' }] }
  })

  const renderPage = () =>
    render(
      <MemoryRouter>
        <CssVarsProvider>
          <IntegrationsSettings />
        </CssVarsProvider>
      </MemoryRouter>,
    )

  it('renders the integrations hub with API, webhook, and storage sections', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'integrations.title' }),
    ).toBeInTheDocument()
    expect(screen.getByText('integrations.apiTitle')).toBeInTheDocument()
    expect(screen.getByText('integrations.webhookTitle')).toBeInTheDocument()
    expect(screen.getByText('integrations.storageTitle')).toBeInTheDocument()
  })

  it('lets owners manage tokens and webhooks', () => {
    renderPage()

    expect(
      screen.getByRole('button', { name: 'integrations.manageTokens' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'integrations.webhookOpen' }),
    ).toBeInTheDocument()
  })

  it('keeps management actions away from child accounts', () => {
    state.profile = { id: 2, userType: 1, subscription: 'free' }
    state.members = { res: [] }
    renderPage()

    expect(
      screen.queryByRole('button', { name: 'integrations.manageTokens' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'integrations.webhookOpen' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('integrations.apiTitle')).toBeInTheDocument()
  })
})

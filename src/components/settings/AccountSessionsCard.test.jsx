// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  class SessionApiError extends Error {
    constructor(status) {
      super('Session request failed')
      this.status = status
    }
  }

  return {
    SessionApiError,
    formatDateTime: vi.fn(value => `formatted-${value}`),
    handleLogout: vi.fn(),
    notify: vi.fn(),
    query: {},
    revoke: {},
    revokeOthers: {},
  }
})

const copy = {
  'accountSessions.title': 'Sessions',
  'accountSessions.description': 'Review active sessions',
  'accountSessions.listLabel': 'Active sessions',
  'accountSessions.currentSession': 'Current session',
  'accountSessions.activeSession': 'Active session',
  'accountSessions.currentBadge': 'This device',
  'accountSessions.lastActive': 'Last active: {{date}}',
  'accountSessions.signedIn': 'Signed in: {{date}}',
  'accountSessions.expires': 'Session expires: {{date}}',
  'accountSessions.unknownTime': 'Unknown time',
  'accountSessions.signOut': 'Sign out',
  'accountSessions.signOutOtherSessions': 'Sign out other sessions',
  'accountSessions.signOutCurrentLabel': 'Sign out the current session',
  'accountSessions.signOutSessionLabel':
    'Sign out session last active {{date}}',
  'accountSessions.loading': 'Loading sessions...',
  'accountSessions.emptyTitle': 'No active sessions',
  'accountSessions.emptyDescription': 'No sessions found',
  'accountSessions.loadErrorTitle': "Couldn't load sessions",
  'accountSessions.loadErrorDescription': 'Check your connection',
  'accountSessions.confirmTitle': 'Sign out this session?',
  'accountSessions.confirmMessage': 'Confirm other session',
  'accountSessions.currentConfirmTitle': 'Sign out this device?',
  'accountSessions.currentConfirmMessage': 'Confirm current session',
  'accountSessions.confirmOthersTitle': 'Sign out other sessions?',
  'accountSessions.confirmOthersMessage': 'Confirm all other sessions',
  'accountSessions.cancel': 'Cancel',
  'accountSessions.revokeSuccess': 'Session signed out',
  'accountSessions.revokeOthersSuccess': 'Other sessions signed out',
  'accountSessions.revokeError': 'Session sign out failed',
  'accountSessions.revokeOthersError': 'Other sessions sign out failed',
  'accountSessions.alreadyEnded': 'Session already ended',
  'accountSessions.currentUnknown': 'Sign in again before managing sessions',
  'accountSessions.revocationNotice': 'Access may continue briefly',
  'queryState.retry': 'Try again',
}

const translate = (key, values = {}) =>
  Object.entries(values).reduce(
    (value, [name, replacement]) =>
      value.replace(`{{${name}}}`, String(replacement)),
    copy[key] || key,
  )

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: translate }),
}))

vi.mock('../../contexts/LocalizationContext', () => ({
  useLocalization: () => ({
    fmt: { intlDateTime: mocks.formatDateTime },
  }),
}))

vi.mock('../../queries/SessionQueries', () => ({
  SessionApiError: mocks.SessionApiError,
  useSessions: () => mocks.query,
  useRevokeSession: () => mocks.revoke,
  useRevokeOtherSessions: () => mocks.revokeOthers,
}))

vi.mock('../../service/NotificationProvider', () => ({
  useNotification: () => ({ showNotification: mocks.notify }),
}))

vi.mock('../../utils/ApiClient', () => ({
  apiClient: { handleLogout: mocks.handleLogout },
}))

vi.mock('../../views/Modals/Inputs/ConfirmationModal', () => ({
  default: ({ config }) =>
    config?.isOpen ? (
      <div role='alertdialog' aria-label={config.title}>
        <p>{config.message}</p>
        <button onClick={() => config.onClose(false)}>
          {config.cancelText}
        </button>
        <button onClick={() => config.onClose(true)}>
          {config.confirmText}
        </button>
      </div>
    ) : null,
}))

import AccountSessionsCard from './AccountSessionsCard.jsx'

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

const sessions = [
  {
    id: 'current-family',
    createdAt: 'created-current',
    lastActiveAt: 'last-current',
    expiresAt: 'expires-current',
    current: true,
  },
  {
    id: 'other-family',
    createdAt: 'created-other',
    lastActiveAt: 'last-other',
    expiresAt: 'expires-other',
    current: false,
  },
]

const renderCard = () =>
  render(
    <CssVarsProvider>
      <AccountSessionsCard userId={7} />
    </CssVarsProvider>,
  )

beforeEach(() => {
  mocks.query = {
    data: sessions,
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn().mockResolvedValue({ data: sessions }),
  }
  mocks.revoke = {
    isPending: false,
    variables: null,
    mutateAsync: vi.fn().mockResolvedValue({}),
  }
  mocks.revokeOthers = {
    isPending: false,
    mutateAsync: vi.fn().mockResolvedValue({}),
  }
  mocks.formatDateTime.mockClear()
  mocks.handleLogout.mockReset().mockResolvedValue(undefined)
  mocks.notify.mockClear()
  document.documentElement.dir = 'ltr'
})

afterEach(cleanup)

describe('AccountSessionsCard', () => {
  it('renders the session list and identifies the current session', () => {
    renderCard()

    expect(screen.getByText('Current session')).toBeInTheDocument()
    expect(screen.getByText('This device')).toBeInTheDocument()
    expect(screen.getByText('Active session')).toBeInTheDocument()
    expect(
      screen.getByText('Last active: formatted-last-other'),
    ).toBeInTheDocument()
    expect(mocks.formatDateTime).toHaveBeenCalledWith('last-other', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  })

  it('renders a localized loading state', () => {
    mocks.query = { ...mocks.query, data: undefined, isLoading: true }
    renderCard()
    expect(screen.getByText('Loading sessions...')).toBeInTheDocument()
  })

  it('renders the empty state', () => {
    mocks.query = { ...mocks.query, data: [] }
    renderCard()
    expect(screen.getByText('No active sessions')).toBeInTheDocument()
  })

  it('renders an API error and retries', async () => {
    const user = userEvent.setup()
    mocks.query = {
      ...mocks.query,
      data: undefined,
      error: new Error('network'),
      isError: true,
    }
    renderCard()

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't load sessions",
    )
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(mocks.query.refetch).toHaveBeenCalledTimes(1)
  })

  it('confirms and revokes one other session', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(
      screen.getByRole('button', {
        name: 'Sign out session last active formatted-last-other',
      }),
    )
    const dialog = screen.getByRole('alertdialog', {
      name: 'Sign out this session?',
    })
    await user.click(within(dialog).getByRole('button', { name: 'Sign out' }))

    await waitFor(() =>
      expect(mocks.revoke.mutateAsync).toHaveBeenCalledWith('other-family'),
    )
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'success',
      message: 'Session signed out',
    })
    expect(mocks.query.refetch).toHaveBeenCalledTimes(1)
  })

  it('reports a revoke-one failure without removing the session', async () => {
    const user = userEvent.setup()
    mocks.revoke.mutateAsync.mockRejectedValue(new Error('failed'))
    renderCard()

    await user.click(
      screen.getByRole('button', {
        name: 'Sign out session last active formatted-last-other',
      }),
    )
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Sign out',
      }),
    )

    await waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith({
        type: 'error',
        message: 'Session sign out failed',
      }),
    )
    expect(screen.getByText('Active session')).toBeInTheDocument()
  })

  it('refreshes gracefully when a stale session is already gone', async () => {
    const user = userEvent.setup()
    mocks.revoke.mutateAsync.mockRejectedValue(new mocks.SessionApiError(404))
    renderCard()

    await user.click(
      screen.getByRole('button', {
        name: 'Sign out session last active formatted-last-other',
      }),
    )
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Sign out',
      }),
    )

    await waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith({
        type: 'info',
        message: 'Session already ended',
      }),
    )
    expect(mocks.query.refetch).toHaveBeenCalledTimes(1)
  })

  it('clears local authentication when the stale session is current', async () => {
    const user = userEvent.setup()
    mocks.revoke.mutateAsync.mockRejectedValue(new mocks.SessionApiError(404))
    renderCard()

    await user.click(
      screen.getByRole('button', { name: 'Sign out the current session' }),
    )
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Sign out',
      }),
    )

    await waitFor(() => expect(mocks.handleLogout).toHaveBeenCalledTimes(1))
    expect(mocks.query.refetch).not.toHaveBeenCalled()
  })

  it('confirms and revokes all other sessions', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(
      screen.getByRole('button', { name: 'Sign out other sessions' }),
    )
    const dialog = screen.getByRole('alertdialog', {
      name: 'Sign out other sessions?',
    })
    await user.click(
      within(dialog).getByRole('button', { name: 'Sign out other sessions' }),
    )

    await waitFor(() =>
      expect(mocks.revokeOthers.mutateAsync).toHaveBeenCalledTimes(1),
    )
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'success',
      message: 'Other sessions signed out',
    })
    expect(mocks.query.refetch).toHaveBeenCalledTimes(1)
  })

  it('prevents duplicate destructive submissions', async () => {
    let resolveMutation
    mocks.revoke.mutateAsync.mockImplementation(
      () => new Promise(resolve => (resolveMutation = resolve)),
    )
    renderCard()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sign out session last active formatted-last-other',
      }),
    )
    const confirm = within(screen.getByRole('alertdialog')).getByRole(
      'button',
      {
        name: 'Sign out',
      },
    )
    fireEvent.click(confirm)
    fireEvent.click(confirm)

    expect(mocks.revoke.mutateAsync).toHaveBeenCalledTimes(1)
    resolveMutation({})
    await waitFor(() => expect(mocks.query.refetch).toHaveBeenCalledTimes(1))
  })

  it('cleans up authentication after revoking the current session', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(
      screen.getByRole('button', { name: 'Sign out the current session' }),
    )
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Sign out',
      }),
    )

    await waitFor(() =>
      expect(mocks.revoke.mutateAsync).toHaveBeenCalledWith('current-family'),
    )
    expect(mocks.handleLogout).toHaveBeenCalledTimes(1)
    expect(mocks.query.refetch).not.toHaveBeenCalled()
  })

  it('disables destructive actions when the current session is unknown', () => {
    mocks.query = {
      ...mocks.query,
      data: sessions.map(session => ({ ...session, current: false })),
    }
    renderCard()

    expect(
      screen.getByText('Sign in again before managing sessions'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Sign out other sessions' }),
    ).not.toBeInTheDocument()
    for (const button of screen.getAllByRole('button', {
      name: /Sign out session last active/,
    })) {
      expect(button).toBeDisabled()
    }
  })

  it('keeps destructive actions usable in RTL', () => {
    document.documentElement.dir = 'rtl'
    renderCard()
    expect(
      screen.getByRole('button', { name: 'Sign out other sessions' }),
    ).toBeEnabled()
    expect(screen.getByRole('list', { name: 'Active sessions' })).toBeVisible()
  })
})

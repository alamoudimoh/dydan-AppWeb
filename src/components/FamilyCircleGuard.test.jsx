// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const values = {
        'familyProgress.title': 'Family Progress',
        'familyProgress.subtitle': 'Visibility and shared progress.',
        'familyProgress.noCircleDescription':
          'Family Progress is available after you join or create a family circle.',
        'familyProgress.goToCircleSettings': 'Go to circle settings',
        'familyProgress.backToTasks': 'Back to my tasks',
      }
      return values[key] || key
    },
  }),
}))

const profileMock = vi.hoisted(() => ({
  profile: { id: 1, circleID: 0, userType: 0 },
}))

vi.mock('../queries/UserQueries', () => ({
  useUserProfile: () => ({
    data: profileMock.profile,
    isLoading: false,
  }),
}))

import FamilyCircleGuard from './FamilyCircleGuard.jsx'

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

const renderGuard = children =>
  render(
    <CssVarsProvider>
      <MemoryRouter>
        <FamilyCircleGuard>{children}</FamilyCircleGuard>
      </MemoryRouter>
    </CssVarsProvider>,
  )

describe('FamilyCircleGuard', () => {
  afterEach(() => {
    cleanup()
    profileMock.profile = { id: 1, circleID: 0, userType: 0 }
  })

  it('blocks family content when there is no active circle', () => {
    renderGuard(<div data-testid='family-content'>Family workload</div>)

    expect(screen.queryByTestId('family-content')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Family Progress is available after you join or create a family circle.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to circle settings' }))
      .toBeInTheDocument()
  })

  it('renders family content when the profile has an active circle', () => {
    profileMock.profile = { id: 1, circleID: 3, userType: 0 }

    renderGuard(<div data-testid='family-content'>Family workload</div>)

    expect(screen.getByTestId('family-content')).toBeInTheDocument()
    expect(
      screen.queryByText(
        'Family Progress is available after you join or create a family circle.',
      ),
    ).not.toBeInTheDocument()
  })
})

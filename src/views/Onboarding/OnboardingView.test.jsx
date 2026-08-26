// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const translations = {
  'onboarding.carousel.skip': 'Skip',
  'onboarding.carousel.next': 'Next',
  'onboarding.carousel.getStarted': 'Get started',
  'onboarding.carousel.turnOnReminders': 'Turn on reminders',
  'onboarding.carousel.notNow': 'Not now',
  'onboarding.carousel.ariaLabel': 'What you can do with DayDan',
  'onboarding.carousel.goToStep': 'Go to step {{step}}',
  'onboarding.carousel.slideLabel': '{{index}} of {{count}}',
  'onboarding.slides.problem.title': 'Stop forgetting the little things',
  'onboarding.slides.problem.body': 'DayDan remembers the last time.',
  'onboarding.slides.capture.title': 'Add it before you forget it',
  'onboarding.slides.capture.body': 'Type it, say it, or snap a photo.',
  'onboarding.slides.circle.title': 'Everyone gets a turn',
  'onboarding.slides.circle.body': 'Rotate in the order you pick.',
  'onboarding.slides.reminders.title': 'A nudge right when it matters',
  'onboarding.slides.reminders.body': 'Get a reminder before something is due.',
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options = {}) => {
      const value = key in translations ? translations[key] : key
      return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, placeholder) => {
        return options[placeholder] ?? `{{${placeholder}}}`
      })
    },
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

const mockMarkOnboardingSeen = vi.fn()
const mockRequestNotificationPermission = vi.fn()
vi.mock('../../utils/Onboarding', () => ({
  haptic: vi.fn(),
  markOnboardingSeen: () => mockMarkOnboardingSeen(),
  requestNotificationPermission: () => mockRequestNotificationPermission(),
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

import OnboardingView from './OnboardingView.jsx'

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

describe('OnboardingView', () => {
  it('renders the first slide title and body', () => {
    renderWithProviders(<OnboardingView />)

    expect(
      screen.getByRole('heading', {
        name: 'Stop forgetting the little things',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('DayDan remembers the last time.'),
    ).toBeInTheDocument()
  })

  it('advances to the next slide when Next is clicked', () => {
    renderWithProviders(<OnboardingView />)

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(
      screen.getByRole('heading', { name: 'Add it before you forget it' }),
    ).toBeInTheDocument()
  })

  it('selects a slide when a dot is clicked', () => {
    renderWithProviders(<OnboardingView />)

    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3' }))

    expect(
      screen.getByRole('heading', { name: 'Everyone gets a turn' }),
    ).toBeInTheDocument()
  })

  it('navigates to /get-started when Skip is clicked', () => {
    renderWithProviders(<OnboardingView />)

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))

    expect(mockMarkOnboardingSeen).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/get-started', { replace: true })
  })

  it('shows the reminders prompt on the last slide and finishes on allow', async () => {
    mockRequestNotificationPermission.mockResolvedValue(true)
    renderWithProviders(<OnboardingView />)

    fireEvent.click(screen.getByRole('button', { name: 'Go to step 4' }))
    await screen.findByRole('button', { name: 'Turn on reminders' })

    fireEvent.click(screen.getByRole('button', { name: 'Turn on reminders' }))

    await waitFor(() => {
      expect(mockRequestNotificationPermission).toHaveBeenCalled()
      expect(mockMarkOnboardingSeen).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/get-started', {
        replace: true,
      })
    })
  })
})

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('../../contexts/LocalizationContext', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocalization: () => ({
      availableLanguages: actual.AVAILABLE_LANGUAGES,
      dateFormat: actual.DATE_FORMATS.MDY,
      firstDayOfWeek: 0,
      fmt: {
        date: value => value?.format?.('MM/DD/YYYY') ?? '',
        time: value => value?.format?.('h:mm A') ?? '',
      },
      isRTL: false,
      language: 'en',
      setDateFormat: vi.fn(),
      setFirstDayOfWeek: vi.fn(),
      setLanguage: vi.fn(),
      setTimeFormat: vi.fn(),
      timeFormat: actual.TIME_FORMATS.HOUR_12,
    }),
  }
})

vi.mock('./SettingsLayout', () => ({
  default: ({ children, title }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

import LocalizationSettings from './LocalizationSettings.jsx'

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

describe('LocalizationSettings', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders without useTranslation ReferenceError', async () => {
    render(
      <CssVarsProvider>
        <LocalizationSettings />
      </CssVarsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('localization.title')).toBeInTheDocument()
    })
  })
})

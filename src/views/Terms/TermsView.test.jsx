// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
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

import TermsView from './TermsView.jsx'

describe('TermsView', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the page title as an h1 and effective date', () => {
    render(
      <CssVarsProvider>
        <TermsView />
      </CssVarsProvider>,
    )

    const heading = screen.getByRole('heading', {
      name: 'legal.termsTitle',
      level: 1,
    })
    expect(heading).toBeVisible()
    expect(screen.getByText('legal.effectiveDate')).toBeVisible()
  })

  it('renders section headings as h2 elements', () => {
    render(
      <CssVarsProvider>
        <TermsView />
      </CssVarsProvider>,
    )

    expect(
      screen.getByRole('heading', { name: '1. Definitions', level: 2 }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', {
        name: /legal\.cloudVsSelfHosted/i,
        level: 2,
      }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'legal.contactUs', level: 2 }),
    ).toBeVisible()
  })

  it('renders subsection headings as h3 elements', () => {
    render(
      <CssVarsProvider>
        <TermsView />
      </CssVarsProvider>,
    )

    expect(
      screen.getByRole('heading', {
        name: '3.1 Service Availability and Uptime',
        level: 3,
      }),
    ).toBeVisible()
  })

  it('renders localized chrome keys', () => {
    render(
      <CssVarsProvider>
        <TermsView />
      </CssVarsProvider>,
    )

    expect(screen.getByText('legal.lastUpdated')).toBeVisible()
    expect(screen.getByText('legal.effectiveForNewUsers')).toBeVisible()
  })

  it('renders without errors in RTL context', () => {
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'ar'

    render(
      <CssVarsProvider>
        <TermsView />
      </CssVarsProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'legal.termsTitle', level: 1 }),
    ).toBeVisible()

    document.documentElement.dir = 'ltr'
    document.documentElement.lang = 'en'
  })
})

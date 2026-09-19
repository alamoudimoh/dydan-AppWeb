// @vitest-environment jsdom

const store = {}
vi.stubGlobal('localStorage', {
  getItem: vi.fn(k => store[k] || null),
  setItem: vi.fn((k, v) => {
    store[k] = v
  }),
  removeItem: vi.fn(k => {
    delete store[k]
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach(k => delete store[k])
  }),
  length: 0,
})
import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const navigate = vi.fn()
const setLanguage = vi.fn()

// Mirrors ThemeContext's runtime state harness (brand + mode). The real
// persistence to localStorage is exercised by ThemeContext.test.jsx; here we
// only need the component to observe changes exactly as the context would
// feed them back.
const themeState = {
  brand: 'dydan',
  mode: 'light',
  setBrand: vi.fn(value => {
    themeState.brand = value
  }),
  setMode: vi.fn(value => {
    themeState.mode = value
  }),
}

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}))

vi.mock('../../contexts/ThemeContext', () => ({
  useProductTheme: () => themeState,
}))

vi.mock('../../contexts/LocalizationContext', () => ({
  useLocalization: () => ({ language: 'en', setLanguage }),
}))

vi.mock('../../queries/UserQueries', () => ({
  useUserProfile: () => ({
    data: {
      displayName: 'Avery Child',
      email: 'avery@example.com',
      id: 1,
      userType: 1,
    },
  }),
  useCircleMembers: () => ({ data: { res: [{ role: 'admin', userId: 1 }] } }),
}))

vi.mock('../Modals/ErrorReportModal', () => ({ default: () => null }))
vi.mock('../Modals/FeedbackModal', () => ({ default: () => null }))

// Real English labels for the keys under assertion, sourced from
// public/locales/en/settings.json, so tests verify the user-visible copy
// (Theme / Theme mode / Light/Dark/Automatic) rather than translation keys.
const EN_LABELS = {
  'figmaOverview.appearance': 'Appearance',
  'figmaOverview.productTheme': 'Theme',
  'figmaOverview.themeMode': 'Theme mode',
  'figmaOverview.language': 'Language',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.automatic': 'Automatic',
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) =>
      key === 'figmaOverview.activeMembers'
        ? `${options.count} active members`
        : EN_LABELS[key] || key,
  }),
}))

import SettingsOverview from './SettingsOverview.jsx'

const restore = async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <SettingsOverview />
    </MemoryRouter>,
  )
  return user
}

describe('SettingsOverview', () => {
  beforeEach(() => {
    themeState.brand = 'dydan'
    themeState.mode = 'light'
    themeState.setBrand.mockClear()
    themeState.setMode.mockClear()
  })

  afterEach(() => {
    cleanup()
    navigate.mockReset()
    setLanguage.mockReset()
    localStorage.clear()
  })

  it('persists Light/Dark/Automatic theme selection and follows the OS in Automatic', async () => {
    const user = await restore()
    await user.click(screen.getByRole('button', { name: 'Dark' }))
    expect(themeState.setMode).toHaveBeenCalledWith('dark')
    expect(themeState.mode).toBe('dark')

    await user.click(screen.getByRole('button', { name: 'Automatic' }))
    expect(themeState.setMode).toHaveBeenCalledWith('system')
    expect(themeState.mode).toBe('system')
  })

  it('switches the product theme between Dydan and Sovereign', async () => {
    const user = await restore()
    await user.click(screen.getByRole('button', { name: 'Sovereign' }))
    expect(themeState.setBrand).toHaveBeenCalledWith('sovereign')
    expect(themeState.brand).toBe('sovereign')

    await user.click(screen.getByRole('button', { name: 'Dydan' }))
    expect(themeState.setBrand).toHaveBeenCalledWith('dydan')
    expect(themeState.brand).toBe('dydan')
  })

  it('offers exactly Dydan/Sovereign and Light/Dark/Automatic and never Arabic', async () => {
    await restore()
    const themeBlock = screen
      .getByText('Theme')
      .closest('.figma-settings-theme-block')
    const themeButtons = [
      ...themeBlock.querySelectorAll('.view-toggle button'),
    ].map(button => button.textContent.trim())
    expect(themeButtons).toEqual(['Dydan', 'Sovereign'])

    const modeBlock = screen
      .getByText('Theme mode')
      .closest('.figma-settings-theme-block')
    const modeButtons = [
      ...modeBlock.querySelectorAll('.view-toggle button'),
    ].map(button => button.textContent.trim())
    expect(modeButtons).toEqual(['Light', 'Dark', 'Automatic'])
    expect(modeBlock.textContent).not.toMatch(/System/)
    expect(
      [themeBlock.textContent, modeBlock.textContent].join(' '),
    ).not.toMatch(/[\u0600-\u06FF]/)
    // The language group stays structurally separate from the theme groups.
    const languageGroup = screen.getByText('Language').closest('section')
    expect(languageGroup).not.toBeNull()
  })

  it('restores a previously persisted theme selection on mount', async () => {
    themeState.mode = 'dark'
    await restore()
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('restores a previously persisted product theme on mount', async () => {
    themeState.brand = 'sovereign'
    await restore()
    expect(screen.getByRole('button', { name: 'Sovereign' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Dydan' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})

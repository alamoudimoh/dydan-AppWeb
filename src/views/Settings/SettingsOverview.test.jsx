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
import { afterEach, describe, expect, it, vi } from 'vitest'

const navigate = vi.fn()
const setMode = vi.fn()
const setLanguage = vi.fn()

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}))

vi.mock('@mui/joy', () => ({
  useColorScheme: () => ({ mode: 'light', setMode }),
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
// (Light/Dark/Automatic) rather than translation keys.
const EN_LABELS = {
  'figmaOverview.appearance': 'Appearance',
  'figmaOverview.theme': 'Theme',
  'figmaOverview.defaultView': 'Default home view',
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

describe('SettingsOverview', () => {
  afterEach(() => {
    cleanup()
    navigate.mockReset()
    setMode.mockReset()
    setLanguage.mockReset()
    localStorage.clear()
  })

  it('does not expose guarded account actions to child accounts', () => {
    render(
      <MemoryRouter>
        <SettingsOverview />
      </MemoryRouter>,
    )

    expect(screen.queryByText('figmaOverview.email')).not.toBeInTheDocument()
    expect(
      screen.queryByText('accountSettings.deleteAccount'),
    ).not.toBeInTheDocument()
  })

  it('keeps profile management out of Settings (Profile is its own area)', () => {
    render(
      <MemoryRouter>
        <SettingsOverview />
      </MemoryRouter>,
    )

    expect(
      screen.queryByText('figmaOverview.displayName'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /figmaOverview\.edit/i }),
    ).not.toBeInTheDocument()
  })

  it('opens the existing notification settings instead of persisting mock toggles', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsOverview />
      </MemoryRouter>,
    )

    await user.click(
      screen.getByRole('button', { name: 'figmaOverview.taskReminders' }),
    )

    expect(navigate).toHaveBeenCalledWith('/settings/notifications')
    expect(localStorage.getItem('figmaNotificationOverview')).toBeNull()
  })

  it('persists the Focus/Quest home view preference instead of navigating', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsOverview />
      </MemoryRouter>,
    )

    const quest = screen.getByRole('button', { name: /quest/i })
    await user.click(quest)

    expect(localStorage.getItem('dydan.home.view')).toBe('quest')
    expect(quest).toHaveAttribute('aria-pressed', 'true')
    expect(navigate).not.toHaveBeenCalledWith('/settings/sidepanel')

    await user.click(screen.getByRole('button', { name: /focus/i }))
    expect(localStorage.getItem('dydan.home.view')).toBe('focus')
  })

  it('persists Light/Dark/Automatic theme selection and follows the OS in Automatic', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsOverview />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Dark' }))
    expect(localStorage.getItem('themeMode')).toBe('"dark"')
    expect(setMode).toHaveBeenCalledWith('dark')

    await user.click(screen.getByRole('button', { name: 'Automatic' }))
    // 'system' drives the OS-following mode; only the label is "Automatic".
    expect(localStorage.getItem('themeMode')).toBe('"system"')
    expect(setMode).toHaveBeenCalledWith('system')
  })

  it('offers exactly Light/Dark/Automatic in the Theme block and never Arabic', () => {
    render(
      <MemoryRouter>
        <SettingsOverview />
      </MemoryRouter>,
    )

    const themeBlock = screen.getByText('Theme').closest(
      '.figma-settings-theme-block',
    )
    const buttons = [...themeBlock.querySelectorAll('.view-toggle button')].map(
      b => b.textContent.trim(),
    )

    // Exactly the three expected choices, in order — nothing else leaks in.
    expect(buttons).toEqual(['Light', 'Dark', 'Automatic'])
    // No brand picker, no "System" spelling, no Arabic copy in the theme area.
    expect(themeBlock.textContent).not.toMatch(/System/)
    expect(themeBlock.textContent).not.toMatch(/[\u0600-\u06FF]/)
    // The language group stays structurally separate from the theme group.
    const languageBlock = screen.getByText('Language').closest('section')
    expect(languageBlock.textContent).toContain('English')
    expect(languageBlock.textContent).toContain('العربية')
  })

  it('restores a previously persisted theme selection on mount', () => {
    localStorage.setItem('themeMode', '"dark"')
    render(
      <MemoryRouter>
        <SettingsOverview />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('selects language with an Arabic label while keeping the Theme block free of Arabic', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsOverview />
      </MemoryRouter>,
    )

    const arabic = screen.getByRole('button', { name: 'العربية' })
    expect(arabic).toHaveAttribute('aria-pressed', 'false')
    await user.click(arabic)

    expect(setLanguage).toHaveBeenCalledWith('ar-SA')
    // No manual right-to-left control remains.
    expect(screen.queryByText('figmaOverview.rtl')).not.toBeInTheDocument()
    expect(
      screen.queryByText('figmaOverview.defaultViewHelp'),
    ).not.toBeInTheDocument()
    // Choosing Arabic never touches the shared theme choices or renders them in Arabic.
    expect(setMode).not.toHaveBeenCalled()
    const themeBlock = screen.getByText('Theme').closest(
      '.figma-settings-theme-block',
    )
    expect(themeBlock.textContent).not.toMatch(/[\u0600-\u06FF]/)
  })
})

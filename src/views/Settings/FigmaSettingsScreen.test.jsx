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
vi.stubGlobal('matchMedia', query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)
import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const navigate = vi.fn()
const setLanguage = vi.fn()

// Mirrors ThemeContext's runtime state harness (brand + mode), as in
// SettingsOverview.test.jsx. FigmaSettingsScreen only reads brand/setBrand.
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
  useLocalization: () => ({
    isRTL: false,
    language: 'en',
    setLanguage,
  }),
}))

// Invocation of the real useHomeData module pulls in the full query layer;
// the ported screen only needs the view resolver.
vi.mock('../Home/useHomeData', () => ({
  resolveHomeView: () => 'focus',
}))

// ApiClient imports Capacitor/wasm-adjacent dependencies; a stub is enough for
// the handful of ctx actions the logo/avatar flow can trigger.
vi.mock('../../utils/ApiClient', () => ({
  apiClient: { handleLogout: vi.fn() },
}))

import FigmaSettingsScreen from './FigmaSettingsScreen.jsx'

const restore = async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <FigmaSettingsScreen />
    </MemoryRouter>,
  )
  return user
}

describe('FigmaSettingsScreen (PE2 settings port)', () => {
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

  it('renders the single-tabbed PE2 settings screen with the full tab strip', async () => {
    await restore()

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Two-factor authentication' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Household accounts' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Language & region' }),
    ).toBeInTheDocument()
  })

  it('shows the current user (Sarah) as admin with the premium household badge', async () => {
    await restore()

    expect(screen.getByText('Sarah')).toBeInTheDocument()
    expect(screen.getByText('sarah@mitchells.home')).toBeInTheDocument()
    expect(screen.getByText('Family · Premium')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Edit profile' }),
    ).toBeInTheDocument()
  })

  it('routes a PE2 tab to its real Dydan settings surface', async () => {
    const user = await restore()

    await user.click(screen.getByRole('tab', { name: 'Developer' }))
    expect(navigate).toHaveBeenCalledWith('/settings/developer')
  })

  it('routes the PE2 Theme tab to Dydan’s persisted theme settings', async () => {
    const user = await restore()

    await user.click(screen.getByRole('tab', { name: 'Theme' }))
    expect(navigate).toHaveBeenCalledWith('/settings/theme')
  })
})

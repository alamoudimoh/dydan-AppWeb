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

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const joySetMode = vi.fn()

vi.mock('@mui/joy', () => ({
  CssBaseline: () => null,
  GlobalStyles: () => null,
}))

vi.mock('@mui/joy/styles', () => ({
  CssVarsProvider: ({ children }) => children,
  extendTheme: theme => theme,
  useColorScheme: () => ({ setMode: joySetMode }),
}))

let ThemeContext
let useProductTheme

const Probe = () => {
  const { brand, mode, setBrand, setMode } = useProductTheme()
  return (
    <div>
      <output data-testid='brand'>{brand}</output>
      <output data-testid='mode'>{mode}</output>
      <button onClick={() => setBrand('sovereign')}>to-sovereign</button>
      <button onClick={() => setBrand('dydan')}>to-dydan</button>
      <button onClick={() => setMode('dark')}>to-dark</button>
      <button onClick={() => setMode('system')}>to-system</button>
    </div>
  )
}

const renderWithTheme = () =>
  render(
    <ThemeContext>
      <Probe />
    </ThemeContext>,
  )

describe('ThemeContext', () => {
  beforeEach(async () => {
    Object.keys(store).forEach(k => delete store[k])
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    joySetMode.mockClear()
    vi.resetModules()
    ThemeContext = (await import('./ThemeContext.jsx')).default
    useProductTheme = (await import('./ThemeContext.jsx')).useProductTheme
  })

  afterEach(() => {
    cleanup()
  })

  it('defaults to the build brand and system mode, syncing data-theme and Joy', async () => {
    renderWithTheme()
    expect(screen.getByTestId('brand')).toHaveTextContent('dydan')
    expect(screen.getByTestId('mode')).toHaveTextContent('system')
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe('dydan'),
    )
    expect(joySetMode).toHaveBeenCalledWith('system')
  })

  it('persists brand changes and applies them to the html theme attribute', async () => {
    const user = userEvent.setup()
    renderWithTheme()
    await user.click(screen.getByRole('button', { name: 'to-sovereign' }))
    await waitFor(() =>
      expect(screen.getByTestId('brand')).toHaveTextContent('sovereign'),
    )
    expect(window.localStorage.getItem('dydan.theme')).toBe('sovereign')
    expect(document.documentElement.dataset.theme).toBe('sovereign')

    await user.click(screen.getByRole('button', { name: 'to-dydan' }))
    await waitFor(() =>
      expect(screen.getByTestId('brand')).toHaveTextContent('dydan'),
    )
    expect(window.localStorage.getItem('dydan.theme')).toBe('dydan')
    expect(document.documentElement.dataset.theme).toBe('dydan')
  })

  it('persists mode changes and drives Joy color scheme switching', async () => {
    const user = userEvent.setup()
    renderWithTheme()
    await user.click(screen.getByRole('button', { name: 'to-dark' }))
    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('dark'),
    )
    expect(window.localStorage.getItem('themeMode')).toBe('"dark"')
    expect(joySetMode).toHaveBeenCalledWith('dark')

    await user.click(screen.getByRole('button', { name: 'to-system' }))
    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('system'),
    )
    expect(window.localStorage.getItem('themeMode')).toBe('"system"')
    expect(joySetMode).toHaveBeenCalledWith('system')
  })

  it('restores a persisted brand and mode on mount', async () => {
    window.localStorage.setItem('dydan.theme', 'sovereign')
    window.localStorage.setItem('themeMode', JSON.stringify('dark'))
    renderWithTheme()
    expect(screen.getByTestId('brand')).toHaveTextContent('sovereign')
    expect(screen.getByTestId('mode')).toHaveTextContent('dark')
    await waitFor(() => expect(joySetMode).toHaveBeenCalledWith('dark'))
    expect(document.documentElement.dataset.theme).toBe('sovereign')
  })
})

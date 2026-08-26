// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@mui/joy', async importOriginal => ({
  ...(await importOriginal()),
  useColorScheme: () => ({ mode: 'light', systemMode: 'light' }),
}))

vi.mock('./contexts/ThemeContext', () => ({
  default: ({ children }) => children,
}))

vi.mock('./contexts/LocalizationContext', () => ({
  LocalizationProvider: ({ children }) => children,
}))

vi.mock('./contexts/ImpersonateUserContext', () => ({
  ImpersonateUserProvider: ({ children }) => children,
}))

vi.mock('./views/Landing/Landing', () => ({
  default: () => <main>Marketing landing</main>,
}))

import MarketingApp from './MarketingApp'

describe('MarketingApp', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    localStorage.clear()
    const root = document.createElement('div')
    root.id = 'root'
    document.body.append(root)
  })

  afterEach(() => {
    cleanup()
    document.getElementById('root')?.remove()
  })

  it('mounts the production marketing route without a runtime error', async () => {
    render(<MarketingApp />, { container: document.getElementById('root') })

    expect(await screen.findByText('Marketing landing')).toBeVisible()
  })
})

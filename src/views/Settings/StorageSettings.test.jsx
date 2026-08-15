// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('../../queries/UserQueries', () => ({
  useUserProfile: () => ({
    data: { id: 1 },
    isLoading: false,
    error: null,
  }),
}))

vi.mock('../../utils/Fetcher', () => ({
  GetStorageUsage: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ res: { used: 0, total: 1024 } }),
  }),
}))

vi.mock('../../utils/Helpers', () => ({
  isPlusAccount: () => false,
}))

vi.mock('./SettingsLayout', () => ({
  default: ({ children, title }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

vi.mock('../Modals/Inputs/ConfirmationModal', () => ({
  default: () => null,
}))

import StorageSettings from './StorageSettings.jsx'

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

describe('StorageSettings', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders without Box ReferenceError', async () => {
    render(
      <MemoryRouter>
        <CssVarsProvider>
          <StorageSettings />
        </CssVarsProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Server Storage Usage')).toBeInTheDocument()
    })
  })
})

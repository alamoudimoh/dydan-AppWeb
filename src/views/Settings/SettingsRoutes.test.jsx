// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  profile: { id: 1, userType: 0, displayName: 'Dana' },
  members: { res: [{ userId: 1, role: 'admin' }] },
}))

vi.mock('../../queries/UserQueries', () => ({
  useUserProfile: () => ({ data: authState.profile, isLoading: false }),
  useCircleMembers: () => ({ data: authState.members, isLoading: false }),
}))

vi.mock('../../components/FigmaIcon', () => ({
  default: () => null,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}))

import SettingsRoutes from './SettingsRoutes.jsx'

describe('SettingsRoutes', () => {
  afterEach(() => {
    cleanup()
    authState.profile = { id: 1, userType: 0, displayName: 'Dana' }
  })

  it('renders the settings index bare, without the shell wrapper', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path='/settings' element={<SettingsRoutes />}>
            <Route index element={<div>overview panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(document.querySelector('.figma-settings-shell')).toBeNull()
    expect(document.querySelector('.figma-settings-nav')).toBeNull()
    expect(document.querySelector('.figma-settings-content')).toBeNull()
    expect(screen.getByText('overview panel')).toBeInTheDocument()
  })

  it('renders the settings tab strip above detail route content', () => {
    render(
      <MemoryRouter initialEntries={['/settings/detailed']}>
        <Routes>
          <Route path='/settings' element={<SettingsRoutes />}>
            <Route index element={<div>overview panel</div>} />
            <Route path='detailed' element={<div>detail panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const shell = document.querySelector('.figma-settings-shell')
    const nav = document.querySelector('.figma-settings-nav')
    const content = document.querySelector('.figma-settings-content')

    expect(shell).not.toBeNull()
    expect(nav).not.toBeNull()
    expect(content).not.toBeNull()

    // The navigation is the first child of the shell (the horizontal tab
    // strip sits on top), and the detail route renders inside the content
    // area below it.
    expect(shell.firstElementChild).toBe(nav)
    expect(nav).toContainElement(screen.getByLabelText('settingsNav.title'))
    expect(content).toContainElement(screen.getByText('detail panel'))
    expect(
      screen.getByRole('link', { name: 'settingsNav.overview' }),
    ).toHaveAttribute('href', '/settings')
    expect(
      screen.getByRole('link', { name: 'settingsNav.profile' }),
    ).toHaveAttribute('href', '/profile')
  })
})

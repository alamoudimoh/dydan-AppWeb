// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaProjectsScreen from './FigmaProjectsScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaProjectsScreen />)
  return user
}

describe('FigmaProjectsScreen (PE2 Projects port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 Projects header and project cards', () => {
    renderScreen()

    expect(
      screen.getByRole('heading', { name: 'Projects' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Organized work with multiple tasks'),
    ).toBeInTheDocument()
    expect(screen.getByText('Science Fair Project')).toBeInTheDocument()
    expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument()
    expect(screen.getByText('Garden Revamp')).toBeInTheDocument()
  })

  it('shows the selected project task list on card click', async () => {
    const user = renderScreen()

    await user.click(screen.getByText('Science Fair Project'))

    expect(screen.getByText('Science project research')).toBeInTheDocument()
  })

  it('opens the create-task modal from New project', async () => {
    const user = renderScreen()

    await user.click(screen.getAllByRole('button', { name: 'New project' })[0])

    expect(
      screen.getByRole('heading', { name: 'New task' }),
    ).toBeInTheDocument()
  })
})

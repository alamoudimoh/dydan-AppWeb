// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaRoutinesScreen from './FigmaRoutinesScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaRoutinesScreen />)
  return user
}

describe('FigmaRoutinesScreen (PE2 Routines port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 Routines header and routine cards', () => {
    renderScreen()

    expect(
      screen.getByRole('heading', { name: 'Routines' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Recurring daily and weekly flows'),
    ).toBeInTheDocument()
    expect(screen.getByText('Morning Routine')).toBeInTheDocument()
    expect(screen.getByText('Evening Wind-down')).toBeInTheDocument()
    expect(screen.getByText('Weekly House Clean')).toBeInTheDocument()
    expect(screen.getByText('School Morning')).toBeInTheDocument()
  })

  it('expands the default routine steps', () => {
    renderScreen()

    expect(screen.getByText('Steps in this routine')).toBeInTheDocument()
  })

  it('opens the create-routine panel', async () => {
    const user = renderScreen()

    await user.click(screen.getByRole('button', { name: 'New routine' }))

    expect(
      screen.getByRole('button', { name: 'Create routine' }),
    ).toBeInTheDocument()
  })
})

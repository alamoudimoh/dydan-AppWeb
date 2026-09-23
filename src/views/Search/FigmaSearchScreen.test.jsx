// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaSearchScreen from './FigmaSearchScreen.jsx'

const PLACEHOLDER = 'Search tasks, projects, routines, shopping...'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaSearchScreen />)
  return user
}

describe('FigmaSearchScreen (PE2 Search port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the initial search prompt', () => {
    renderScreen()

    expect(screen.getByText('Search everything')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument()
  })

  it('finds tasks by title', async () => {
    const user = renderScreen()

    await user.type(screen.getByPlaceholderText(PLACEHOLDER), 'electricity')

    expect(screen.getByText('Tasks (1)')).toBeInTheDocument()
    expect(screen.getByText('Pay electricity bill')).toBeInTheDocument()
  })

  it('finds shopping items', async () => {
    const user = renderScreen()

    await user.type(screen.getByPlaceholderText(PLACEHOLDER), 'milk')

    expect(screen.getByText('Shopping (1)')).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })
})

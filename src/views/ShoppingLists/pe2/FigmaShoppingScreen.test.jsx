// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaShoppingScreen from './FigmaShoppingScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaShoppingScreen />)
  return user
}

describe('FigmaShoppingScreen (PE2 Shopping port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 Shopping header and lists', () => {
    renderScreen()

    expect(
      screen.getByRole('heading', { name: 'Shopping' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Personal and shared household lists'),
    ).toBeInTheDocument()
    expect(screen.getByText('School Supplies')).toBeInTheDocument()
    expect(screen.getByText('Hardware Store')).toBeInTheDocument()
    expect(screen.getAllByText('Groceries').length).toBeGreaterThan(0)
    expect(screen.getByText('Whole milk (2L)')).toBeInTheDocument()
  })

  it('adds an item to the active list', async () => {
    const user = renderScreen()

    await user.type(screen.getByPlaceholderText('Add an item...'), 'Test item')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Test item')).toBeInTheDocument()
    expect(screen.getByText('"Test item" added')).toBeInTheDocument()
  })
})

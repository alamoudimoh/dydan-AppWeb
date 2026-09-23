// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaGoalsScreen from './FigmaGoalsScreen.jsx'

const renderScreen = () => {
  render(<FigmaGoalsScreen />)
}

describe('FigmaGoalsScreen (PE2 Goals port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 Goals header and points summary', () => {
    renderScreen()

    expect(
      screen.getByRole('heading', { name: 'Goals & Progress' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Track what you're working toward"),
    ).toBeInTheDocument()
    expect(screen.getByText("Sarah's points")).toBeInTheDocument()
  })

  it('renders family, personal goals and rewards', () => {
    renderScreen()

    expect(screen.getByText('Family goals')).toBeInTheDocument()
    expect(screen.getByText('Personal goals')).toBeInTheDocument()
    expect(screen.getByText('100 Household Chores')).toBeInTheDocument()
    expect(screen.getByText('Movie Night')).toBeInTheDocument()
  })
})

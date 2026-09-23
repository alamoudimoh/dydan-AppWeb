// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaProgressScreen from './FigmaProgressScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaProgressScreen />)
  return user
}

describe('FigmaProgressScreen (PE2 Progress port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 Progress header and report sections', () => {
    renderScreen()

    expect(
      screen.getByRole('heading', { name: 'Progress' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Household workload and completion reporting'),
    ).toBeInTheDocument()
    expect(screen.getByText('Completion by member')).toBeInTheDocument()
    expect(screen.getByText('By category')).toBeInTheDocument()
    expect(screen.getByText('Workload overview')).toBeInTheDocument()
    expect(screen.getByText('Recent activity')).toBeInTheDocument()
    expect(screen.getByText('Completion rate')).toBeInTheDocument()
  })

  it('renders member rows and goal progress', () => {
    renderScreen()

    expect(screen.getByText('Sarah')).toBeInTheDocument()
    expect(screen.getByText('Liam — 20-Day School Streak')).toBeInTheDocument()
  })

  it('switches the reporting range', async () => {
    const user = renderScreen()

    await user.click(screen.getByRole('button', { name: '90 days' }))

    expect(
      screen.getByRole('heading', { name: 'Progress' }),
    ).toBeInTheDocument()
  })
})

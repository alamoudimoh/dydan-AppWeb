// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaActivityScreen from './FigmaActivityScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaActivityScreen />)
  return user
}

describe('FigmaActivityScreen (PE2 Activity port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 Activity header and feed', () => {
    renderScreen()

    expect(
      screen.getByRole('heading', { name: 'Activity' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Recent actions across your household'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByText('Liam completed Feed Biscuit')).toBeInTheDocument()
  })

  it('filters the feed by type', async () => {
    const user = renderScreen()

    await user.click(screen.getByRole('button', { name: 'Rewards' }))

    expect(
      screen.getByText('Liam redeemed Extra Screen Time'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Liam completed Feed Biscuit'),
    ).not.toBeInTheDocument()
  })
})

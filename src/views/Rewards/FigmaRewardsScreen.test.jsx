// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaRewardsScreen from './FigmaRewardsScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaRewardsScreen />)
  return user
}

describe('FigmaRewardsScreen (PE2 Rewards port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 Rewards header, points banner and tabs', () => {
    renderScreen()

    expect(screen.getByRole('heading', { name: 'Rewards' })).toBeInTheDocument()
    expect(screen.getByText('Earn points, redeem rewards')).toBeInTheDocument()
    expect(screen.getByText("Sarah's Points")).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /My Requests/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Pending Approval/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Movie Night')).toBeInTheDocument()
  })

  it('shows the empty state on the My Requests tab', async () => {
    const user = renderScreen()

    await user.click(screen.getByRole('button', { name: /My Requests/ }))

    expect(screen.getByText('No requests yet')).toBeInTheDocument()
  })

  it('lists pending requests on the admin tab', async () => {
    const user = renderScreen()

    await user.click(screen.getByRole('button', { name: /Pending Approval/ }))

    expect(screen.getByText('Takeaway Night')).toBeInTheDocument()
    expect(screen.getByText('Requested by Liam')).toBeInTheDocument()
  })
})

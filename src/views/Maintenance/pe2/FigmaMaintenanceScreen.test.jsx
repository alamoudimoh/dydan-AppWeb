// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaMaintenanceScreen from './FigmaMaintenanceScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaMaintenanceScreen />)
  return user
}

describe('FigmaMaintenanceScreen (PE2 Maintenance port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 Maintenance header and alert banner', () => {
    renderScreen()

    expect(
      screen.getByRole('heading', { name: 'Maintenance' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Assets, meters, and smart-home things'),
    ).toBeInTheDocument()
    expect(screen.getByText('4 items need attention')).toBeInTheDocument()
    expect(screen.getByText('HVAC Air Filter')).toBeInTheDocument()
  })

  it('switches to the meters tab', async () => {
    const user = renderScreen()

    await user.click(screen.getByRole('button', { name: /Meters/ }))

    expect(screen.getByText('Water Meter')).toBeInTheDocument()
    expect(screen.getByText('Electricity Meter')).toBeInTheDocument()
  })

  it('switches to the things tab and groups by category', async () => {
    const user = renderScreen()

    await user.click(screen.getByRole('button', { name: /Things/ }))

    expect(screen.getByText('Front Door')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
  })
})

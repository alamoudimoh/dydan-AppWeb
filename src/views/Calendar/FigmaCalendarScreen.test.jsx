// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaCalendarScreen from './FigmaCalendarScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaCalendarScreen />)
  return user
}

describe('FigmaCalendarScreen (PE2 calendar port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 calendar header with the August 2026 month grid', () => {
    renderScreen()

    expect(
      screen.getByRole('heading', { name: 'Calendar' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Scheduled tasks and events')).toBeInTheDocument()
    expect(screen.getByText('August 2026')).toBeInTheDocument()
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })

  it('shows the selected day (15 Aug) detail with its events and tasks', () => {
    renderScreen()

    expect(screen.getByText('Sat, 15 August')).toBeInTheDocument()
    // Events on 15 Aug: School drop-off + Weekly house clean (deduplicated
    // against same-titled tasks) render in the day panel and grid cells.
    expect(screen.getAllByText('School drop-off').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Weekly house clean').length).toBeGreaterThan(0)
    // Tasks due on 15 Aug render in the day detail panel.
    expect(
      screen.getByText('Do homework — maths chapter 4'),
    ).toBeInTheDocument()
    expect(screen.getByText('Vacuum living room & hallway')).toBeInTheDocument()
  })

  it('lists upcoming events from the selected date', () => {
    renderScreen()

    expect(screen.getByText('Upcoming events')).toBeInTheDocument()
    // ce3 (16 Aug) is inside the first five upcoming events.
    expect(screen.getAllByText('Grocery run').length).toBeGreaterThan(0)
  })

  it('opens the create-task modal from the Add button', async () => {
    const user = renderScreen()

    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(
      screen.getByRole('heading', { name: 'New task' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create task' }),
    ).toBeInTheDocument()
  })

  it('opens the task detail drawer when a day task is clicked', async () => {
    const user = renderScreen()

    await user.click(screen.getByText('Vacuum living room & hallway'))

    expect(
      screen.getByRole('button', { name: 'Mark done' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Assigned to')).toBeInTheDocument()
  })
})

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaTasksScreen from './FigmaTasksScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaTasksScreen />)
  return user
}

describe('FigmaTasksScreen (PE2 All Tasks port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 All Tasks header with the fixture count', () => {
    renderScreen()

    expect(
      screen.getByRole('heading', { name: 'All Tasks' }),
    ).toBeInTheDocument()
    expect(screen.getByText('17 tasks')).toBeInTheDocument()
  })

  it('shows the status summary chips for the fixture data', () => {
    renderScreen()

    expect(screen.getByText('1 overdue')).toBeInTheDocument()
    expect(screen.getByText('5 to do')).toBeInTheDocument()
    expect(screen.getByText('5 upcoming')).toBeInTheDocument()
    expect(screen.getByText('6 done')).toBeInTheDocument()
  })

  it('groups tasks by status with the PE2 group labels', () => {
    renderScreen()

    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('To do')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Pay electricity bill')).toBeInTheDocument()
    expect(screen.getByText('Vacuum living room & hallway')).toBeInTheDocument()
  })

  it('filters by search text', async () => {
    const user = renderScreen()

    await user.type(
      screen.getByPlaceholderText('Search tasks...'),
      'electricity',
    )

    expect(
      screen.getByText('1 task matching "electricity"'),
    ).toBeInTheDocument()
  })

  it('opens the create-task modal from the New task button', async () => {
    const user = renderScreen()

    await user.click(screen.getByRole('button', { name: 'New task' }))

    expect(
      screen.getByRole('heading', { name: 'New task' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create task' }),
    ).toBeInTheDocument()
  })

  it('completes a task from its check and shows the toast', async () => {
    const user = renderScreen()

    const row = screen.getByText('Pay electricity bill').closest('.task-row')
    await user.click(row.querySelector('.task-check'))

    expect(screen.getByText('Task completed ✓')).toBeInTheDocument()
    expect(screen.queryByText('1 overdue')).not.toBeInTheDocument()
  })
})

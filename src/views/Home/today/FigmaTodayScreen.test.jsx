// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaTodayScreen from './FigmaTodayScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaTodayScreen />)
  return user
}

describe('FigmaTodayScreen (PE2 Today port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 Today header and fixture totals', () => {
    renderScreen()

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByText('3 of 8 tasks complete')).toBeInTheDocument()
    expect(screen.getByText('+35 pts')).toBeInTheDocument()
    expect(screen.getByText('Daily progress')).toBeInTheDocument()
  })

  it('renders the todo and completed groups', () => {
    renderScreen()

    expect(screen.getByText('To do')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('renders the household member cards', () => {
    renderScreen()

    expect(screen.getByText('Household members')).toBeInTheDocument()
    expect(screen.getByText('Sarah')).toBeInTheDocument()
    expect(screen.getByText('Daniel')).toBeInTheDocument()
    expect(screen.getByText('Liam')).toBeInTheDocument()
  })

  it('opens the create-task modal from New task', async () => {
    const user = renderScreen()

    await user.click(screen.getByRole('button', { name: 'New task' }))

    expect(
      screen.getByRole('heading', { name: 'New task' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create task' }),
    ).toBeInTheDocument()
  })
})

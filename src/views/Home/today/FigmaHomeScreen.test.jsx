// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { TASKS } from '../../../pe2/fixtures.js'
import FigmaHomeScreen, { QuestHome } from './FigmaHomeScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaHomeScreen />)
  return user
}

describe('FigmaHomeScreen (PE2 home port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 FocusHome greeting and stat cards', () => {
    renderScreen()

    expect(
      screen.getByRole('heading', { name: 'Good morning, Sarah' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Done today')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.getByText('House streak')).toBeInTheDocument()
  })

  it('renders the today, coming up, projects and activity sections', () => {
    renderScreen()

    expect(screen.getByText('Coming up')).toBeInTheDocument()
    expect(screen.getByText('Active projects')).toBeInTheDocument()
    expect(screen.getByText('Recent activity')).toBeInTheDocument()
    expect(screen.getByText('Household workload')).toBeInTheDocument()
  })

  it('opens the create-task modal from the header New task button', async () => {
    const user = renderScreen()

    await user.click(screen.getAllByRole('button', { name: 'New task' })[0])

    expect(
      screen.getByRole('heading', { name: 'New task' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create task' }),
    ).toBeInTheDocument()
  })

  it('renders the QuestHome variant for the child persona', () => {
    render(
      <QuestHome
        ctx={{
          persona: 'child',
          navigate: () => {},
          openTask: () => {},
          openCreate: () => {},
        }}
        tasks={TASKS}
        isSolo={false}
        onComplete={() => {}}
      />,
    )

    expect(screen.getByText('Quest Mode')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Hey, Liam! 👋' }),
    ).toBeInTheDocument()
    expect(screen.getByText('My quests today')).toBeInTheDocument()
    expect(screen.getByText('My goals')).toBeInTheDocument()
  })
})

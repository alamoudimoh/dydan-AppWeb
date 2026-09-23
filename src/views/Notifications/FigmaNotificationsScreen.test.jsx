// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import FigmaNotificationsScreen from './FigmaNotificationsScreen.jsx'

const renderScreen = () => {
  const user = userEvent.setup()
  render(<FigmaNotificationsScreen />)
  return user
}

describe('FigmaNotificationsScreen (PE2 Notifications port)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the PE2 Notifications header and unread count', () => {
    renderScreen()

    expect(
      screen.getByRole('heading', { name: 'Notifications' }),
    ).toBeInTheDocument()
    expect(screen.getByText('4 unread')).toBeInTheDocument()
    expect(screen.getByText('Task overdue')).toBeInTheDocument()
    expect(screen.getByText('Pending reward requests')).toBeInTheDocument()
  })

  it('marks all notifications read', async () => {
    const user = renderScreen()

    await user.click(screen.getByRole('button', { name: 'Mark all read' }))

    expect(screen.getByText('All caught up')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Mark all read' }),
    ).not.toBeInTheDocument()
  })
})

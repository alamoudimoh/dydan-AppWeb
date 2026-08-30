// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../components/common/AppModal', () => ({
  default: ({ children }) => children,
}))

import GlobalSearchPalette from './GlobalSearchPalette.jsx'

const documents = [
  { id: 'task-1', provider: 'tasks', route: '/chores/1', title: 'Buy milk' },
  {
    id: 'project-1',
    provider: 'projects',
    route: '/projects/',
    title: 'Kitchen refresh',
  },
]

describe('GlobalSearchPalette', () => {
  afterEach(cleanup)

  it('uses the Figma empty state and groups live provider results', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <GlobalSearchPalette
          documents={documents}
          initialQuery=''
          isLoading={false}
          onClose={vi.fn()}
          presentation='page'
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Search everything')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox'), 'milk')
    expect(screen.getByText('Tasks (1)')).toBeInTheDocument()
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('clears the query from the literal clear control', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <GlobalSearchPalette
          documents={documents}
          initialQuery='milk'
          isLoading={false}
          onClose={vi.fn()}
          presentation='page'
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByText('Search everything')).toBeInTheDocument()
  })
})

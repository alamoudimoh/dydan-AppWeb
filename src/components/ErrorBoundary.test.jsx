// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import ErrorBoundary from './ErrorBoundary.jsx'

const Broken = ({ shouldThrow }) => {
  if (shouldThrow) throw new Error('broken')
  return <div>Recovered</div>
}

describe('ErrorBoundary', () => {
  it('uses the Figma error card and retries the child tree', async () => {
    const user = userEvent.setup()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { rerender } = render(
      <ErrorBoundary>
        <Broken shouldThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    rerender(
      <ErrorBoundary>
        <Broken shouldThrow={false} />
      </ErrorBoundary>,
    )
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(screen.getByText('Recovered')).toBeInTheDocument()
    errorSpy.mockRestore()
  })
})

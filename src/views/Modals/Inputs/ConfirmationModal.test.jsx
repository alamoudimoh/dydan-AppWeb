// @vitest-environment jsdom
/* eslint-disable react/prop-types */

import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../hooks/useResponsiveModal', () => ({
  useResponsiveModal: () => ({
    ResponsiveModal: ({ children, footer, open, role, title }) =>
      open ? (
        <div role={role} aria-label={title}>
          {children}
          {footer}
        </div>
      ) : (
        <div hidden>
          {children}
          {footer}
        </div>
      ),
  }),
}))

import ConfirmationModal from './ConfirmationModal.jsx'

const dangerConfig = onClose => ({
  isOpen: true,
  title: 'Sign out?',
  message: 'This action ends a session.',
  confirmText: 'Sign out',
  cancelText: 'Cancel',
  color: 'danger',
  onClose,
})

describe('ConfirmationModal destructive actions', () => {
  it('focuses the safe cancel action first', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <ConfirmationModal
        config={{ ...dangerConfig(onClose), isOpen: false }}
      />,
    )

    rerender(<ConfirmationModal config={dangerConfig(onClose)} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('does not confirm a destructive action through the redo shortcut', () => {
    const onClose = vi.fn()
    render(<ConfirmationModal config={dangerConfig(onClose)} />)

    fireEvent.keyDown(document, { ctrlKey: true, key: 'y' })
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledWith(false)
  })
})

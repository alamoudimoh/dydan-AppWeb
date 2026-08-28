// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  report: {
    reportId: 'RPT-TEST-1234',
    message: 'Something broke',
  },
}))

vi.mock('../../hooks/useResponsiveModal', () => ({
  useResponsiveModal: () => ({
    ResponsiveModal: ({ children, open }) =>
      open ? <div role='dialog'>{children}</div> : null,
  }),
}))

vi.mock('../../service/ErrorReportService', () => ({
  collectErrorReport: vi.fn().mockResolvedValue(mocks.report),
  formatErrorReport: vi.fn(() => 'Report-ID: RPT-TEST-1234\nStack: demo'),
  submitErrorReport: vi.fn(),
  SUBMIT_RESULT: {
    SENT: 'sent',
    FAILED: 'failed',
    UNCONFIGURED: 'unconfigured',
    MISCONFIGURED: 'misconfigured',
    SELF_HOSTED: 'self-hosted',
  },
}))

import * as Clipboard from '../../utils/Clipboard.js'
import ErrorReportModal from './ErrorReportModal.jsx'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const renderModal = () =>
  render(
    <CssVarsProvider>
      <ErrorReportModal
        open
        onClose={vi.fn()}
        error={new Error('Dashboard failed')}
      />
    </CssVarsProvider>,
  )

const installInsecureClipboard = () => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: {
      writeText: vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
        ),
    },
  })
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    writable: true,
    value: false,
  })
}

describe('ErrorReportModal copy diagnostics', () => {
  let execCommand
  let copySpy

  beforeEach(() => {
    execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand
    installInsecureClipboard()
    copySpy = vi.spyOn(Clipboard, 'copyToClipboard')
  })

  afterEach(() => {
    cleanup()
    copySpy.mockRestore()
  })

  it('copies technical details via fallback when clipboard permission is denied', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => {
      expect(screen.getByText('Report this problem')).toBeInTheDocument()
    })

    await user.click(
      screen.getByRole('button', { name: /show what gets sent/i }),
    )

    await waitFor(() => {
      expect(screen.getByText(/Report-ID: RPT-TEST-1234/)).toBeInTheDocument()
    })

    installInsecureClipboard()
    await user.click(screen.getByLabelText('Copy diagnostics'))

    await waitFor(() => {
      expect(copySpy).toHaveBeenCalledWith(
        'Report-ID: RPT-TEST-1234\nStack: demo',
      )
    })

    const copyResult = await copySpy.mock.results.at(-1).value
    expect(copyResult.ok).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(screen.queryByText(/copy failed/i)).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('CheckRoundedIcon')).toBeInTheDocument()
    })
  })

  it('shows copy failure when diagnostics are not ready', async () => {
    const user = userEvent.setup()
    const { collectErrorReport } =
      await import('../../service/ErrorReportService')
    collectErrorReport.mockImplementationOnce(() => new Promise(() => {}))

    renderModal()

    await waitFor(() => {
      expect(screen.getByText('Report this problem')).toBeInTheDocument()
    })

    await user.click(
      screen.getByRole('button', { name: /show what gets sent/i }),
    )

    const copyButton = screen.getByLabelText('Copy diagnostics')
    expect(copyButton).toBeDisabled()
  })
})

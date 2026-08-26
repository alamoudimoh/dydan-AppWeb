// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const translations = {
  'auth.forgotPasswordTitle': 'Reset your password',
  'auth.forgotPasswordSubtitle': 'Enter your email to reset.',
  'auth.emailAddress': 'Email address',
  'auth.emailPlaceholder': 'you@example.com',
  'auth.sendResetLink': 'Send reset link',
  'auth.rememberedPassword': 'Remembered it?',
  'auth.backToSignIn': 'Back to sign in',
  'auth.emailRequired': 'Email is required',
  'auth.emailInvalid': 'Please enter a valid email address',
  'auth.resetEmailSent': 'Reset Email Sent',
  'auth.resetEmailInstructions': 'Check your email.',
  'auth.checkEmailTitle': 'Check your email',
  'auth.checkEmailSubtitle':
    'If an account exists for {{email}}, instructions sent.',
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options = {}) => {
      const value = key in translations ? translations[key] : key
      return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, placeholder) => {
        return options[placeholder] ?? `{{${placeholder}}}`
      })
    },
  }),
}))

import { MemoryRouter } from 'react-router-dom'

const mockShowError = vi.fn()
const mockShowNotification = vi.fn()
vi.mock('../../service/NotificationProvider', () => ({
  useNotification: () => ({
    showError: mockShowError,
    showNotification: mockShowNotification,
  }),
}))

const mockResetPassword = vi.fn()
vi.mock('../../utils/Fetcher', () => ({
  ResetPassword: (...args) => mockResetPassword(...args),
}))

import ForgotPasswordView from './ForgotPasswordView.jsx'

const renderWithRouter = ui => render(<MemoryRouter>{ui}</MemoryRouter>)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ForgotPasswordView', () => {
  it('renders localized labels and validates email before submitting', () => {
    renderWithRouter(<ForgotPasswordView />)

    expect(
      screen.getByRole('heading', { name: 'Reset your password' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Enter your email to reset.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Send reset link' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(screen.getByText('Email is required')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'not-an-email' },
    })
    fireEvent.blur(screen.getByLabelText('Email address'))
    expect(
      screen.getByText('Please enter a valid email address'),
    ).toBeInTheDocument()
  })

  it('shows a localized success state after a valid submission', async () => {
    mockResetPassword.mockResolvedValue({ ok: true })

    renderWithRouter(<ForgotPasswordView />)

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

    await screen.findByRole('heading', { name: 'Check your email' })
    expect(
      screen.getByText(
        'If an account exists for test@example.com, instructions sent.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Back to sign in' }),
    ).toBeInTheDocument()
  })
})

import { useState } from 'react'

import { parseAccountResponse } from '../utils/AccountResponse'
import * as Fetcher from '../utils/Fetcher'

export default function EmailChangeVerificationScreen({
  onComplete,
}: {
  onComplete: () => void
}) {
  const token = new URLSearchParams(window.location.search).get('token') ?? ''
  const [status, setStatus] = useState<
    'ready' | 'working' | 'complete' | 'error'
  >(token ? 'ready' : 'error')
  const [message, setMessage] = useState(
    token
      ? 'Confirm that you want to use this email address for your DyDan account.'
      : 'This email change link is invalid.',
  )

  const confirm = async () => {
    setStatus('working')
    try {
      const result = await parseAccountResponse(
        Fetcher.VerifyEmailChange(token),
      )
      setMessage(
        result.message ?? 'Email address updated. Please sign in again.',
      )
      setStatus('complete')
      onComplete()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to confirm email change.',
      )
      setStatus('error')
    }
  }

  return (
    <main
      className='min-h-screen flex items-center justify-center p-6'
      style={{ background: 'var(--surface)' }}
    >
      <section
        className='modal-panel p-7'
        style={{ maxWidth: 460 }}
        aria-live='polite'
      >
        <h1 className='font-bold text-primary' style={{ fontSize: 22 }}>
          Confirm email change
        </h1>
        <p className='text-muted mt-3'>{message}</p>
        {status === 'ready' && (
          <button
            className='btn btn-primary mt-5'
            onClick={() => void confirm()}
          >
            Confirm new email
          </button>
        )}
        {status === 'working' && (
          <span className='text-muted'>Confirming…</span>
        )}
        {status === 'complete' && (
          <a className='btn btn-primary mt-5' href='/'>
            Sign in
          </a>
        )}
      </section>
    </main>
  )
}

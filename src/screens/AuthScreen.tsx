import { useState } from 'react'

import { version as appVersion } from '../../package.json'
import { Icon, LogoMark, Theme } from '../App'
import { useAuth } from '../hooks/useAuth'
import { ResetPassword } from '../utils/Fetcher'

type AuthStep = 'signin' | 'mfa' | 'forgot'

type Props = {
  theme: Theme
  onAuthenticated: () => void
  isSessionExpired?: boolean
  onCreateAccount?: () => void
}

export default function AuthScreen({
  isSessionExpired,
  onAuthenticated,
  onCreateAccount,
}: Props) {
  const { signIn, verifyMfa } = useAuth()
  const [step, setStep] = useState<AuthStep>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  const handleSignIn = async () => {
    if (!username || !password) {
      setError('Please enter your username and password.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await signIn(username.trim(), password)
      if (result.mfaRequired && result.sessionToken) {
        setSessionToken(result.sessionToken)
        setStep('mfa')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleMFA = async () => {
    if (mfaCode.length !== 6) {
      setError('Enter the 6-digit code.')
      return
    }
    if (!sessionToken) {
      setError('Session is no longer valid. Please sign in again.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await verifyMfa(sessionToken, mfaCode)
      onAuthenticated()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Verification failed. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async () => {
    if (!forgotEmail) {
      setError('Enter your email address.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await ResetPassword(forgotEmail.trim())
      setForgotSent(true)
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't send a reset link. Check the address and try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--page)',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div
          className='card'
          style={{ padding: '40px 36px', borderRadius: 'var(--r-2xl)' }}
        >
          {/* Branding */}
          <div className='flex items-center gap-3 mb-8'>
            <LogoMark size={36} />
            <div>
              <div className='font-bold text-primary' style={{ fontSize: 20 }}>
                dydan
              </div>
              <div
                className='text-faint'
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                }}
              >
                Household Management
              </div>
            </div>
          </div>

          {/* Session-expired banner */}
          {isSessionExpired && step === 'signin' && (
            <div
              className='mb-5 flex items-start gap-3 p-4'
              style={{
                background: 'var(--sig-due-bg)',
                border: '1px solid var(--sig-due)',
                borderRadius: 'var(--r-md)',
              }}
            >
              <Icon
                name='lock'
                size={15}
                style={{ color: 'var(--sig-due)', flexShrink: 0, marginTop: 1 }}
              />
              <div>
                <div
                  className='font-bold'
                  style={{ fontSize: 13, color: 'var(--sig-due)' }}
                >
                  Session expired
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--t-muted)',
                    marginTop: 2,
                    lineHeight: 1.5,
                  }}
                >
                  Your session ended after inactivity. Sign in again to continue
                  — your data is safe.
                </div>
              </div>
            </div>
          )}

          {step === 'signin' && (
            <>
              <h1
                className='text-primary font-bold'
                style={{ fontSize: 22, margin: '0 0 4px' }}
              >
                {isSessionExpired ? 'Sign back in' : 'Welcome back'}
              </h1>
              <div className='text-muted mb-7' style={{ fontSize: 14 }}>
                Sign in to manage your household.
              </div>

              <div className='flex flex-col gap-4'>
                <div>
                  <label
                    className='block font-semibold text-primary mb-1.5'
                    style={{ fontSize: 13 }}
                  >
                    Username
                  </label>
                  <input
                    className='input'
                    type='text'
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder='your username'
                    autoComplete='username'
                    autoFocus
                  />
                </div>
                <div>
                  <label
                    className='block font-semibold text-primary mb-1.5'
                    style={{ fontSize: 13 }}
                  >
                    Password
                  </label>
                  <input
                    className='input'
                    type='password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder='••••••••'
                    autoComplete='current-password'
                    onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                  />
                </div>
                {error && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--sig-over)',
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  className='btn btn-primary'
                  style={{
                    justifyContent: 'center',
                    width: '100%',
                    marginTop: 4,
                  }}
                  onClick={handleSignIn}
                  disabled={loading}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
                <button
                  className='btn btn-ghost btn-sm'
                  style={{ color: 'var(--brand)', fontSize: 13 }}
                  onClick={() => setStep('forgot')}
                >
                  Forgot password?
                </button>
              </div>

              <div
                className='mt-6 pt-5 text-center'
                style={{ borderTop: '1px solid var(--line)' }}
              >
                <div className='text-muted' style={{ fontSize: 13 }}>
                  New to dydan?
                </div>
                <button
                  className='btn btn-ghost btn-sm'
                  style={{
                    color: 'var(--brand)',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                  onClick={onCreateAccount}
                >
                  Create an account
                </button>
              </div>
            </>
          )}

          {step === 'mfa' && (
            <>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--r-md)',
                  background: 'var(--brand-faint)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Icon name='lock' size={22} style={{ color: 'var(--brand)' }} />
              </div>
              <h1
                className='text-primary font-bold'
                style={{ fontSize: 22, margin: '0 0 6px' }}
              >
                Two-factor verification
              </h1>
              <div
                className='text-muted mb-7'
                style={{ fontSize: 14, lineHeight: 1.5 }}
              >
                Enter the 6-digit code from your authenticator app to continue.
              </div>

              <div className='flex flex-col gap-4'>
                <div>
                  <label
                    className='block font-semibold text-primary mb-1.5'
                    style={{ fontSize: 13 }}
                  >
                    Verification code
                  </label>
                  <input
                    className='input'
                    type='text'
                    inputMode='numeric'
                    maxLength={6}
                    value={mfaCode}
                    onChange={e =>
                      setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder='000000'
                    style={{
                      letterSpacing: '0.3em',
                      fontSize: 24,
                      fontFamily: 'var(--font-mono)',
                      textAlign: 'center',
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleMFA()}
                    autoFocus
                  />
                </div>
                {error && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--sig-over)',
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  className='btn btn-primary'
                  style={{
                    justifyContent: 'center',
                    width: '100%',
                    marginTop: 4,
                  }}
                  onClick={handleMFA}
                  disabled={loading}
                >
                  {loading ? 'Verifying…' : 'Verify and sign in'}
                </button>
                <div className='flex justify-between items-center'>
                  <button
                    className='btn btn-ghost btn-sm text-muted'
                    onClick={() => {
                      setStep('signin')
                      setMfaCode('')
                      setError('')
                      setSessionToken(null)
                    }}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 'forgot' && (
            <>
              <h1
                className='text-primary font-bold'
                style={{ fontSize: 22, margin: '0 0 6px' }}
              >
                Reset password
              </h1>
              <div className='text-muted mb-7' style={{ fontSize: 14 }}>
                Enter your email and we'll send a reset link.
              </div>

              {forgotSent ? (
                <div className='text-center'>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
                  <div
                    className='text-primary font-bold mb-2'
                    style={{ fontSize: 17 }}
                  >
                    Check your inbox
                  </div>
                  <div
                    className='text-muted mb-6'
                    style={{ fontSize: 13, lineHeight: 1.6 }}
                  >
                    A reset link was sent to <strong>{forgotEmail}</strong>.
                    Check your inbox and follow the link.
                  </div>
                  <button
                    className='btn btn-secondary'
                    style={{ justifyContent: 'center', width: '100%' }}
                    onClick={() => {
                      setStep('signin')
                      setForgotSent(false)
                    }}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <div className='flex flex-col gap-4'>
                  <div>
                    <label
                      className='block font-semibold text-primary mb-1.5'
                      style={{ fontSize: 13 }}
                    >
                      Email
                    </label>
                    <input
                      className='input'
                      type='email'
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder='you@example.com'
                    />
                  </div>
                  {error && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--sig-over)',
                        fontWeight: 600,
                      }}
                    >
                      {error}
                    </div>
                  )}
                  <button
                    className='btn btn-primary'
                    style={{
                      justifyContent: 'center',
                      width: '100%',
                      marginTop: 4,
                    }}
                    onClick={handleForgot}
                    disabled={loading}
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                  <button
                    className='btn btn-ghost btn-sm'
                    onClick={() => setStep('signin')}
                  >
                    ← Back to sign in
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className='text-center text-faint mt-4' style={{ fontSize: 11 }}>
          dydan v{appVersion} · Your data stays in your team
        </div>
      </div>
    </div>
  )
}

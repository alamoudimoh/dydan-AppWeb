import { useState } from 'react'

import { LogoMark, Theme } from '../App'
import { useAuth } from '../hooks/useAuth'
import { signUp } from '../utils/Fetcher'

type Step = 'welcome' | 'profile' | 'done'

type Props = {
  theme: Theme
  onComplete: () => void
}

export default function OnboardingScreen({ onComplete, theme }: Props) {
  const { signIn } = useAuth()
  const [step, setStep] = useState<Step>('welcome')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const progressMap: Record<Step, number> = { welcome: 0, profile: 1, done: 2 }
  const currentProgress = progressMap[step]

  const validate = (): string => {
    if (!displayName.trim()) return 'Please enter your name.'
    if (!username.trim()) return 'Please choose a username.'
    if (!/^[a-z0-9._-]{3,32}$/.test(username.trim())) {
      return 'Usernames can only use lowercase letters, numbers, dots, and hyphens (3–32 characters).'
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      return 'Please enter a valid email address.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    return ''
  }

  const handleSubmit = async () => {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setLoading(true)
    // `signUp` rejects on a non-2xx response, so a refused registration never
    // advances to the completion step. Account creation and the follow-up
    // sign-in are reported separately, because they can fail independently.
    let accountCreated = false
    try {
      await signUp(
        username.trim().toLowerCase(),
        password,
        displayName.trim(),
        email.trim(),
      )
      accountCreated = true
      // Sign-up doesn't issue tokens — sign in right away with the new credentials.
      await signIn(username.trim().toLowerCase(), password)
      setStep('done')
      onComplete()
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : accountCreated
            ? 'Your account was created, but signing in failed. Sign in with your new credentials.'
            : "We couldn't create your account. Check the details and try again.",
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
        flexDirection: 'column',
        background: 'var(--page)',
      }}
    >
      {/* Top bar */}
      <div className='flex items-center justify-between px-6 pt-6 pb-3'>
        <LogoMark size={28} theme={theme} />
        {step !== 'done' && step !== 'welcome' && (
          <div className='flex items-center gap-2'>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  width: i === currentProgress ? 20 : 8,
                  height: 8,
                  borderRadius: 99,
                  background:
                    i <= currentProgress ? 'var(--brand)' : 'var(--line)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        )}
        {step !== 'done' && (
          <button
            className='btn btn-ghost btn-sm text-muted'
            style={{ fontSize: 12 }}
            onClick={onComplete}
          >
            Sign in instead
          </button>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 24px 60px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          {step === 'welcome' && (
            <>
              <div style={{ fontSize: 52, marginBottom: 20 }}>🏠</div>
              <h1
                className='text-primary font-bold'
                style={{ fontSize: 28, margin: '0 0 10px', lineHeight: 1.25 }}
              >
                Keep your whole household running smoothly
              </h1>
              <p
                className='text-muted'
                style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}
              >
                dydan turns chores, routines, projects, and family goals into
                one shared plan — for parents and kids alike.
              </p>
              <button
                className='btn btn-primary'
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={() => setStep('profile')}
              >
                Create your account
              </button>
              <div
                className='text-center text-faint mt-4'
                style={{ fontSize: 12 }}
              >
                By continuing you agree to the dydan terms of service.
              </div>
            </>
          )}

          {step === 'profile' && (
            <>
              <h1
                className='text-primary font-bold'
                style={{ fontSize: 22, margin: '0 0 6px' }}
              >
                Your details
              </h1>
              <div className='text-muted mb-7' style={{ fontSize: 14 }}>
                This creates your team — you can invite the rest of the
                household after.
              </div>

              <div className='flex flex-col gap-4'>
                <div>
                  <label
                    className='block font-semibold text-primary mb-1.5'
                    style={{ fontSize: 13 }}
                  >
                    Your name
                  </label>
                  <input
                    className='input'
                    type='text'
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder='e.g. Sarah Mitchell'
                    autoComplete='name'
                    autoFocus
                  />
                </div>
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
                    placeholder='e.g. sarah'
                    autoComplete='username'
                  />
                </div>
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
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder='you@example.com'
                    autoComplete='email'
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
                    placeholder='At least 8 characters'
                    autoComplete='new-password'
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
                {error && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--sig-over)',
                      fontWeight: 600,
                      lineHeight: 1.5,
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
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating your household…' : 'Create account'}
                </button>
                <button
                  className='btn btn-ghost btn-sm'
                  style={{ color: 'var(--brand)', fontSize: 13 }}
                  onClick={onComplete}
                >
                  Already have an account? Sign in
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className='text-center'>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
              <h1
                className='text-primary font-bold'
                style={{ fontSize: 22, margin: '0 0 8px' }}
              >
                Your household is ready
              </h1>
              <p
                className='text-muted'
                style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}
              >
                Welcome to dydan, {displayName.trim() || 'friend'}! Now invite
                your family and start adding chores and goals.
              </p>
              <button
                className='btn btn-primary'
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={onComplete}
              >
                Continue to dydan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

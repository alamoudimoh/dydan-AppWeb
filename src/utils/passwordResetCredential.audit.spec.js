import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('password reset credential capture', () => {
  let credentials

  beforeEach(async () => {
    vi.resetModules()
    credentials = await import('./PasswordResetCredential.js')
  })

  const browserWindow = href => {
    const history = {
      state: { idx: 4, key: 'router-key' },
      replaceState: vi.fn(),
    }
    return { location: { href }, history }
  }

  it('captures a fragment credential before startup and preserves router state', () => {
    const target = browserWindow(
      'https://app.example/password/update?lang=en#c=reset-secret',
    )

    expect(credentials.capturePasswordResetCredential(target)).toBe(
      'reset-secret',
    )
    expect(target.history.replaceState).toHaveBeenCalledWith(
      target.history.state,
      '',
      '/password/update?lang=en',
    )
    expect(credentials.consumePasswordResetCredential()).toBe('reset-secret')
    expect(credentials.consumePasswordResetCredential()).toBeNull()
  })

  it('removes legacy query credentials without touching verification links', () => {
    const legacy = browserWindow(
      'https://app.example/password/update?c=legacy-secret',
    )
    credentials.capturePasswordResetCredential(legacy)
    expect(legacy.history.replaceState).toHaveBeenCalledWith(
      legacy.history.state,
      '',
      '/password/update',
    )

    const verification = browserWindow(
      'https://app.example/verify?c=email-verification',
    )
    expect(credentials.capturePasswordResetCredential(verification)).toBeNull()
    expect(verification.history.replaceState).not.toHaveBeenCalled()
  })
})

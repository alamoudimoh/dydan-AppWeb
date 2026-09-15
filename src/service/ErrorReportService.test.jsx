// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'

import {
  newReportId,
  sanitizeDiagnosticUrl,
  SUBMIT_RESULT,
  submitErrorReport,
} from './ErrorReportService.js'

describe('manual error report flow (unchanged by Sentry baseline)', () => {
  it('still routes self-hosted reports to the manual GitHub fallback', async () => {
    const result = await submitErrorReport({
      description: 'something is off',
      report: {
        kind: 'bug',
        app: { hosting: 'self-hosted' },
        error: { name: 'TypeError', message: 'boom' },
        runtime: { url: 'http://localhost:5173/settings' },
      },
    })
    expect(result.result).toBe(SUBMIT_RESULT.SELF_HOSTED)
    expect(result.githubUrl).toMatch(/^https:\/\/github\.com\//)
  })

  it('still generates report ids', () => {
    expect(newReportId()).toMatch(/^TD-[0-9A-Z]+-[0-9A-Z]+$/)
  })

  it('removes OAuth credentials from diagnostic URLs', () => {
    const sanitized = sanitizeDiagnosticUrl(
      'https://dydan.example/auth/oauth2?code=secret&state=state-secret&safe=1',
    )
    expect(sanitized).toContain('safe=1')
    expect(sanitized).not.toContain('secret')
    expect(sanitized).not.toContain('state=')
  })

  it('removes password-reset credentials from diagnostic URLs', () => {
    const sanitized = sanitizeDiagnosticUrl(
      'https://dydan.example/password/update?c=reset-secret&safe=1',
    )
    expect(sanitized).toContain('safe=1')
    expect(sanitized).not.toContain('reset-secret')
  })
})

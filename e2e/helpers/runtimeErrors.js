/**
 * Collects uncaught page errors and unexpected console.error output.
 * Only explicitly documented vendor/test-environment warnings are ignored.
 */
const IGNORED_CONSOLE_PATTERNS = [
  // Service worker registration is best-effort in preview/test builds.
  /^SW Registered:/,
  /^SW registration error/,
  // EventSource mock closes after the smoke handshake; reconnect logs are benign.
  /^SSE: Ticket request failed/,
  /^SSE error:/,
  /^SSE: Failed to obtain connection ticket/,
  // Playwright/Chrome in container environments occasionally reports transient
  // network-interface changes while resource loads are in flight. This is an
  // environment flake, not an application runtime error.
  /Failed to load resource: net::ERR_NETWORK_CHANGED/,
]

export const attachRuntimeErrorGuard = page => {
  const errors = []

  page.on('pageerror', error => {
    errors.push(`pageerror: ${error.message}`)
  })

  page.on('console', message => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (IGNORED_CONSOLE_PATTERNS.some(pattern => pattern.test(text))) return
    errors.push(`console.error: ${text}`)
  })

  return {
    assertClean() {
      if (errors.length === 0) return
      throw new Error(`Runtime errors detected:\n${errors.join('\n')}`)
    },
    getErrors: () => [...errors],
  }
}

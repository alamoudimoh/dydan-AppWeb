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

const IGNORED_PAGE_ERROR_PATTERNS = [
  // WebKit reports this non-fatal notification while it settles responsive
  // layouts; it has no application stack or user-visible failure.
  /^ResizeObserver loop completed with undelivered notifications\.$/,
]

export const attachRuntimeErrorGuard = page => {
  const errors = []
  const expectedPublicStatusErrors = []
  let completedMockSSEHandshake = false
  let expectedMockSSEReconnectErrors = 0

  page.on('pageerror', error => {
    if (
      IGNORED_PAGE_ERROR_PATTERNS.some(pattern => pattern.test(error.message))
    ) {
      return
    }
    errors.push(`pageerror: ${error.message}`)
  })

  // Browser resource errors omit the URL. The strict API mock adds this header
  // so a route/query/method regression is actionable in the smoke output.
  page.on('response', response => {
    const contractError = response.headers()['x-dydan-mock-contract-error']
    if (contractError) {
      errors.push(`API contract: ${contractError}`)
    }
    const request = response.request()
    const isSSE = response.url().includes('/api/v1/realtime/sse')
    if (
      isSSE &&
      response.status() === 200 &&
      response.headers()['content-type']?.includes('text/event-stream')
    ) {
      completedMockSSEHandshake = true
    }
    // route.fulfill() serves a finite SSE body, so WebKit reconnects after the
    // test handshake closes. WebKit does not route that reconnect through the
    // page mock; only its expected preview-server 401 is ignored. A failed
    // first handshake still remains a test failure.
    if (isSSE && completedMockSSEHandshake && response.status() === 401) {
      expectedMockSSEReconnectErrors += 2
    }
    if (
      response.url().includes('/api/v1/auth/refresh') &&
      !request.headers().authorization &&
      response.status() === 400
    ) {
      expectedPublicStatusErrors.push(400)
    }
  })

  page.on('console', message => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (
      expectedMockSSEReconnectErrors > 0 &&
      (/^Failed to load resource: the server responded with a status of 401/.test(
        text,
      ) ||
        /^EventSource's response has a status 401 Unauthorized that is not 200\. Aborting the connection\.$/.test(
          text,
        ))
    ) {
      expectedMockSSEReconnectErrors -= 1
      return
    }
    if (IGNORED_CONSOLE_PATTERNS.some(pattern => pattern.test(text))) return
    const statusMatch = text.match(/status of (\d+)/)
    if (
      statusMatch &&
      expectedPublicStatusErrors.indexOf(Number(statusMatch[1])) !== -1
    ) {
      expectedPublicStatusErrors.splice(
        expectedPublicStatusErrors.indexOf(Number(statusMatch[1])),
        1,
      )
      return
    }
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

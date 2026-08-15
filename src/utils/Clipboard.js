const COPY_ERRORS = {
  EMPTY: 'empty',
  UNAVAILABLE: 'unavailable',
  DENIED: 'denied',
  FAILED: 'failed',
}

const canUseAsyncClipboard = () =>
  typeof navigator !== 'undefined' &&
  navigator.clipboard?.writeText &&
  (typeof window === 'undefined' || window.isSecureContext)

const execCommandCopy = text => {
  if (typeof document === 'undefined') {
    return { ok: false, error: COPY_ERRORS.UNAVAILABLE }
  }

  try {
    const onCopy = event => {
      event.clipboardData.setData('text/plain', text)
      event.preventDefault()
    }
    document.addEventListener('copy', onCopy)
    const copied = document.execCommand('copy')
    document.removeEventListener('copy', onCopy)
    return copied
      ? { ok: true, method: 'execCommand' }
      : { ok: false, error: COPY_ERRORS.FAILED }
  } catch {
    return { ok: false, error: COPY_ERRORS.FAILED }
  }
}

/**
 * Copies text with Clipboard API when available, otherwise a hidden textarea
 * fallback. Never throws — callers show success/failure in the UI.
 */
export const copyToClipboard = async text => {
  if (!text) {
    return { ok: false, error: COPY_ERRORS.EMPTY }
  }

  let clipboardError = null

  if (canUseAsyncClipboard()) {
    try {
      await navigator.clipboard.writeText(text)
      return { ok: true, method: 'clipboard' }
    } catch (error) {
      clipboardError =
        error?.name === 'NotAllowedError'
          ? COPY_ERRORS.DENIED
          : COPY_ERRORS.FAILED
    }
  }

  const fallback = execCommandCopy(text)
  if (fallback.ok) {
    return fallback
  }

  return {
    ok: false,
    error: fallback.error || clipboardError || COPY_ERRORS.UNAVAILABLE,
  }
}

export { COPY_ERRORS }

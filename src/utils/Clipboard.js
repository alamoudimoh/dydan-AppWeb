const COPY_ERRORS = {
  EMPTY: 'empty',
  UNAVAILABLE: 'unavailable',
  DENIED: 'denied',
  FAILED: 'failed',
}

/**
 * Copies text with Clipboard API when available, otherwise a hidden textarea
 * fallback. Never throws — callers show success/failure in the UI.
 */
export const copyToClipboard = async text => {
  if (!text) {
    return { ok: false, error: COPY_ERRORS.EMPTY }
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard?.writeText &&
    typeof window !== 'undefined' &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text)
      return { ok: true }
    } catch (error) {
      if (error?.name === 'NotAllowedError') {
        return { ok: false, error: COPY_ERRORS.DENIED }
      }
    }
  }

  if (typeof document === 'undefined') {
    return { ok: false, error: COPY_ERRORS.UNAVAILABLE }
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
      ? { ok: true }
      : { ok: false, error: COPY_ERRORS.FAILED }
  } catch {
    return { ok: false, error: COPY_ERRORS.FAILED }
  }
}

export { COPY_ERRORS }

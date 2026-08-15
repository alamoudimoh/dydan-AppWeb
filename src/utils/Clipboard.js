const COPY_ERRORS = {
  EMPTY: 'empty',
  UNAVAILABLE: 'unavailable',
  DENIED: 'denied',
  FAILED: 'failed',
}

const execCommandCopy = text => {
  if (typeof document === 'undefined') {
    return { ok: false, error: COPY_ERRORS.UNAVAILABLE }
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '0'
    textarea.style.width = '2px'
    textarea.style.height = '2px'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
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

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard?.writeText
  ) {
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

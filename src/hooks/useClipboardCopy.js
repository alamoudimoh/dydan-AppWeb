import { useCallback, useState } from 'react'

import { copyToClipboard } from '../utils/Clipboard.js'

/**
 * Shared clipboard action used by the crash screen and error-report modal.
 * Resolves text at click time and only marks success after copyToClipboard ok.
 */
export const useClipboardCopy = (resolveText, resetMs = 2000) => {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  const reset = useCallback(() => {
    setCopied(false)
    setCopyFailed(false)
  }, [])

  const copy = useCallback(async () => {
    const text = typeof resolveText === 'function' ? resolveText() : resolveText
    const result = await copyToClipboard(text)
    if (result.ok) {
      setCopied(true)
      setCopyFailed(false)
      if (resetMs > 0) {
        setTimeout(() => setCopied(false), resetMs)
      }
      return result
    }
    setCopied(false)
    setCopyFailed(true)
    return result
  }, [resolveText, resetMs])

  return { copy, copied, copyFailed, reset }
}

import { useEffect, useMemo, useState } from 'react'

import { patchDescriptionHtml } from '../utils/ImageCache'
import { sanitizeHtml } from '../utils/sanitizeHtml'

// Returns description HTML safe to render: sanitized against stored XSS and
// with embedded images whose signed src expired swapped for the offline-cached
// blob or a freshly signed URL. Renders the sanitized HTML immediately and
// swaps in the image-patched version once ready.
//
// No synchronous setState in the effect: the sanitized value is derived during
// render and the async patch result is keyed on its source html.
export const useDescriptionHtml = (html, meta = {}) => {
  const sanitized = useMemo(() => sanitizeHtml(html), [html])
  // The resolved patch is keyed on the html it came from so a stale result
  // never leaks into a new render after the input changes.
  const [patched, setPatched] = useState({ source: null, html: null })

  useEffect(() => {
    if (!html || !html.includes('dt-data-path')) return undefined
    let cancelled = false
    patchDescriptionHtml(html, meta).then(result => {
      if (!cancelled) setPatched({ source: html, html: sanitizeHtml(result) })
    })
    return () => {
      cancelled = true
    }
    // meta is an inline object at call sites; keying on its values would
    // re-run every render, so only the html triggers a re-patch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html])

  return patched.source === html && patched.html !== null
    ? patched.html
    : sanitized
}

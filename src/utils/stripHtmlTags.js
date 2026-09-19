// Strip HTML tags from untrusted markup for plain-text display.
//
// Uses DOMParser instead of setting div.innerHTML directly: documents parsed
// by DOMParser never execute scripts or load subresources (so <img onerror>
// payloads cannot fire), while still decoding entities correctly.
export const stripHtmlTags = html => {
  if (!html) return ''
  const htmlStr = typeof html === 'string' ? html : String(html || '')
  if (typeof document === 'undefined' || typeof DOMParser === 'undefined') {
    return htmlStr.replace(/<[^>]*>/g, '')
  }
  const doc = new DOMParser().parseFromString(htmlStr, 'text/html')
  return doc.body.textContent || ''
}

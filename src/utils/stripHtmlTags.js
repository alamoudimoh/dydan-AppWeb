// Strip HTML tags from untrusted markup for plain-text display.
//
// Uses DOMParser instead of setting div.innerHTML directly: documents parsed
// by DOMParser never execute scripts or load subresources (so <img onerror>
// payloads cannot fire), while still decoding entities correctly.
export const stripHtmlTags = html => {
  if (!html) return ''
  if (typeof document === 'undefined' || typeof DOMParser === 'undefined') {
    return String(html).replace(/<[^>]*>/g, '')
  }
  const doc = new DOMParser().parseFromString(String(html), 'text/html')
  return doc.body.textContent || ''
}

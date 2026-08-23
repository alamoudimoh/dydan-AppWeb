import DOMPurify from 'dompurify'

// Sanitize user/peer-authored HTML (chore descriptions, notes) before it is
// rendered via dangerouslySetInnerHTML. Chores are visible to every circle
// member, so unsanitized markup would be a stored-XSS vector.
//
// The default profile strips scripts, event handlers, javascript: URLs and
// other active content while keeping the formatting tags the rich-text editor
// produces (headings, lists, links, images, etc.).

export const sanitizeHtml = html => {
  if (!html || typeof html !== 'string') return ''
  return DOMPurify.sanitize(html)
}

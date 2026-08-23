// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { sanitizeHtml } from './sanitizeHtml'

describe('sanitizeHtml', () => {
  it('returns empty string for empty/non-string input', () => {
    expect(sanitizeHtml('')).toBe('')
    expect(sanitizeHtml(null)).toBe('')
    expect(sanitizeHtml(undefined)).toBe('')
  })

  it('keeps benign formatting markup produced by the rich-text editor', () => {
    const html = '<p>Hello <strong>world</strong></p><ul><li>item</li></ul>'
    expect(sanitizeHtml(html)).toContain('<strong>world</strong>')
    expect(sanitizeHtml(html)).toContain('<li>item</li>')
  })

  it('removes script tags', () => {
    expect(sanitizeHtml('<p>ok</p><script>alert(1)</script>')).not.toContain(
      '<script',
    )
  })

  it('removes inline event handlers', () => {
    const out = sanitizeHtml('<img src=x onerror=alert(1)>')
    expect(out).not.toContain('onerror')
  })

  it('neutralizes javascript: URLs', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">click</a>')
    expect(out).not.toContain('javascript:')
  })

  it('strips html/body wrappers while keeping content', () => {
    const out = sanitizeHtml('<body onload=alert(1)<p>hi</p></body>')
    expect(out).not.toContain('onload')
    expect(out.toLowerCase()).toContain('hi')
  })
})

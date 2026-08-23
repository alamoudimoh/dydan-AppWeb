import { describe, expect, it } from 'vitest'

import { stripHtmlTags } from './stripHtmlTags'

describe('stripHtmlTags', () => {
  it('returns empty string for empty input', () => {
    expect(stripHtmlTags('')).toBe('')
    expect(stripHtmlTags(null)).toBe('')
  })

  it('strips tags', () => {
    expect(stripHtmlTags('<p>Hello &amp; goodbye</p>')).toContain('Hello')
    expect(stripHtmlTags('<p>Hello</p>')).not.toContain('<p>')
  })

  it('does not execute scripts embedded in markup', () => {
    stripHtmlTags(
      '<img src=x onerror="window.__xss = true"><p>a</p><script>window.__xss2 = true</script>',
    )
    expect(globalThis.window?.__xss).toBeUndefined()
    expect(globalThis.window?.__xss2).toBeUndefined()
  })
})

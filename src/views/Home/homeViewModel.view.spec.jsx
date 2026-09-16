// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'

import { resolveHomeView } from './useHomeData.js'

describe('resolveHomeView', () => {
  it('defaults adults to Focus', () => {
    expect(resolveHomeView(false, null)).toBe('focus')
  })

  it('lets adults switch to Quest', () => {
    expect(resolveHomeView(false, 'quest')).toBe('quest')
  })

  it('ignores unknown stored values and falls back to Focus for adults', () => {
    expect(resolveHomeView(false, 'sidepanel')).toBe('focus')
  })

  it('always keeps children on Quest', () => {
    expect(resolveHomeView(true, null)).toBe('quest')
    expect(resolveHomeView(true, 'focus')).toBe('quest')
    expect(resolveHomeView(true, 'quest')).toBe('quest')
  })
})

import { describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS_PREFERENCES } from './settingsPreferenceModel'

describe('settings preference contract', () => {
  it('has complete, safe defaults for every persisted Settings control', () => {
    expect(DEFAULT_SETTINGS_PREFERENCES).toMatchObject({
      appearance: 'light',
      compactMode: false,
      currency: 'USD',
      defaultView: 'focus',
      language: 'en',
      showItemBadges: true,
      theme: 'dydan',
    })
    expect(DEFAULT_SETTINGS_PREFERENCES.notifications).toMatchObject({
      pushChannel: true,
      taskReminders: true,
    })
  })
})

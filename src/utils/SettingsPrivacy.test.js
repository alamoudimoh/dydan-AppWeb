import assert from 'node:assert/strict'
import test from 'node:test'

// Provide a localStorage implementation before the module under test loads.
const store = {}
globalThis.localStorage = {
  getItem: key => (key in store ? store[key] : null),
  setItem: (key, value) => {
    store[key] = String(value)
  },
  removeItem: key => {
    delete store[key]
  },
  clear: () => {
    for (const key of Object.keys(store)) delete store[key]
  },
  key: index => Object.keys(store)[index] ?? null,
  get length() {
    return Object.keys(store).length
  },
}

const {
  PRIVACY_PREFERENCES,
  getPrivacyPreference,
  isDiagnosticsSharingEnabled,
  isEmailVisibleOnProfile,
  isTimezoneVisibleOnProfile,
  setPrivacyPreference,
} = await import('./SettingsPrivacy.js')

test('privacy preferences default to permissive values', () => {
  assert.equal(getPrivacyPreference(PRIVACY_PREFERENCES.showTimezone), true)
  assert.equal(getPrivacyPreference(PRIVACY_PREFERENCES.showEmail), true)
  assert.equal(getPrivacyPreference(PRIVACY_PREFERENCES.shareDiagnostics), true)
  assert.equal(isTimezoneVisibleOnProfile(), true)
  assert.equal(isEmailVisibleOnProfile(), true)
  assert.equal(isDiagnosticsSharingEnabled(), true)
})

test('set and get round-trips both boolean states', () => {
  setPrivacyPreference(PRIVACY_PREFERENCES.showTimezone, false)
  assert.equal(getPrivacyPreference(PRIVACY_PREFERENCES.showTimezone), false)
  setPrivacyPreference(PRIVACY_PREFERENCES.showTimezone, true)
  assert.equal(getPrivacyPreference(PRIVACY_PREFERENCES.showTimezone), true)
})

test('explicitly stored "false" is read as false (not the default)', () => {
  setPrivacyPreference(PRIVACY_PREFERENCES.shareDiagnostics, false)
  assert.equal(isDiagnosticsSharingEnabled(), false)
  assert.equal(
    globalThis.localStorage.getItem('dydan.privacy.shareDiagnostics'),
    'false',
  )
})

test('a stored "true" string is honoured for diagnostics sharing', () => {
  setPrivacyPreference(PRIVACY_PREFERENCES.shareDiagnostics, true)
  assert.equal(isDiagnosticsSharingEnabled(), true)
})

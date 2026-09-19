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

const { clearSignedIn, markSignedIn, wasSignedIn } = await import(
  './SessionPresence.js'
)

test('a fresh device has no signed-in marker', () => {
  assert.equal(wasSignedIn(), false)
})

test('marking a sign-in is recorded on the canonical key', () => {
  markSignedIn()
  assert.equal(wasSignedIn(), true)
  assert.equal(globalThis.localStorage.getItem('dydan.signed-in'), '1')
})

test('clearing the marker removes the device-local sign-in proof', () => {
  markSignedIn()
  clearSignedIn()
  assert.equal(wasSignedIn(), false)
  assert.equal(globalThis.localStorage.getItem('dydan.signed-in'), null)
})

test('a non-1 stored value is treated as not signed in', () => {
  globalThis.localStorage.setItem('dydan.signed-in', 'true')
  assert.equal(wasSignedIn(), false)
})
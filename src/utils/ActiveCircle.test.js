import assert from 'node:assert/strict'
import test from 'node:test'

const localStore = new Map()
globalThis.localStorage = {
  getItem: key => localStore.get(key) ?? null,
  setItem: (key, value) => localStore.set(key, String(value)),
  removeItem: key => localStore.delete(key),
}

const {
  profileCircleId,
  resolveActiveCircle,
  syncActiveCircleId,
} = await import('./ActiveCircle.js')

test('resolveActiveCircle prefers the profile active circle id', () => {
  const circles = [
    { id: 9, name: 'Older', userRole: 'member' },
    { id: 3, name: 'Active', userRole: 'admin' },
  ]
  const active = resolveActiveCircle(circles, 3)
  assert.equal(active?.id, 3)
  assert.equal(active?.name, 'Active')
})

test('resolveActiveCircle uses the only membership when ids match one circle', () => {
  const circles = [{ id: 12, name: 'Home' }]
  assert.equal(resolveActiveCircle(circles, 99)?.id, 12)
})

test('profileCircleId reads circleID and circleId fields', () => {
  assert.equal(profileCircleId({ circleID: 4 }), 4)
  assert.equal(profileCircleId({ circleId: 5 }), 5)
})

test('syncActiveCircleId stores and clears local circle scope', () => {
  syncActiveCircleId(42)
  assert.equal(localStorage.getItem('circleId'), '42')
  syncActiveCircleId(null)
  assert.equal(localStorage.getItem('circleId'), null)
})

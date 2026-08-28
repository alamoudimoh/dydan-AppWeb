import assert from 'node:assert/strict'
import test from 'node:test'

const listeners = new Map()
const localStore = new Map()

globalThis.localStorage = {
  getItem: key => localStore.get(key) ?? null,
  setItem: (key, value) => localStore.set(key, String(value)),
  removeItem: key => localStore.delete(key),
  clear: () => localStore.clear(),
}

globalThis.window = {
  localStorage: globalThis.localStorage,
  addEventListener(type, handler) {
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type).add(handler)
  },
  removeEventListener(type, handler) {
    listeners.get(type)?.delete(handler)
  },
  dispatchEvent(event) {
    for (const handler of listeners.get(event.type) || []) {
      handler(event)
    }
    return true
  },
}

const {
  LEGACY_OFFLINE_FEATURE_EVENT,
  OFFLINE_FEATURE_EVENT,
  setOfflineFeatureEnabled,
  subscribeToOfflineFeature,
} = await import('./OfflineFeatureToggle.js')

const reset = () => {
  listeners.clear()
  localStorage.clear()
}

test('setOfflineFeatureEnabled emits DayDan and legacy offline events', () => {
  reset()
  const seen = []
  const handler = event => seen.push(event.type)
  window.addEventListener(OFFLINE_FEATURE_EVENT, handler)
  window.addEventListener(LEGACY_OFFLINE_FEATURE_EVENT, handler)

  setOfflineFeatureEnabled(false)

  assert.deepEqual(seen, [OFFLINE_FEATURE_EVENT, LEGACY_OFFLINE_FEATURE_EVENT])
})

test('subscribeToOfflineFeature handles DayDan and legacy events', () => {
  reset()
  const values = []
  const unsubscribe = subscribeToOfflineFeature(enabled => {
    values.push(enabled)
  })

  window.dispatchEvent(
    new CustomEvent(OFFLINE_FEATURE_EVENT, { detail: { enabled: true } }),
  )
  window.dispatchEvent(
    new CustomEvent(LEGACY_OFFLINE_FEATURE_EVENT, {
      detail: { enabled: false },
    }),
  )

  unsubscribe()
  assert.deepEqual(values, [true, false])
})

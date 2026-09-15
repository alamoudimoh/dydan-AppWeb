import assert from 'node:assert/strict'
import test from 'node:test'

import { readLocalStorageJSON, writeLocalStorageJSON } from './storage.js'

test('storage helpers read and write canonical JSON values', () => {
  const values = new Map()
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }

  const key = { canonical: 'dydan.test' }
  writeLocalStorageJSON(key, { value: true })
  assert.deepEqual(readLocalStorageJSON(key, null), { value: true })
})

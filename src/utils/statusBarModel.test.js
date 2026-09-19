import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveStatusBarBackground } from './statusBarModel.js'

test('status bar background follows the Dydan page token per scheme', () => {
  assert.equal(resolveStatusBarBackground('light', 'dydan'), '#F8FAFF')
  assert.equal(resolveStatusBarBackground('dark', 'dydan'), '#080B14')
})

test('status bar background follows the Sovereign page token per scheme', () => {
  assert.equal(resolveStatusBarBackground('light', 'sovereign'), '#FFFFFF')
  assert.equal(resolveStatusBarBackground('dark', 'sovereign'), '#1A1A1A')
})

test('unknown brands fall back to Dydan', () => {
  assert.equal(resolveStatusBarBackground('light', 'unknown'), '#F8FAFF')
})

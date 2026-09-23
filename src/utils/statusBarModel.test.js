import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveStatusBarBackground } from './statusBarModel.js'

test('status bar background follows the Dydan page token per scheme', () => {
  assert.equal(resolveStatusBarBackground('light', 'dydan'), '#FFF8E8')
  assert.equal(resolveStatusBarBackground('dark', 'dydan'), '#34236D')
})

test('status bar background follows the Sovereign page token per scheme', () => {
  assert.equal(resolveStatusBarBackground('light', 'sovereign'), '#F6F2E8')
  assert.equal(resolveStatusBarBackground('dark', 'sovereign'), '#071A2C')
})

test('unknown brands fall back to Dydan', () => {
  assert.equal(resolveStatusBarBackground('light', 'unknown'), '#FFF8E8')
})

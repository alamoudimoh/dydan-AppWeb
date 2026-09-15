import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveStatusBarBackground } from './statusBarModel.js'

test('status bar background follows the Dydan page token per scheme', () => {
  assert.equal(resolveStatusBarBackground('light', 'dydan'), '#F6F7F9')
  assert.equal(resolveStatusBarBackground('dark', 'dydan'), '#1A1F26')
})

test('status bar background follows the Sovereign page token per scheme', () => {
  assert.equal(resolveStatusBarBackground('light', 'sovereign'), '#F2F2F2')
  assert.equal(resolveStatusBarBackground('dark', 'sovereign'), '#1A1A1A')
})

test('unknown brands fall back to Dydan', () => {
  assert.equal(resolveStatusBarBackground('light', 'unknown'), '#F6F7F9')
})

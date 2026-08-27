import assert from 'node:assert/strict'
import test from 'node:test'

import { isAllowedServerURL } from './ServerUrlValidation.js'

test('native server URLs require HTTPS', () => {
  assert.equal(isAllowedServerURL('https://daydan.example:2021', true), true)
  assert.equal(isAllowedServerURL('http://daydan.example:2021', true), false)
})

test('web self-hosting permits explicitly configured HTTP or HTTPS', () => {
  assert.equal(isAllowedServerURL('http://localhost:2021', false), true)
  assert.equal(isAllowedServerURL('https://daydan.example:2021', false), true)
  assert.equal(isAllowedServerURL('javascript:alert(1)', false), false)
})

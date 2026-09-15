import assert from 'node:assert/strict'
import test from 'node:test'

import { parseAllowedHosts } from './vite.allowed-hosts.mjs'

test('parses exact additional Vite hosts from installation configuration', () => {
  assert.deepEqual(
    parseAllowedHosts(' dydan.example.com, dydan.example.com,,'),
    ['dydan.example.com', 'dydan.example.com'],
  )
})

test('does not broaden the Vite host allowlist', () => {
  assert.deepEqual(parseAllowedHosts(), [])
  assert.throws(() => parseAllowedHosts('*'), /exact hostnames/)
  assert.throws(() => parseAllowedHosts('.example.com'), /exact hostnames/)
  assert.throws(
    () => parseAllowedHosts('https://dydan.example.com'),
    /exact hostnames/,
  )
})

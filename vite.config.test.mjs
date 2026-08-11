import assert from 'node:assert/strict'
import test from 'node:test'

import { parseAllowedHosts } from './vite.allowed-hosts.mjs'

test('parses exact additional Vite hosts from installation configuration', () => {
  assert.deepEqual(
    parseAllowedHosts(' tasks.alamoudi.one, taskier.example.com,,'),
    ['tasks.alamoudi.one', 'taskier.example.com'],
  )
})

test('does not broaden the Vite host allowlist', () => {
  assert.deepEqual(parseAllowedHosts(), [])
  assert.throws(() => parseAllowedHosts('*'), /exact hostnames/)
  assert.throws(() => parseAllowedHosts('.example.com'), /exact hostnames/)
  assert.throws(
    () => parseAllowedHosts('https://taskier.example.com'),
    /exact hostnames/,
  )
})

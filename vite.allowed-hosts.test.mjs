import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseAllowedHosts,
  resolveAllowedHostsEnv,
} from './vite.allowed-hosts.mjs'

test('resolveAllowedHostsEnv prefers DYDAN_ALLOWED_HOSTS over legacy Dydan env', () => {
  assert.equal(
    resolveAllowedHostsEnv({
      DYDAN_ALLOWED_HOSTS: 'dev.dydan.test',
      DYDAN_ALLOWED_HOSTS: 'dev.dydan.test',
    }),
    'dev.dydan.test',
  )
  assert.equal(
    resolveAllowedHostsEnv({
      DYDAN_ALLOWED_HOSTS: 'dev.dydan.test',
    }),
    'dev.dydan.test',
  )
})

test('parseAllowedHosts accepts comma-separated hostnames', () => {
  assert.deepEqual(parseAllowedHosts('Dev.Example.Test, localhost'), [
    'dev.example.test',
    'localhost',
  ])
})

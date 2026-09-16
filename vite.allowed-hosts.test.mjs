import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseAllowedHosts,
  resolveAllowedHostsEnv,
} from './vite.allowed-hosts.mjs'

test('resolveAllowedHostsEnv reads DYDAN_ALLOWED_HOSTS from env', () => {
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

import assert from 'node:assert/strict'
import test from 'node:test'

import { parseAllowedHosts, resolveAllowedHostsEnv } from './vite.allowed-hosts.mjs'

test('resolveAllowedHostsEnv prefers DAYDAN_ALLOWED_HOSTS over legacy Taskier env', () => {
  assert.equal(
    resolveAllowedHostsEnv({
      DAYDAN_ALLOWED_HOSTS: 'dev.daydan.test',
      TASKIER_ALLOWED_HOSTS: 'dev.taskier.test',
    }),
    'dev.daydan.test',
  )
  assert.equal(
    resolveAllowedHostsEnv({
      TASKIER_ALLOWED_HOSTS: 'dev.taskier.test',
    }),
    'dev.taskier.test',
  )
})

test('parseAllowedHosts accepts comma-separated hostnames', () => {
  assert.deepEqual(parseAllowedHosts('Dev.Example.Test, localhost'), [
    'dev.example.test',
    'localhost',
  ])
})

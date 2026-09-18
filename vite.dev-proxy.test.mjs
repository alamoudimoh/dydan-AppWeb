import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveDevProxyTarget } from './vite.dev-proxy.mjs'

test('points the dev proxy at the VITE_DEV_PROXY_TARGET backend', () => {
  assert.equal(
    resolveDevProxyTarget({ VITE_DEV_PROXY_TARGET: 'http://localhost:9099' }),
    'http://localhost:9099',
  )
})

test('falls back to the standard zero-config Dydan backend port', () => {
  assert.equal(resolveDevProxyTarget({}), 'http://127.0.0.1:2021')
  assert.equal(resolveDevProxyTarget(), 'http://127.0.0.1:2021')
})
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  nativeCapturePath,
  nativeInvitePath,
  nativeTaskPath,
} from './NativeRoutes.js'

test('native task deep links use the approved all-tasks route', () => {
  assert.equal(nativeTaskPath(42), '/all-tasks?task=42')
  assert.equal(
    nativeTaskPath(42, 'true'),
    '/all-tasks?task=42&auto_complete=true',
  )
})

test('native capture and team links never navigate to legacy routes', () => {
  assert.equal(nativeCapturePath('scan'), '/all-tasks?create=1&mode=scan')
  assert.equal(nativeCapturePath(), '/all-tasks?create=1')
  assert.equal(nativeInvitePath('A B'), '/settings?invite_code=A%20B')
})

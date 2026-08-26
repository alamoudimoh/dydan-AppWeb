import assert from 'node:assert/strict'
import test from 'node:test'

import { hasAppShell, resolveAppShellMode } from './appShellModel.js'

test('public and authentication routes do not render the application shell', () => {
  assert.equal(resolveAppShellMode('/login'), 'spacer')
  assert.equal(resolveAppShellMode('/auth/google'), 'spacer')
  assert.equal(resolveAppShellMode('/payments/success'), 'none')
  assert.equal(resolveAppShellMode('/privacy'), 'none')
})

test('authenticated onboarding and product routes retain the shell', () => {
  assert.equal(hasAppShell('/circle-setup'), true)
  assert.equal(hasAppShell('/heard-about'), true)
  assert.equal(hasAppShell('/'), true)
  assert.equal(hasAppShell('/settings/account'), true)
})

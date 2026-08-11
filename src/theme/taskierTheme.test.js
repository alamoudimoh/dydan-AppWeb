import assert from 'node:assert/strict'
import test from 'node:test'

import { taskierCssVariables, taskierTokens } from './tokens.js'

test('Taskier tokens expose the approved light and dark identity', () => {
  assert.equal(taskierTokens.light.primary, '#5B21B6')
  assert.equal(taskierTokens.light.signal, '#0369A1')
  assert.equal(taskierTokens.light.page, '#FAFAFF')
  assert.equal(taskierTokens.dark.page, '#080B14')
  assert.equal(taskierTokens.dark.primary, '#C4B5FD')
  assert.equal(taskierTokens.dark.signal, '#7DD3FC')
})

test('semantic roles, local font stacks, and scheme CSS variables are centralized', () => {
  assert.deepEqual(taskierTokens.status, {
    success: '#86EFAC',
    warning: '#FCD34D',
    danger: '#FCA5A5',
    info: '#7DD3FC',
  })
  assert.match(taskierTokens.font.ui, /Ubuntu Sans/)
  assert.match(taskierTokens.font.arabic, /Cairo/)
  assert.match(taskierTokens.font.data, /JetBrains Mono/)
  assert.equal(taskierCssVariables('light')['--taskier-focus-outer'], '#5B21B6')
  assert.equal(taskierCssVariables('dark')['--taskier-focus-outer'], '#C4B5FD')
})

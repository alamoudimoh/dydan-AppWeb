import assert from 'node:assert/strict'
import test from 'node:test'

import { taskierCssVariables, taskierTokens } from './tokens.js'

test('Taskier tokens expose the approved DayDan light and dark identity', () => {
  assert.equal(taskierTokens.light.primary, '#4D40DB')
  assert.equal(taskierTokens.light.signal, '#0369A1')
  assert.equal(taskierTokens.light.page, '#F6F7F9')
  assert.equal(taskierTokens.dark.page, '#1A1F26')
  assert.equal(taskierTokens.dark.primary, '#A59CF5')
  assert.equal(taskierTokens.dark.signal, '#7DD3FC')
})

test('semantic roles, local font stacks, and scheme CSS variables are centralized', () => {
  assert.deepEqual(taskierTokens.status, {
    success: '#86EFAC',
    warning: '#FCD34D',
    danger: '#FCA5A5',
    info: '#7DD3FC',
  })
  assert.match(taskierTokens.font.ui, /Inter/)
  assert.match(taskierTokens.font.arabic, /Cairo/)
  assert.match(taskierTokens.font.data, /JetBrains Mono/)
  assert.equal(taskierCssVariables('light')['--taskier-focus-outer'], '#4D40DB')
  assert.equal(taskierCssVariables('dark')['--taskier-focus-outer'], '#A59CF5')
  assert.equal(taskierCssVariables('light')['--taskier-radius-card'], '16px')
})

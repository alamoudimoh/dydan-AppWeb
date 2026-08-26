import assert from 'node:assert/strict'
import test from 'node:test'

import {
  daydanCssVariables,
  daydanTokens,
  productCssVariables,
  productTokens,
  resolveProductBrand,
} from './tokens.js'

test('DayDan tokens expose the approved light and dark identity', () => {
  assert.equal(daydanTokens.light.primary, '#4D40DB')
  assert.equal(daydanTokens.light.signal, '#0369A1')
  assert.equal(daydanTokens.light.page, '#F6F7F9')
  assert.equal(daydanTokens.dark.page, '#1A1F26')
  assert.equal(daydanTokens.dark.primary, '#A59CF5')
  assert.equal(daydanTokens.dark.signal, '#7DD3FC')
})

test('semantic roles, local font stacks, and scheme CSS variables are centralized', () => {
  assert.deepEqual(daydanTokens.status, {
    success: '#86EFAC',
    warning: '#FCD34D',
    danger: '#FCA5A5',
    info: '#7DD3FC',
  })
  assert.match(daydanTokens.font.ui, /Comfortaa/)
  assert.match(daydanTokens.font.arabic, /Cairo/)
  assert.match(daydanTokens.font.data, /JetBrains Mono/)
  assert.equal(daydanCssVariables('light')['--daydan-focus-outer'], '#4D40DB')
  assert.equal(daydanCssVariables('dark')['--daydan-focus-outer'], '#A59CF5')
  assert.equal(daydanCssVariables('light')['--daydan-radius-card'], '16px')
})

test('product themes keep DayDan and Sovereign semantics independent', () => {
  assert.equal(resolveProductBrand('sovereign'), 'sovereign')
  assert.equal(resolveProductBrand('unknown'), 'daydan')
  assert.match(productTokens.sovereign.font.ui, /Ubuntu Sans/)
  assert.notEqual(
    productTokens.daydan.light.primary,
    productTokens.sovereign.light.primary,
  )
  assert.notEqual(
    productCssVariables('daydan', 'dark')['--product-member-1'],
    productCssVariables('sovereign', 'dark')['--product-member-1'],
  )
  assert.equal(
    productCssVariables('sovereign', 'light')['--product-primary'],
    '#0F766E',
  )
})

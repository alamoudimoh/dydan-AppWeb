import assert from 'node:assert/strict'
import test from 'node:test'

import { neutralPaletteFor } from './neutralPalette.js'
import {
  dydanCssVariables,
  dydanTokens,
  productCssVariables,
  productTokens,
  resolveProductBrand,
} from './tokens.js'

test('Dydan tokens expose the approved light and dark identity', () => {
  assert.equal(dydanTokens.light.primary, '#4D40DB')
  assert.equal(dydanTokens.light.signal, '#0369A1')
  assert.equal(dydanTokens.light.page, '#F6F7F9')
  assert.equal(dydanTokens.dark.page, '#1A1F26')
  assert.equal(dydanTokens.dark.primary, '#A59CF5')
  assert.equal(dydanTokens.dark.signal, '#7DD3FC')
})

test('semantic roles, local font stacks, and scheme CSS variables are centralized', () => {
  assert.deepEqual(dydanTokens.status, {
    success: '#86EFAC',
    warning: '#FCD34D',
    danger: '#FCA5A5',
    info: '#7DD3FC',
  })
  assert.match(dydanTokens.font.ui, /Comfortaa/)
  assert.match(dydanTokens.font.arabic, /Cairo/)
  assert.match(dydanTokens.font.data, /JetBrains Mono/)
  assert.equal(dydanCssVariables('light')['--dydan-focus-outer'], '#4D40DB')
  assert.equal(dydanCssVariables('dark')['--dydan-focus-outer'], '#A59CF5')
  assert.equal(dydanCssVariables('light')['--dydan-radius-card'], '8px')
})

test('product themes keep Dydan and Sovereign semantics independent', () => {
  assert.equal(resolveProductBrand('sovereign'), 'sovereign')
  assert.equal(resolveProductBrand('unknown'), 'dydan')
  assert.match(productTokens.sovereign.font.ui, /Ubuntu Sans/)
  assert.notEqual(
    productTokens.dydan.light.primary,
    productTokens.sovereign.light.primary,
  )
  assert.notEqual(
    productCssVariables('dydan', 'dark')['--product-member-1'],
    productCssVariables('sovereign', 'dark')['--product-member-1'],
  )
  assert.equal(
    productCssVariables('sovereign', 'light')['--product-primary'],
    '#FFC107',
  )
})

test('Sovereign semantic roles and native aliases match the approved palette', () => {
  const expected = {
    light: {
      '--product-page': '#F2F2F2',
      '--product-surface': '#FFFFFF',
      '--product-surface-subtle': '#E6E6E6',
      '--product-text': '#1A1A1A',
      '--product-text-muted': '#4D4D4D',
      '--product-boundary': '#666666',
      '--product-brand': '#1A1A1A',
      '--product-brand-hover': '#2E2E2E',
      '--product-brand-contrast': '#FFC107',
      '--product-action': '#FFC107',
      '--product-action-text': '#1A1A1A',
      '--product-gold-text': '#6B5200',
      '--product-callout': '#1A1A1A',
      '--product-callout-text': '#F2F2F2',
      '--product-callout-muted': '#999999',
      '--product-focus-inner': '#FFFFFF',
      '--product-focus-outer': '#1A1A1A',
    },
    dark: {
      '--product-page': '#1A1A1A',
      '--product-surface': '#242424',
      '--product-surface-subtle': '#2E2E2E',
      '--product-text': '#F2F2F2',
      '--product-text-muted': '#999999',
      '--product-boundary': '#999999',
      '--product-brand': '#FFC107',
      '--product-brand-hover': '#FFD04D',
      '--product-brand-contrast': '#1A1A1A',
      '--product-action': '#FFC107',
      '--product-action-text': '#1A1A1A',
      '--product-gold-text': '#FFC107',
      '--product-callout': '#2E2E2E',
      '--product-callout-text': '#F2F2F2',
      '--product-callout-muted': '#999999',
      '--product-focus-inner': '#1A1A1A',
      '--product-focus-outer': '#F2F2F2',
    },
  }

  for (const [scheme, palette] of Object.entries(expected)) {
    const variables = productCssVariables('sovereign', scheme)
    for (const [name, value] of Object.entries(palette)) {
      assert.equal(variables[name], value, `${scheme} ${name}`)
    }
    for (const radius of ['nav', 'control', 'row', 'card', 'shell']) {
      assert.equal(productTokens.sovereign.radius[radius], '8px')
    }
    for (const radius of [
      '--r-xs',
      '--r-sm',
      '--r-md',
      '--r-lg',
      '--r-xl',
      '--r-2xl',
    ]) {
      assert.equal(variables[radius], '8px')
    }
  }
})

test('neutral chrome stays legible in dark mode for both brands', () => {
  for (const brandId of ['dydan', 'sovereign']) {
    const muted = productTokens[brandId].dark.textMuted
    const dark = neutralPaletteFor(
      brandId,
      'dark',
      { 100: '#100', 700: '#700' },
      muted,
    )
    assert.equal(dark.plainColor, muted)
    assert.equal(dark.outlinedColor, muted)
    const light = neutralPaletteFor(brandId, 'light', { 100: '#100' }, muted)
    assert.equal(light.plainColor, undefined)
  }
})

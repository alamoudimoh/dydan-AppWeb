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
  assert.equal(dydanTokens.light.brand, '#4326EA')
  assert.equal(dydanTokens.light.action, '#09CCF4')
  assert.equal(dydanTokens.light.signal, '#006B80')
  assert.equal(dydanTokens.light.page, '#F8FAFF')
  assert.equal(dydanTokens.dark.page, '#080B14')
  assert.equal(dydanTokens.dark.action, '#7DD3FC')
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
  assert.equal(dydanCssVariables('light')['--dydan-focus-outer'], '#4326EA')
  assert.equal(dydanCssVariables('dark')['--dydan-focus-outer'], '#C4B5FD')
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

test('runtime theme layer: brand, action, and spec-only variables per scheme', () => {
  const dydanLight = productCssVariables('dydan', 'light')
  const sovereignLight = productCssVariables('sovereign', 'light')
  const dydanDark = productCssVariables('dydan', 'dark')

  // dydan splits brand (violet) from action (aqua) per the approved spec.
  assert.equal(dydanLight['--brand'], '#4326EA')
  assert.equal(dydanLight['--action-bg'], '#09CCF4')
  assert.equal(dydanLight['--action-text'], '#0B1020')
  assert.equal(dydanLight['--soft'], '#DDF9FF')
  assert.equal(dydanLight['--hero-wash'], 'rgba(9, 204, 244, 0.12)')
  assert.equal(dydanLight['--stage-bg'], '#F8FAFF')
  assert.equal(dydanLight['--logo-a'], '#4326EA')
  assert.equal(dydanLight['--logo-b'], '#09CCF4')
  assert.equal(dydanLight['--link'], '#4326EA')
  assert.equal(dydanLight['--link-visited'], '#3216C8')
  assert.equal(dydanLight['--shadow'], 'rgba(11, 16, 32, 0.10)')
  assert.equal(dydanDark['--hero-wash'], 'rgba(67, 38, 234, 0.16)')

  // Font stacks travel with the theme so a runtime brand switch restyles the
  // whole shell, not just colors.
  assert.match(dydanLight['--font-ui'], /Comfortaa/)
  assert.match(sovereignLight['--font-ui'], /Ubuntu/)
  assert.notEqual(dydanLight['--action-bg'], sovereignLight['--action-bg'])
})

test('Sovereign semantic roles and native aliases match the approved palette', () => {
  const expected = {
    light: {
      '--product-page': '#FFFFFF',
      '--product-surface': '#F2F2F2',
      '--product-surface-subtle': '#FFFFFF',
      '--product-text': '#1A1A1A',
      '--product-text-muted': '#4D4D4D',
      '--product-boundary': '#666666',
      '--product-brand': '#1A1A1A',
      '--product-brand-hover': '#2E2E2E',
      '--product-brand-contrast': '#FFC107',
      '--product-action': '#FFC107',
      '--product-action-text': '#1A1A1A',
      '--product-gold-text': '#4D4D4D',
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
      '--product-callout': '#242424',
      '--product-callout-text': '#F2F2F2',
      '--product-callout-muted': '#999999',
      '--product-focus-inner': '#1A1A1A',
      '--product-focus-outer': '#FFC107',
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

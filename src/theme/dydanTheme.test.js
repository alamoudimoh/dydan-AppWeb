import assert from 'node:assert/strict'
import test from 'node:test'

import { neutralPaletteFor } from './neutralPalette.js'
import {
  dydanCssVariables,
  productAccentPalettes,
  productCssVariables,
  productTokens,
  resolveProductBrand,
} from './tokens.js'

const RHYTHM_VIOLET = {
  light: {
    page: '#FFF8E8',
    surface: '#FFFFFF',
    surfaceSubtle: '#EEEAF2',
    surfaceRaised: '#FFF3D1',
    text: '#34236D',
    textMuted: '#684A00',
    boundary: '#7769B6',
    brand: '#34236D',
    brandHover: '#25174F',
    brandContrast: '#FFF8E8',
    primary: '#34236D',
    primaryHover: '#25174F',
    primaryContrast: '#FFF8E8',
    action: '#34236D',
    actionContrast: '#FFF8E8',
    signal: '#174E78',
    signalHover: '#174E78',
    brandSoft: '#FFCC5C',
    goldText: '#684A00',
    strong: '#34236D',
    strongText: '#FFF8E8',
    strongMuted: '#746F7A',
    focusInner: '#FFF8E8',
    focusOuter: '#34236D',
    heroWash: 'rgba(52, 35, 109, 0.56)',
    stage: '#FFF8E8',
    logoA: '#34236D',
    logoB: '#FFCC5C',
    link: '#25174F',
    linkVisited: '#684A00',
    shadow: 'rgba(52, 35, 109, 0.18)',
    shadowChannel: '52, 35, 109',
    backdrop: 'rgba(52, 35, 109, 0.56)',
  },
  dark: {
    page: '#34236D',
    surface: '#25174F',
    surfaceSubtle: '#25174F',
    surfaceRaised: '#160D32',
    text: '#FFF8E8',
    textMuted: '#C9BDEA',
    boundary: '#8A79BF',
    brand: '#FFF8E8',
    brandHover: '#FFDD8A',
    brandContrast: '#34236D',
    primary: '#FFCC5C',
    primaryHover: '#FFDD8A',
    primaryContrast: '#34236D',
    action: '#FFCC5C',
    actionContrast: '#34236D',
    signal: '#174E78',
    signalHover: '#174E78',
    brandSoft: '#FFCC5C',
    goldText: '#FFCC5C',
    strong: '#FFF8E8',
    strongText: '#34236D',
    strongMuted: '#C9BDEA',
    focusInner: '#34236D',
    focusOuter: '#FFCC5C',
    heroWash: 'rgba(22, 13, 50, 0.76)',
    stage: '#34236D',
    logoA: '#34236D',
    logoB: '#FFCC5C',
    link: '#FFCC5C',
    linkVisited: '#D9D1EB',
    shadow: 'rgba(22, 13, 50, 0.52)',
    shadowChannel: '22, 13, 50',
    backdrop: 'rgba(22, 13, 50, 0.76)',
  },
  status: {
    success: '#0B5D45',
    warning: '#704600',
    danger: '#8E2838',
    info: '#174E78',
  },
}

const SOVEREIGN_NAVY_BRASS = {
  light: {
    page: '#F6F2E8',
    surface: '#FFFFFF',
    surfaceSubtle: '#EBE7DE',
    surfaceRaised: '#F7EDCF',
    text: '#071A2C',
    textMuted: '#5F421B',
    boundary: '#4D7794',
    brand: '#071A2C',
    brandHover: '#142D40',
    brandContrast: '#F6F2E8',
    primary: '#071A2C',
    primaryHover: '#142D40',
    primaryContrast: '#F6F2E8',
    action: '#071A2C',
    actionContrast: '#F6F2E8',
    signal: '#164D68',
    signalHover: '#164D68',
    brandSoft: '#E0B45A',
    goldText: '#5F421B',
    strong: '#071A2C',
    strongText: '#F6F2E8',
    strongMuted: '#756F68',
    focusInner: '#F6F2E8',
    focusOuter: '#071A2C',
    heroWash: 'rgba(7, 26, 44, 0.56)',
    stage: '#F6F2E8',
    logoA: '#071A2C',
    logoB: '#E0B45A',
    link: '#142D40',
    linkVisited: '#5F421B',
    shadow: 'rgba(7, 26, 44, 0.18)',
    shadowChannel: '7, 26, 44',
    backdrop: 'rgba(7, 26, 44, 0.56)',
  },
  dark: {
    page: '#071A2C',
    surface: '#142D40',
    surfaceSubtle: '#142D40',
    surfaceRaised: '#04111D',
    text: '#F6F2E8',
    textMuted: '#AEC1CF',
    boundary: '#829FB4',
    brand: '#F6F2E8',
    brandHover: '#E8C97D',
    brandContrast: '#071A2C',
    primary: '#E0B45A',
    primaryHover: '#E8C97D',
    primaryContrast: '#071A2C',
    action: '#E0B45A',
    actionContrast: '#071A2C',
    signal: '#164D68',
    signalHover: '#164D68',
    brandSoft: '#E0B45A',
    goldText: '#E0B45A',
    strong: '#F6F2E8',
    strongText: '#071A2C',
    strongMuted: '#AEC1CF',
    focusInner: '#071A2C',
    focusOuter: '#E0B45A',
    heroWash: 'rgba(4, 17, 29, 0.76)',
    stage: '#071A2C',
    logoA: '#071A2C',
    logoB: '#E0B45A',
    link: '#E0B45A',
    linkVisited: '#D8C9A8',
    shadow: 'rgba(4, 17, 29, 0.52)',
    shadowChannel: '4, 17, 29',
    backdrop: 'rgba(4, 17, 29, 0.76)',
  },
  status: {
    success: '#0D5A3D',
    warning: '#6A4300',
    danger: '#8A222A',
    info: '#164D68',
  },
}

const EXPECTED_ACCENTS = {
  dydan: {
    light: {
      members: [
        '#34236D',
        '#FFCC5C',
        '#7769B6',
        '#D16A79',
        '#D9D1EB',
        '#2F5F8A',
      ],
      categories: ['#34236D', '#7769B6', '#D16A79', '#2F5F8A'],
      progress: ['#0B5D45', '#EEEAF2', '#8E2838'],
      chartGrid: '#EEEAF2',
    },
    dark: {
      members: [
        '#FFF8E8',
        '#FFCC5C',
        '#7769B6',
        '#D16A79',
        '#D9D1EB',
        '#FFDD8A',
      ],
      categories: ['#FFF8E8', '#7769B6', '#D16A79', '#FFDD8A'],
      progress: ['#0B5D45', '#25174F', '#8E2838'],
      chartGrid: '#2F5F8A',
    },
  },
  sovereign: {
    light: {
      members: [
        '#071A2C',
        '#E0B45A',
        '#4D7794',
        '#B86F44',
        '#D8C9A8',
        '#2C6373',
      ],
      categories: ['#071A2C', '#4D7794', '#B86F44', '#2C6373'],
      progress: ['#0D5A3D', '#EBE7DE', '#8A222A'],
      chartGrid: '#EBE7DE',
    },
    dark: {
      members: [
        '#F6F2E8',
        '#E0B45A',
        '#4D7794',
        '#B86F44',
        '#D8C9A8',
        '#E8C97D',
      ],
      categories: ['#F6F2E8', '#4D7794', '#B86F44', '#E8C97D'],
      progress: ['#0D5A3D', '#142D40', '#8A222A'],
      chartGrid: '#2C6373',
    },
  },
}

test('the existing theme list remains exactly dydan and Sovereign', () => {
  assert.deepEqual(Object.keys(productTokens), ['dydan', 'sovereign'])
  assert.equal(productTokens.dydan.id, 'dydan')
  assert.equal(productTokens.dydan.name, 'dydan')
  assert.equal(productTokens.sovereign.id, 'sovereign')
  assert.equal(productTokens.sovereign.name, 'Sovereign')
  assert.equal(resolveProductBrand('unknown'), 'dydan')
})

test('DyDan uses every approved Rhythm Violet runtime color', () => {
  assert.deepEqual(productTokens.dydan.light, RHYTHM_VIOLET.light)
  assert.deepEqual(productTokens.dydan.dark, RHYTHM_VIOLET.dark)
  assert.deepEqual(productTokens.dydan.status, RHYTHM_VIOLET.status)
  assert.deepEqual(productAccentPalettes.dydan, EXPECTED_ACCENTS.dydan)
})

test('Sovereign uses every approved Navy & Brass runtime color', () => {
  assert.deepEqual(productTokens.sovereign.light, SOVEREIGN_NAVY_BRASS.light)
  assert.deepEqual(productTokens.sovereign.dark, SOVEREIGN_NAVY_BRASS.dark)
  assert.deepEqual(productTokens.sovereign.status, SOVEREIGN_NAVY_BRASS.status)
  assert.deepEqual(productAccentPalettes.sovereign, EXPECTED_ACCENTS.sovereign)
})

test('existing CSS variables switch both themes and schemes without fallbacks', () => {
  const expected = {
    dydan: {
      light: {
        '--product-page': '#FFF8E8',
        '--product-surface': '#FFFFFF',
        '--product-text': '#34236D',
        '--product-text-muted': '#684A00',
        '--product-boundary': '#7769B6',
        '--product-brand': '#34236D',
        '--product-action': '#34236D',
        '--product-action-text': '#FFF8E8',
        '--product-gold-text': '#684A00',
        '--product-focus-outer': '#34236D',
        '--product-callout': '#34236D',
        '--product-callout-text': '#FFF8E8',
        '--product-chart-grid': '#EEEAF2',
      },
      dark: {
        '--product-page': '#34236D',
        '--product-surface': '#25174F',
        '--product-text': '#FFF8E8',
        '--product-text-muted': '#C9BDEA',
        '--product-boundary': '#8A79BF',
        '--product-brand': '#FFF8E8',
        '--product-action': '#FFCC5C',
        '--product-action-text': '#34236D',
        '--product-gold-text': '#FFCC5C',
        '--product-focus-outer': '#FFCC5C',
        '--product-callout': '#FFF8E8',
        '--product-callout-text': '#34236D',
        '--product-chart-grid': '#2F5F8A',
      },
    },
    sovereign: {
      light: {
        '--product-page': '#F6F2E8',
        '--product-surface': '#FFFFFF',
        '--product-text': '#071A2C',
        '--product-text-muted': '#5F421B',
        '--product-boundary': '#4D7794',
        '--product-brand': '#071A2C',
        '--product-action': '#071A2C',
        '--product-action-text': '#F6F2E8',
        '--product-gold-text': '#5F421B',
        '--product-focus-outer': '#071A2C',
        '--product-callout': '#071A2C',
        '--product-callout-text': '#F6F2E8',
        '--product-chart-grid': '#EBE7DE',
      },
      dark: {
        '--product-page': '#071A2C',
        '--product-surface': '#142D40',
        '--product-text': '#F6F2E8',
        '--product-text-muted': '#AEC1CF',
        '--product-boundary': '#829FB4',
        '--product-brand': '#F6F2E8',
        '--product-action': '#E0B45A',
        '--product-action-text': '#071A2C',
        '--product-gold-text': '#E0B45A',
        '--product-focus-outer': '#E0B45A',
        '--product-callout': '#F6F2E8',
        '--product-callout-text': '#071A2C',
        '--product-chart-grid': '#2C6373',
      },
    },
  }

  for (const [brand, schemes] of Object.entries(expected)) {
    for (const [scheme, palette] of Object.entries(schemes)) {
      const variables = productCssVariables(brand, scheme)
      for (const [name, value] of Object.entries(palette))
        assert.equal(variables[name], value, `${brand} ${scheme} ${name}`)
      assert.equal(
        Object.values(variables).includes(undefined),
        false,
        `${brand} ${scheme} has no undefined CSS variables`,
      )
    }
  }
  assert.equal(dydanCssVariables('light')['--dydan-focus-outer'], '#34236D')
})

test('approved contrast pairs retain their documented WCAG ratios', () => {
  const rgb = hex =>
    [1, 3, 5].map(
      index => Number.parseInt(hex.slice(index, index + 2), 16) / 255,
    )
  const luminance = hex =>
    rgb(hex)
      .map(channel =>
        channel <= 0.03928
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      )
      .reduce(
        (value, channel, index) =>
          value + channel * [0.2126, 0.7152, 0.0722][index],
        0,
      )
  const ratio = (foreground, background) => {
    const [lighter, darker] = [
      luminance(foreground),
      luminance(background),
    ].sort((a, b) => b - a)
    return (lighter + 0.05) / (darker + 0.05)
  }
  for (const [foreground, background, expected] of [
    ['#34236D', '#FFF8E8', 12.35],
    ['#34236D', '#FFCC5C', 8.74],
    ['#FFF8E8', '#0B5D45', 7.44],
    ['#FFF8E8', '#704600', 7.74],
    ['#FFF8E8', '#8E2838', 7.9],
    ['#FFF8E8', '#174E78', 8.28],
    ['#071A2C', '#F6F2E8', 15.74],
    ['#071A2C', '#E0B45A', 9.09],
    ['#F6F2E8', '#0D5A3D', 7.38],
    ['#F6F2E8', '#6A4300', 7.78],
    ['#F6F2E8', '#8A222A', 8.02],
    ['#F6F2E8', '#164D68', 8.18],
  ])
    assert.ok(
      Math.abs(ratio(foreground, background) - expected) < 0.05,
      `${foreground} on ${background}`,
    )
})

test('neutral chrome remains legible in dark mode for both existing themes', () => {
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
  }
})

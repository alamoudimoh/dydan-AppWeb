import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertNoBrandLeak,
  DYDAN_BRAND_PRIMARY,
  REFERENCE_ACCENT_PALETTES,
} from './referenceAccents.js'
import {
  REFERENCE_TYPE_ROLES,
  REFERENCE_TYPE_SCALE,
} from './referenceTypeScale.js'

const ACCENT_ROLES = [
  '--ref-member-1',
  '--ref-member-2',
  '--ref-member-3',
  '--ref-member-4',
  '--ref-member-5',
  '--ref-member-6',
  '--ref-chart-1',
  '--ref-chart-2',
  '--ref-chart-3',
  '--ref-chart-4',
  '--ref-chart-5',
  '--ref-chart-6',
  '--ref-category-1',
  '--ref-category-2',
  '--ref-category-3',
  '--ref-category-4',
  '--ref-progress-complete',
  '--ref-progress-pending',
  '--ref-progress-at-risk',
  '--ref-circle-1',
  '--ref-circle-2',
  '--ref-circle-3',
  '--ref-circle-4',
  '--ref-signal',
]

test('Sovereign never inherits Dydan member or category accents', () => {
  const identityRoles = ACCENT_ROLES.filter(
    role => !role.startsWith('--ref-progress'),
  )
  for (const scheme of ['light', 'dark']) {
    for (const role of identityRoles) {
      assert.notEqual(
        REFERENCE_ACCENT_PALETTES.dydan[scheme][role],
        REFERENCE_ACCENT_PALETTES.sovereign[scheme][role],
        `${scheme} ${role} must be brand-specific`,
      )
    }
  }
})

test('every member role has a value in every brand and color mode', () => {
  for (const brand of ['dydan', 'sovereign']) {
    for (const scheme of ['light', 'dark']) {
      for (let index = 1; index <= 6; index += 1) {
        assert.match(
          REFERENCE_ACCENT_PALETTES[brand][scheme][`--ref-member-${index}`],
          /^#[0-9A-F]{6}$/i,
        )
      }
    }
  }
})

test('every semantic accent role is defined for every brand and color mode', () => {
  for (const brand of ['dydan', 'sovereign']) {
    for (const scheme of ['light', 'dark']) {
      const palette = REFERENCE_ACCENT_PALETTES[brand][scheme]
      for (const role of ACCENT_ROLES) {
        assert.match(palette[role], /^#[0-9A-F]{6}$/i, `${role} missing`)
      }
      assert.match(palette['--ref-wordmark-font'], /font-family|'/)
    }
  }
})

test('identity and progress accents never reuse the active brand primary', () => {
  assert.deepEqual(assertNoBrandLeak(), [])
  for (const scheme of ['light', 'dark']) {
    assert.notEqual(
      REFERENCE_ACCENT_PALETTES.dydan[scheme]['--ref-member-1'],
      DYDAN_BRAND_PRIMARY[scheme],
    )
  }
})

test('chart series mirror member identity within each brand and mode', () => {
  for (const brand of ['dydan', 'sovereign']) {
    for (const scheme of ['light', 'dark']) {
      for (let index = 1; index <= 6; index += 1) {
        assert.equal(
          REFERENCE_ACCENT_PALETTES[brand][scheme][`--ref-chart-${index}`],
          REFERENCE_ACCENT_PALETTES[brand][scheme][`--ref-member-${index}`],
        )
      }
    }
  }
})

test('type scale covers every required typographic role', () => {
  for (const role of REFERENCE_TYPE_ROLES) {
    const spec = REFERENCE_TYPE_SCALE[role]
    assert.ok(spec.fontSize, `${role} needs a size`)
    assert.ok(spec.fontWeight !== undefined, `${role} needs a weight`)
  }
})

test('type scale preserves hierarchy instead of flattening weights', () => {
  assert.equal(REFERENCE_TYPE_SCALE.display.fontWeight, 700)
  assert.equal(REFERENCE_TYPE_SCALE.pageTitle.fontWeight, 700)
  assert.equal(REFERENCE_TYPE_SCALE.body.fontWeight, 400)
  assert.equal(REFERENCE_TYPE_SCALE.label.textTransform, 'uppercase')
  assert.equal(
    REFERENCE_TYPE_SCALE.metric.fontFamily,
    "'JetBrains Mono', ui-monospace, monospace",
  )
})

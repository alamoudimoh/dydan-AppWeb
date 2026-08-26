import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getReferenceBrand,
  normalizePageId,
  REFERENCE_BRANDS,
  REFERENCE_PAGE_IDS,
  resolveReferenceDirection,
} from './referenceModel.js'

test('reference covers every required product surface', () => {
  for (const page of [
    'dashboard',
    'tasks',
    'routines',
    'projects',
    'shopping',
    'calendar',
    'progress',
    'meters',
    'rewards',
    'notifications',
    'settings',
    'sessions',
    'components',
    'states',
    'arabic',
  ]) {
    assert.ok(REFERENCE_PAGE_IDS.includes(page), `missing ${page}`)
  }
})

test('brands have distinct names and wordmark fonts', () => {
  assert.notEqual(REFERENCE_BRANDS.daydan.name, REFERENCE_BRANDS.sovereign.name)
  assert.match(REFERENCE_BRANDS.daydan.wordmarkFont, /Comfortaa/)
  assert.match(REFERENCE_BRANDS.sovereign.wordmarkFont, /Ubuntu/)
  assert.equal(getReferenceBrand('unknown'), REFERENCE_BRANDS.daydan)
})

test('direction and page fallbacks are deterministic', () => {
  assert.equal(resolveReferenceDirection('ar-SA'), 'rtl')
  assert.equal(resolveReferenceDirection('en'), 'ltr')
  assert.equal(normalizePageId('calendar'), 'calendar')
  assert.equal(normalizePageId('missing'), 'dashboard')
})

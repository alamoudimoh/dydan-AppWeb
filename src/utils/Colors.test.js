import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  DEFAULT_PROJECT_COLOR,
  ENTITY_COLOR_FALLBACK,
  FILTER_COLORS,
  LABEL_COLORS,
  PROJECT_COLORS,
  getPriorityColor,
  getTextColorFromBackgroundColor,
} from './Colors.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('persisted entity palettes stay stable because they are stored data', () => {
  assert.equal(LABEL_COLORS.length, 25)
  assert.equal(LABEL_COLORS[0].name, 'Default')
  assert.equal(LABEL_COLORS[0].value, '#FFFFFF')
  const byName = Object.fromEntries(
    LABEL_COLORS.map(color => [color.name, color.value]),
  )
  assert.equal(byName.Ruby, '#d32f2f')
  assert.equal(byName.Ash, ENTITY_COLOR_FALLBACK)
})

test('filter and project palettes derive from the label palette', () => {
  const selectable = LABEL_COLORS.filter(color => color.name !== 'Default')
  assert.deepEqual(FILTER_COLORS, selectable)
  assert.deepEqual(PROJECT_COLORS, selectable)
})

test('priority colors resolve through the presentation palette', () => {
  assert.equal(getPriorityColor(1), '#d32f2f')
  assert.equal(getPriorityColor(4), '#90a4ae')
  assert.equal(getPriorityColor(undefined), '#90a4ae80')
})

test('contrast helper stays mode-independent over persisted hexes', () => {
  assert.equal(getTextColorFromBackgroundColor('#FFFFFF'), '#000000')
  assert.equal(getTextColorFromBackgroundColor('#000000'), '#ffffff')
  assert.equal(getTextColorFromBackgroundColor(''), '')
})

test('default project identity is centralized', () => {
  const hookSource = fs.readFileSync(
    path.resolve(__dirname, '../views/Chores/hooks/useProjectFilter.js'),
    'utf8',
  )
  assert.ok(hookSource.includes('DEFAULT_PROJECT_COLOR'))
})

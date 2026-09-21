import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const css = readFileSync(path.join(dir, 'pe2.css'), 'utf8')
const indexCss = readFileSync(path.join(dir, '..', 'index.css'), 'utf8')
// Comment text (e.g. the transform-notes header) must not count as rules.
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '')

test('pe2.css: every top-level class rule is scoped under .pe2', () => {
  const unscoped = []
  for (const line of cssNoComments.split('\n')) {
    const t = line.trim()
    if (!t.startsWith('.')) continue
    // Verbatim body-copy + intentionally special-cased selectors:
    if (t === '.pe2 {') continue
    // prettier-ignore
    if (t === '.pe2.theme-transitioning,' || t === '.pe2.theme-transitioning * {') continue
    if (t.startsWith('.pe2 ') || t.startsWith('.pe2.')) continue
    unscoped.push(t)
  }
  assert.deepEqual(
    unscoped,
    [],
    'top-level class rules in pe2.css must be .pe2-scoped (regression: ports must not leak styles app-wide)',
  )
})

test('pe2.css: keyframes stay global, media + rtl + theme rules stay scoped', () => {
  assert.ok(css.includes('@keyframes toastIn'), 'toastIn keyframes preserved')
  assert.ok(css.includes('@keyframes shimmer'), 'shimmer keyframes preserved')
  assert.ok(
    css.includes('@media (max-width: 768px) { .pe2 .page-header'),
    'single-line media rule scoped',
  )
  assert.ok(css.includes('[dir="rtl"] .pe2 {'), 'rtl token rule scoped')
  assert.ok(css.includes('#root.dark .pe2 {'), 'sovereign theme maps to app dark mode')
  assert.ok(!cssNoComments.includes('body {'), 'no unscoped body rule')
  assert.ok(!cssNoComments.includes(':root {'), 'no unscoped :root rule')
})

test('index.css: imports PE2 fonts and the scoped stylesheet', () => {
  assert.match(
    indexCss,
    /@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Comfortaa/,
    'PE2 Google Fonts are loaded for the ported screens',
  )
  assert.match(indexCss, /@import '\.\/pe2\/pe2\.css';/, 'scoped PE2 stylesheet imported')
})
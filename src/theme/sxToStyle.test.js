import assert from 'node:assert/strict'
import test from 'node:test'

import { sxToStyle } from './sxToStyle.js'

test('converts spacing scale to logical CSS with 8px units', () => {
  assert.deepEqual(sxToStyle({ px: 2 }), {
    paddingInlineStart: '16px',
    paddingInlineEnd: '16px',
  })
  assert.deepEqual(sxToStyle({ mt: 1 }), { marginBlockStart: '8px' })
  assert.deepEqual(sxToStyle({ py: 1.5 }), {
    paddingBlockStart: '12px',
    paddingBlockEnd: '12px',
  })
})

test('passes through layout and dimension props', () => {
  const style = sxToStyle({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
    maxHeight: 400,
    width: '100%',
  })
  assert.equal(style.display, 'flex')
  assert.equal(style.flexDirection, 'column')
  assert.equal(style.alignItems, 'center')
  assert.equal(style.gap, '8px')
  assert.equal(style.maxHeight, '400px')
  assert.equal(style.width, '100%')
})

test('maps Joy palette tokens to Figma CSS variables', () => {
  assert.equal(sxToStyle({ color: 'text.secondary' }).color, 'var(--t-muted)')
  assert.equal(
    sxToStyle({ bgcolor: 'primary.softBg' }).backgroundColor,
    'var(--brand-faint)',
  )
  assert.equal(
    sxToStyle({ color: 'danger.softColor' }).color,
    'var(--sig-over)',
  )
})

test('resolves responsive objects to their base value', () => {
  assert.deepEqual(sxToStyle({ px: { xs: 2, sm: 4 } }), {
    paddingInlineStart: '16px',
    paddingInlineEnd: '16px',
  })
})

test('skips nested selector keys instead of guessing', () => {
  const style = sxToStyle({ '& .MuiButton-root': { width: '100%' }, mt: 1 })
  assert.deepEqual(style, { marginBlockStart: '8px' })
})

test('returns undefined for empty or unknown-only sx', () => {
  assert.equal(sxToStyle({}), undefined)
  assert.equal(sxToStyle(undefined), undefined)
  assert.equal(
    sxToStyle(() => ({})),
    undefined,
  )
})

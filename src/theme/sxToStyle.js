/* Minimal MUI/Joy `sx` → inline-style resolver.
 *
 * Phase 8 migrates shared primitives onto the Figma Tailwind runtime. Call
 * sites still pass the legacy Joy `sx` object for layout niceties until they
 * themselves are migrated, so this resolver converts the practically-used
 * subset (spacing scale, layout, dimensions, common palette tokens) into
 * inline CSS. Anything exotic (`& .Mui-*` selectors, tooltip callbacks,
 * deeply nested media keys) is left alone rather than guessed.
 *
 * This is a compatibility shim only — the DOM and classes are the Figma ones.
 */

const SCALE = 8 // Joy default spacing unit, in px

const SEMANTIC_COLORS = {
  'text.primary': 'var(--t-primary)',
  'text.secondary': 'var(--t-muted)',
  'text.tertiary': 'var(--t-faint)',
  'text.faint': 'var(--t-faint)',
  'background.page': 'var(--page)',
  'background.surface': 'var(--surface)',
  'background.surface3': 'var(--surface-3)',
  'background.surface2': 'var(--surface-2)',
  'background.backdrop': 'var(--surface)',
  'primary.softBg': 'var(--brand-faint)',
  'primary.softHoverBg': 'var(--brand-faint)',
  'primary.softColor': 'var(--brand)',
  'primary.softDisabledBg': 'var(--brand-faint)',
  'primary.solidBg': 'var(--action-bg)',
  'primary.solidColor': 'var(--action-text)',
  'primary.solidHoverBg': 'var(--product-primary-hover)',
  'primary.outlinedBorder': 'var(--brand)',
  'primary.outlinedColor': 'var(--brand)',
  'primary.500': 'var(--brand)',
  'primary.600': 'var(--brand-hover)',
  'neutral.softBg': 'var(--surface-2)',
  'neutral.softHoverBg': 'var(--surface-2)',
  'neutral.softColor': 'var(--t-muted)',
  'neutral.outlinedBorder': 'var(--line)',
  'neutral.outlinedColor': 'var(--t-primary)',
  'neutral.300': 'var(--line-strong)',
  'neutral.400': 'var(--line-strong)',
  'neutral.plainColor': 'var(--t-muted)',
  'neutral.plainHoverBg': 'var(--surface-2)',
  'danger.softBg': 'var(--sig-over-bg)',
  'danger.softHoverBg': 'var(--sig-over-bg)',
  'danger.softColor': 'var(--sig-over)',
  'danger.solidBg': 'var(--sig-over)',
  'danger.outlinedBorder': 'var(--sig-over)',
  'danger.outlinedColor': 'var(--sig-over)',
  'danger.500': 'var(--sig-over)',
  'warning.softBg': 'var(--sig-due-bg)',
  'warning.softHoverBg': 'var(--sig-due-bg)',
  'warning.softColor': 'var(--sig-due)',
  'warning.500': 'var(--sig-due)',
  'success.softBg': 'var(--sig-done-bg)',
  'success.softColor': 'var(--sig-done)',
  'done.softBg': 'var(--sig-done-bg)',
  'done.softColor': 'var(--sig-done)',
}

const resolveColor = value => {
  if (typeof value !== 'string') return value
  return SEMANTIC_COLORS[value] ?? value
}

const space = value => {
  if (value === null || value === undefined || value === '') return undefined
  if (Array.isArray(value)) return space(value[0])
  if (typeof value === 'object') return space(value.xs ?? value.sm)
  if (typeof value === 'number') return `${value * SCALE}px`
  return value
}

const px = value => {
  if (Array.isArray(value)) return px(value[0])
  if (typeof value === 'object') return px(value.xs ?? value.sm)
  if (typeof value === 'number') return `${value}px`
  return value
}

const SIDES = {
  p: [
    'paddingBlockStart',
    'paddingInlineEnd',
    'paddingBlockEnd',
    'paddingInlineStart',
  ],
  m: [
    'marginBlockStart',
    'marginInlineEnd',
    'marginBlockEnd',
    'marginInlineStart',
  ],
  px: ['paddingInlineStart', 'paddingInlineEnd'],
  mx: ['marginInlineStart', 'marginInlineEnd'],
  py: ['paddingBlockStart', 'paddingBlockEnd'],
  my: ['marginBlockStart', 'marginBlockEnd'],
  pt: ['paddingBlockStart'],
  pb: ['paddingBlockEnd'],
  mt: ['marginBlockStart'],
  mb: ['marginBlockEnd'],
  ps: ['paddingInlineStart'],
  pe: ['paddingInlineEnd'],
  ms: ['marginInlineStart'],
  me: ['marginInlineEnd'],
}

const applySide = (style, key, value) => {
  const props = SIDES[key]
  if (!props) return false
  const resolved = space(value)
  if (resolved === undefined) return true
  // Four-way shorthands can collapse to a single declaration when possible.
  if (key === 'p' || key === 'm') {
    let base = key === 'p' ? 'padding' : 'margin'
    style[base] = `${resolved} ${resolved} ${resolved} ${resolved}`
    return true
  }
  for (const prop of props) style[prop] = resolved
  return true
}

const DIMENSIONS = {
  width: true,
  height: true,
  maxWidth: true,
  minWidth: true,
  maxHeight: true,
  minHeight: true,
}

const INLINE_KEYS = {
  display: true,
  flex: true,
  flexGrow: true,
  flexShrink: true,
  flexBasis: true,
  alignItems: true,
  alignSelf: true,
  justifyContent: true,
  justifySelf: true,
  flexDirection: true,
  flexWrap: true,
  position: true,
  zIndex: true,
  textAlign: true,
  overflow: true,
  overflowX: true,
  overflowY: true,
  cursor: true,
  whiteSpace: true,
  textWrap: true,
  letterSpacing: true,
  lineHeight: true,
  inset: true,
  top: true,
  bottom: true,
  left: true,
  right: true,
  insetInlineEnd: true,
  insetInlineStart: true,
  insetBlockStart: true,
  insetBlockEnd: true,
  transform: true,
  transition: true,
  opacity: true,
  borderTop: true,
  borderBottom: true,
  borderLeft: true,
  borderRight: true,
  borderWidth: true,
  borderStyle: true,
}

const COLOR_KEYS = {
  color: true,
  backgroundColor: true,
  bgcolor: true,
  borderColor: true,
  borderTopColor: true,
  borderBottomColor: true,
  outlineColor: true,
}

export const sxToStyle = (sx = {}) => {
  if (!sx) return undefined
  if (typeof sx === 'function') return undefined
  const style = {}
  for (const [key, value] of Object.entries(sx)) {
    if (key.startsWith('&') || key.startsWith('@media')) continue
    if (applySide(style, key, value)) continue
    if (key === 'gap') {
      style.gap = space(value)
      continue
    }
    if (key === 'rowGap' || key === 'columnGap') {
      style[key] = space(value)
      continue
    }
    if (DIMENSIONS[key]) {
      style[key] = px(value)
      continue
    }
    if (key === 'fontSize' || key === 'borderRadius' || key === 'borderWidth') {
      style[key] = px(value)
      continue
    }
    if (COLOR_KEYS[key]) {
      style[key === 'bgcolor' ? 'backgroundColor' : key] = resolveColor(value)
      continue
    }
    if (INLINE_KEYS[key]) {
      if (typeof value === 'object') continue
      if (key === 'lineHeight' || key === 'letterSpacing') {
        style[key] = typeof value === 'number' ? `${value}px` : value
      } else {
        style[key] = value
      }
      continue
    }
    // Unknown keys: numeric values are almost certainly spacing units.
    if (typeof value === 'number') {
      style[key] = px(value)
    }
  }
  return Object.keys(style).length ? style : undefined
}

export default sxToStyle

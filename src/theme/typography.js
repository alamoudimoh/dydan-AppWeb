export const PRODUCT_UI_FONTS = Object.freeze({
  daydan: "'Comfortaa Variable', 'Comfortaa', system-ui, sans-serif",
  sovereign: "'Ubuntu Sans Variable', 'Ubuntu', system-ui, sans-serif",
})

export const ARABIC_UI_FONT =
  "'Cairo', 'Comfortaa Variable', 'Ubuntu Sans Variable', system-ui, sans-serif"
export const DATA_FONT = "'JetBrains Mono', ui-monospace, monospace"

export const productTypeScale = Object.freeze({
  display: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3 },
  pageTitle: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.35 },
  sectionTitle: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.4 },
  cardTitle: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
  rowTitle: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.45 },
  body: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.55 },
  bodySmall: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.5 },
  label: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    lineHeight: 1.45,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  button: { fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.45 },
  metric: {
    fontFamily: DATA_FONT,
    fontSize: '1.125rem',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
})

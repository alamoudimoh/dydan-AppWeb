// Taskier's visual source of truth. Primary is brand/action, signal is the
// information/system accent, status roles describe product state, and data
// typography is reserved for compact numeric/system values.
export const taskierTokens = {
  brand: {
    primary: '#5B21B6',
    signal: '#0369A1',
    ink: '#0B1220',
    surface: '#FAFAFF',
  },
  light: {
    page: '#FAFAFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#F5F3FF',
    text: '#0B1220',
    textMuted: '#44516A',
    boundary: '#838DA0',
    primary: '#5B21B6',
    primaryHover: '#4C1D95',
    primaryContrast: '#FFFFFF',
    signal: '#0369A1',
    signalHover: '#075985',
    brandSoft: '#EDE9FE',
    strong: '#0B1220',
    strongText: '#F8FAFC',
    strongMuted: '#CBD5E1',
    focusInner: '#FFFFFF',
    focusOuter: '#5B21B6',
  },
  dark: {
    page: '#080B14',
    surface: '#0B1220',
    surfaceRaised: '#111827',
    text: '#F8FAFC',
    textMuted: '#CBD5E1',
    boundary: '#64748B',
    primary: '#C4B5FD',
    primaryHover: '#DDD6FE',
    primaryContrast: '#1E1B4B',
    signal: '#7DD3FC',
    signalHover: '#BAE6FD',
    brandSoft: '#1E1B4B',
    focusInner: '#080B14',
    focusOuter: '#C4B5FD',
  },
  status: {
    success: '#86EFAC',
    warning: '#FCD34D',
    danger: '#FCA5A5',
    info: '#7DD3FC',
  },
  font: {
    ui: "'Ubuntu Sans Variable', 'Ubuntu Sans', system-ui, sans-serif",
    arabic: "'Cairo', 'Ubuntu Sans Variable', system-ui, sans-serif",
    data: "'JetBrains Mono', ui-monospace, monospace",
  },
}

export const taskierCssVariables = scheme => {
  const colors = taskierTokens[scheme]
  return {
    '--taskier-primary': colors.primary,
    '--taskier-signal': colors.signal,
    '--taskier-ink': taskierTokens.brand.ink,
    '--taskier-page': colors.page,
    '--taskier-surface': colors.surface,
    '--taskier-surface-subtle': colors.surfaceSubtle || colors.surfaceRaised,
    '--taskier-text': colors.text,
    '--taskier-text-muted': colors.textMuted,
    '--taskier-boundary': colors.boundary,
    '--taskier-focus-inner': colors.focusInner,
    '--taskier-focus-outer': colors.focusOuter,
    '--taskier-font-ui': taskierTokens.font.ui,
    '--taskier-font-arabic': taskierTokens.font.arabic,
    '--taskier-font-data': taskierTokens.font.data,
  }
}

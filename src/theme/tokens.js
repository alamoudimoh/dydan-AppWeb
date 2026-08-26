import { ARABIC_UI_FONT, DATA_FONT, PRODUCT_UI_FONTS } from './typography.js'

const status = Object.freeze({
  success: '#86EFAC',
  warning: '#FCD34D',
  danger: '#FCA5A5',
  info: '#7DD3FC',
})

const accents = Object.freeze({
  daydan: {
    light: {
      members: [
        '#0EA5E9',
        '#F59E0B',
        '#10B981',
        '#EF4444',
        '#8B5CF6',
        '#EC4899',
      ],
      categories: ['#6D5AE6', '#0369A1', '#D97706', '#16A34A'],
      progress: ['#16A34A', '#C7CCDB', '#DC2626'],
      chartGrid: '#E0E3EB',
    },
    dark: {
      members: [
        '#38BDF8',
        '#FBBF24',
        '#34D399',
        '#F87171',
        '#A78BFA',
        '#F472B6',
      ],
      categories: ['#A5B4FC', '#7DD3FC', '#FCD34D', '#86EFAC'],
      progress: ['#86EFAC', '#4A5260', '#FCA5A5'],
      chartGrid: '#3A4150',
    },
  },
  sovereign: {
    light: {
      members: [
        '#1D4ED8',
        '#B45309',
        '#6D28D9',
        '#4D7C0F',
        '#BE185D',
        '#0E7490',
      ],
      categories: ['#0E7490', '#B45309', '#52646E', '#4D7C0F'],
      progress: ['#15803D', '#BCCBC6', '#B91C1C'],
      chartGrid: '#D4DFDB',
    },
    dark: {
      members: [
        '#93C5FD',
        '#FDBA74',
        '#C4B5FD',
        '#BEF264',
        '#F9A8D4',
        '#67E8F9',
      ],
      categories: ['#67E8F9', '#FDBA74', '#A8B8B2', '#BEF264'],
      progress: ['#86EFAC', '#365049', '#FCA5A5'],
      chartGrid: '#365049',
    },
  },
})

export const productTokens = Object.freeze({
  daydan: {
    id: 'daydan',
    name: 'DayDan',
    font: {
      ui: PRODUCT_UI_FONTS.daydan,
      arabic: ARABIC_UI_FONT,
      data: DATA_FONT,
    },
    radius: {
      nav: '9px',
      control: '10px',
      row: '12px',
      card: '16px',
      shell: '24px',
    },
    light: {
      page: '#F6F7F9',
      surface: '#FFFFFF',
      surfaceSubtle: '#EDEBFF',
      text: '#1A1F26',
      textMuted: '#6B7382',
      boundary: '#E0E3EB',
      primary: '#4D40DB',
      primaryHover: '#3D33B0',
      primaryContrast: '#FFFFFF',
      signal: '#0369A1',
      signalHover: '#075985',
      brandSoft: '#EDEBFF',
      strong: '#1A1F26',
      strongText: '#F8FAFC',
      strongMuted: '#ADB2C4',
      focusInner: '#FFFFFF',
      focusOuter: '#4D40DB',
      backdrop: 'rgba(26, 31, 38, 0.48)',
    },
    dark: {
      page: '#1A1F26',
      surface: '#232830',
      surfaceRaised: '#2B313B',
      text: '#F8FAFC',
      textMuted: '#ADB2C4',
      boundary: '#3A4150',
      primary: '#A59CF5',
      primaryHover: '#B8B0FF',
      primaryContrast: '#1E1B4B',
      signal: '#7DD3FC',
      signalHover: '#BAE6FD',
      brandSoft: '#2E2A52',
      strong: '#F8FAFC',
      strongText: '#1A1F26',
      strongMuted: '#4A5260',
      focusInner: '#1A1F26',
      focusOuter: '#A59CF5',
      backdrop: 'rgba(0, 0, 0, 0.64)',
    },
  },
  sovereign: {
    id: 'sovereign',
    name: 'Sovereign',
    font: {
      ui: PRODUCT_UI_FONTS.sovereign,
      arabic: ARABIC_UI_FONT,
      data: DATA_FONT,
    },
    radius: {
      nav: '7px',
      control: '8px',
      row: '10px',
      card: '12px',
      shell: '20px',
    },
    light: {
      page: '#F4F7F6',
      surface: '#FFFFFF',
      surfaceSubtle: '#E8F0ED',
      text: '#17211F',
      textMuted: '#5F706B',
      boundary: '#D4DFDB',
      primary: '#0F766E',
      primaryHover: '#115E59',
      primaryContrast: '#FFFFFF',
      signal: '#B45309',
      signalHover: '#92400E',
      brandSoft: '#CCFBF1',
      strong: '#17211F',
      strongText: '#F2F7F5',
      strongMuted: '#A8B8B2',
      focusInner: '#FFFFFF',
      focusOuter: '#0F766E',
      backdrop: 'rgba(8, 22, 18, 0.5)',
    },
    dark: {
      page: '#111816',
      surface: '#192320',
      surfaceRaised: '#22302C',
      text: '#F2F7F5',
      textMuted: '#A8B8B2',
      boundary: '#365049',
      primary: '#5EEAD4',
      primaryHover: '#99F6E4',
      primaryContrast: '#072D2A',
      signal: '#FDBA74',
      signalHover: '#FED7AA',
      brandSoft: '#123F39',
      strong: '#F2F7F5',
      strongText: '#111816',
      strongMuted: '#5F706B',
      focusInner: '#111816',
      focusOuter: '#5EEAD4',
      backdrop: 'rgba(3, 12, 10, 0.68)',
    },
  },
})

for (const tokens of Object.values(productTokens)) tokens.status = status

export const resolveProductBrand = value =>
  value === 'sovereign' ? 'sovereign' : 'daydan'

export const productCssVariables = (brandId, scheme) => {
  const brand = productTokens[resolveProductBrand(brandId)]
  const colors = brand[scheme]
  const palette = accents[brand.id][scheme]
  const variables = {
    '--product-primary': colors.primary,
    '--product-signal': colors.signal,
    '--product-page': colors.page,
    '--product-surface': colors.surface,
    '--product-surface-subtle': colors.surfaceSubtle || colors.surfaceRaised,
    '--product-brand-soft': colors.brandSoft,
    '--product-text': colors.text,
    '--product-text-muted': colors.textMuted,
    '--product-boundary': colors.boundary,
    '--product-focus-inner': colors.focusInner,
    '--product-focus-outer': colors.focusOuter,
    '--product-font-ui': brand.font.ui,
    '--product-font-arabic': brand.font.arabic,
    '--product-font-data': brand.font.data,
    '--product-wordmark-font': brand.font.ui,
    '--product-radius-nav': brand.radius.nav,
    '--product-radius-control': brand.radius.control,
    '--product-radius-row': brand.radius.row,
    '--product-radius-card': brand.radius.card,
    '--product-radius-shell': brand.radius.shell,
    '--product-progress-complete': palette.progress[0],
    '--product-progress-pending': palette.progress[1],
    '--product-progress-at-risk': palette.progress[2],
    '--product-chart-grid': palette.chartGrid,
  }
  palette.members.forEach((color, index) => {
    variables[`--product-member-${index + 1}`] = color
    variables[`--product-chart-${index + 1}`] = color
  })
  palette.categories.forEach((color, index) => {
    variables[`--product-category-${index + 1}`] = color
    variables[`--product-circle-${index + 1}`] = color
  })
  return {
    ...variables,
    '--daydan-primary': variables['--product-primary'],
    '--daydan-signal': variables['--product-signal'],
    '--daydan-ink': colors.strong,
    '--daydan-page': variables['--product-page'],
    '--daydan-surface': variables['--product-surface'],
    '--daydan-surface-subtle': variables['--product-surface-subtle'],
    '--daydan-brand-soft': variables['--product-brand-soft'],
    '--daydan-text': variables['--product-text'],
    '--daydan-text-muted': variables['--product-text-muted'],
    '--daydan-boundary': variables['--product-boundary'],
    '--daydan-focus-inner': variables['--product-focus-inner'],
    '--daydan-focus-outer': variables['--product-focus-outer'],
    '--daydan-font-ui': variables['--product-font-ui'],
    '--daydan-font-arabic': variables['--product-font-arabic'],
    '--daydan-font-data': variables['--product-font-data'],
    '--daydan-radius-nav': variables['--product-radius-nav'],
    '--daydan-radius-control': variables['--product-radius-control'],
    '--daydan-radius-row': variables['--product-radius-row'],
    '--daydan-radius-card': variables['--product-radius-card'],
    '--daydan-radius-shell': variables['--product-radius-shell'],
  }
}

export const daydanTokens = productTokens.daydan
export const daydanCssVariables = scheme =>
  productCssVariables('daydan', scheme)
export const productAccentPalettes = accents

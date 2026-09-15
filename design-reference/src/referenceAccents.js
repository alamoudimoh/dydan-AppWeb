const hex = value => value.toUpperCase()

export const DYDAN_BRAND_PRIMARY = Object.freeze({
  light: '#4D40DB',
  dark: '#A59CF5',
})

export const SOVEREIGN_BRAND_PRIMARY = Object.freeze({
  light: '#0F766E',
  dark: '#5EEAD4',
})

export const REFERENCE_ACCENT_PALETTES = Object.freeze({
  dydan: {
    light: {
      '--ref-wordmark-font': "'Comfortaa Variable', 'Comfortaa', sans-serif",
      '--ref-member-1': '#0EA5E9',
      '--ref-member-2': '#F59E0B',
      '--ref-member-3': '#10B981',
      '--ref-member-4': '#EF4444',
      '--ref-member-5': '#8B5CF6',
      '--ref-member-6': '#EC4899',
      '--ref-chart-1': '#0EA5E9',
      '--ref-chart-2': '#F59E0B',
      '--ref-chart-3': '#10B981',
      '--ref-chart-4': '#EF4444',
      '--ref-chart-5': '#8B5CF6',
      '--ref-chart-6': '#EC4899',
      '--ref-category-1': '#6D5AE6',
      '--ref-category-2': '#0369A1',
      '--ref-category-3': '#D97706',
      '--ref-category-4': '#16A34A',
      '--ref-progress-complete': '#16A34A',
      '--ref-progress-pending': '#C7CCDB',
      '--ref-progress-at-risk': '#DC2626',
      '--ref-circle-1': '#6D5AE6',
      '--ref-circle-2': '#0369A1',
      '--ref-circle-3': '#D97706',
      '--ref-circle-4': '#16A34A',
      '--ref-signal': '#0369A1',
      '--ref-chart-grid': '#E0E3EB',
    },
    dark: {
      '--ref-wordmark-font': "'Comfortaa Variable', 'Comfortaa', sans-serif",
      '--ref-member-1': '#38BDF8',
      '--ref-member-2': '#FBBF24',
      '--ref-member-3': '#34D399',
      '--ref-member-4': '#F87171',
      '--ref-member-5': '#A78BFA',
      '--ref-member-6': '#F472B6',
      '--ref-chart-1': '#38BDF8',
      '--ref-chart-2': '#FBBF24',
      '--ref-chart-3': '#34D399',
      '--ref-chart-4': '#F87171',
      '--ref-chart-5': '#A78BFA',
      '--ref-chart-6': '#F472B6',
      '--ref-category-1': '#A5B4FC',
      '--ref-category-2': '#7DD3FC',
      '--ref-category-3': '#FCD34D',
      '--ref-category-4': '#86EFAC',
      '--ref-progress-complete': '#86EFAC',
      '--ref-progress-pending': '#4A5260',
      '--ref-progress-at-risk': '#FCA5A5',
      '--ref-circle-1': '#A5B4FC',
      '--ref-circle-2': '#7DD3FC',
      '--ref-circle-3': '#FCD34D',
      '--ref-circle-4': '#86EFAC',
      '--ref-signal': '#7DD3FC',
      '--ref-chart-grid': '#3A4150',
    },
  },
  sovereign: {
    light: {
      '--ref-wordmark-font': "'Ubuntu Sans Variable', 'Ubuntu', sans-serif",
      '--ref-member-1': '#1D4ED8',
      '--ref-member-2': '#B45309',
      '--ref-member-3': '#6D28D9',
      '--ref-member-4': '#4D7C0F',
      '--ref-member-5': '#BE185D',
      '--ref-member-6': '#0E7490',
      '--ref-chart-1': '#1D4ED8',
      '--ref-chart-2': '#B45309',
      '--ref-chart-3': '#6D28D9',
      '--ref-chart-4': '#4D7C0F',
      '--ref-chart-5': '#BE185D',
      '--ref-chart-6': '#0E7490',
      '--ref-category-1': '#0E7490',
      '--ref-category-2': '#B45309',
      '--ref-category-3': '#52646E',
      '--ref-category-4': '#4D7C0F',
      '--ref-progress-complete': '#15803D',
      '--ref-progress-pending': '#BCCBC6',
      '--ref-progress-at-risk': '#B91C1C',
      '--ref-circle-1': '#0E7490',
      '--ref-circle-2': '#B45309',
      '--ref-circle-3': '#52646E',
      '--ref-circle-4': '#4D7C0F',
      '--ref-signal': '#B45309',
      '--ref-chart-grid': '#D4DFDB',
    },
    dark: {
      '--ref-wordmark-font': "'Ubuntu Sans Variable', 'Ubuntu', sans-serif",
      '--ref-member-1': '#93C5FD',
      '--ref-member-2': '#FDBA74',
      '--ref-member-3': '#C4B5FD',
      '--ref-member-4': '#BEF264',
      '--ref-member-5': '#F9A8D4',
      '--ref-member-6': '#67E8F9',
      '--ref-chart-1': '#93C5FD',
      '--ref-chart-2': '#FDBA74',
      '--ref-chart-3': '#C4B5FD',
      '--ref-chart-4': '#BEF264',
      '--ref-chart-5': '#F9A8D4',
      '--ref-chart-6': '#67E8F9',
      '--ref-category-1': '#67E8F9',
      '--ref-category-2': '#FDBA74',
      '--ref-category-3': '#A8B8B2',
      '--ref-category-4': '#BEF264',
      '--ref-progress-complete': '#86EFAC',
      '--ref-progress-pending': '#365049',
      '--ref-progress-at-risk': '#FCA5A5',
      '--ref-circle-1': '#67E8F9',
      '--ref-circle-2': '#FDBA74',
      '--ref-circle-3': '#A8B8B2',
      '--ref-circle-4': '#BEF264',
      '--ref-signal': '#FDBA74',
      '--ref-chart-grid': '#365049',
    },
  },
})

export const assertNoBrandLeak = () => {
  const violations = []
  for (const scheme of ['light', 'dark']) {
    const dydanPrimary = hex(DYDAN_BRAND_PRIMARY[scheme])
    const sovereignPrimary = hex(SOVEREIGN_BRAND_PRIMARY[scheme])
    for (const [brand, primary] of [
      ['dydan', dydanPrimary],
      ['sovereign', sovereignPrimary],
    ]) {
      const palette = REFERENCE_ACCENT_PALETTES[brand][scheme]
      for (const [role, value] of Object.entries(palette)) {
        if (role.startsWith('--ref-wordmark')) continue
        if (hex(value) === primary) {
          violations.push(`${brand}/${scheme} ${role} equals brand primary`)
        }
      }
    }
  }
  return violations
}

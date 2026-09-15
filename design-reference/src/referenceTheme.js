import { extendTheme } from '@mui/joy/styles'

import dydanTheme from '../../src/theme/dydanTheme.js'
import { dydanCssVariables, dydanTokens } from '../../src/theme/tokens.js'
import { REFERENCE_ACCENT_PALETTES } from './referenceAccents.js'
import {
  DYDAN_UI_FONT,
  REFERENCE_TYPE_SCALE,
  SOVEREIGN_UI_FONT,
} from './referenceTypeScale.js'

const joyScale = () => ({
  h1: {
    ...REFERENCE_TYPE_SCALE.pageTitle,
    letterSpacing: '-0.005em',
  },
  h2: { ...REFERENCE_TYPE_SCALE.sectionTitle },
  'title-lg': { ...REFERENCE_TYPE_SCALE.sectionTitle },
  'title-md': { ...REFERENCE_TYPE_SCALE.cardTitle },
  'title-sm': { ...REFERENCE_TYPE_SCALE.rowTitle },
  'body-md': { ...REFERENCE_TYPE_SCALE.body },
  'body-sm': { ...REFERENCE_TYPE_SCALE.bodySmall },
  'body-xs': { ...REFERENCE_TYPE_SCALE.label },
})

const typographyOverrides = theme => ({
  ...theme.typography,
  ...joyScale(),
})

const statusPalette = (base, lightBg, darkText) => ({
  50: lightBg,
  100: lightBg,
  200: base,
  300: base,
  400: base,
  500: darkText,
  600: darkText,
  700: darkText,
  800: darkText,
  900: darkText,
})

const sovereign = {
  light: {
    page: '#F4F7F6',
    surface: '#FFFFFF',
    raised: '#E8F0ED',
    text: '#17211F',
    muted: '#5F706B',
    boundary: '#D4DFDB',
    primary: '#0F766E',
    primaryHover: '#115E59',
    primaryContrast: '#FFFFFF',
    soft: '#CCFBF1',
    signal: '#B45309',
    signalHover: '#92400E',
    strong: '#17211F',
  },
  dark: {
    page: '#111816',
    surface: '#192320',
    raised: '#22302C',
    text: '#F2F7F5',
    muted: '#A8B8B2',
    boundary: '#365049',
    primary: '#5EEAD4',
    primaryHover: '#99F6E4',
    primaryContrast: '#072D2A',
    soft: '#123F39',
    signal: '#FDBA74',
    signalHover: '#FED7AA',
    strong: '#F2F7F5',
  },
}

const sovereignPrimaryLight = {
  50: '#F0FDFA',
  100: '#CCFBF1',
  200: '#99F6E4',
  300: '#5EEAD4',
  400: '#2DD4BF',
  500: '#0F766E',
  600: '#115E59',
  700: '#134E4A',
  800: '#123F3B',
  900: '#072D2A',
}

const sovereignPrimaryDark = {
  50: '#123F39',
  100: '#164E47',
  200: '#0F766E',
  300: '#14B8A6',
  400: '#2DD4BF',
  500: '#5EEAD4',
  600: '#99F6E4',
  700: '#CCFBF1',
  800: '#E6FFFA',
  900: '#F0FDFA',
}

const copperLight = {
  50: '#FFF7ED',
  100: '#FFEDD5',
  200: '#FED7AA',
  300: '#FDBA74',
  400: '#FB923C',
  500: '#C76614',
  600: '#B45309',
  700: '#92400E',
  800: '#78350F',
  900: '#431407',
}

const sovereignNeutralLight = {
  50: '#F4F7F6',
  100: '#E8F0ED',
  200: '#D4DFDB',
  300: '#BCCBC6',
  400: '#94A69F',
  500: '#5F706B',
  600: '#43524E',
  700: '#17211F',
  800: '#111816',
  900: '#0B100F',
}

const sovereignNeutralDark = {
  50: '#F2F7F5',
  100: '#A8B8B2',
  200: '#70847D',
  300: '#52645E',
  400: '#365049',
  500: '#2B3B36',
  600: '#22302C',
  700: '#192320',
  800: '#111816',
  900: '#0B100F',
}

const componentOverrides = radius => ({
  JoyButton: {
    styleOverrides: {
      root: ({ ownerState }) => ({
        minHeight:
          ownerState.size === 'lg'
            ? '44px'
            : ownerState.size === 'sm'
              ? '36px'
              : '42px',
        borderRadius: radius.control,
        fontWeight: REFERENCE_TYPE_SCALE.button.fontWeight,
        fontSize: REFERENCE_TYPE_SCALE.button.fontSize,
        lineHeight: 1.45,
        transition:
          'background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }),
    },
  },
  JoyIconButton: {
    styleOverrides: { root: { borderRadius: radius.control } },
  },
  JoyCard: {
    styleOverrides: {
      root: ({ ownerState }) => ({
        borderRadius: radius.card,
        borderColor: 'var(--joy-palette-divider)',
        '--Card-radius': radius.card,
        ...(ownerState.variant === 'outlined' && {
          boxShadow: 'none',
          backgroundColor: 'var(--joy-palette-background-surface)',
        }),
      }),
    },
  },
  JoyModalDialog: {
    styleOverrides: {
      root: {
        borderRadius: radius.card,
        borderColor: 'var(--joy-palette-divider)',
      },
    },
  },
  JoyInput: {
    styleOverrides: {
      root: { borderRadius: radius.control, '--Input-focusedThickness': '2px' },
    },
  },
  JoyTextarea: {
    styleOverrides: {
      root: {
        borderRadius: radius.control,
        '--Textarea-focusedThickness': '2px',
      },
    },
  },
  JoySelect: {
    styleOverrides: {
      root: {
        borderRadius: radius.control,
        '--Select-focusedThickness': '2px',
      },
    },
  },
  JoyListItemButton: {
    styleOverrides: { root: { borderRadius: radius.nav } },
  },
})

export const sovereignTheme = extendTheme({
  fontFamily: {
    body: SOVEREIGN_UI_FONT,
    display: SOVEREIGN_UI_FONT,
    code: dydanTokens.font.data,
    fallback: 'system-ui, sans-serif',
  },
  radius: {
    xs: '4px',
    sm: '7px',
    md: '8px',
    lg: '12px',
    xl: '20px',
  },
  shadow: {
    xs: '0 1px 2px rgba(8, 22, 18, 0.06)',
    sm: '0 3px 10px rgba(8, 22, 18, 0.07)',
    md: '0 10px 26px rgba(8, 22, 18, 0.09)',
    lg: '0 18px 42px rgba(8, 22, 18, 0.12)',
    xl: '0 28px 68px rgba(8, 22, 18, 0.15)',
  },
  typography: {
    h1: {
      ...REFERENCE_TYPE_SCALE.pageTitle,
      letterSpacing: '-0.01em',
    },
    h2: { ...REFERENCE_TYPE_SCALE.sectionTitle },
    'title-lg': { ...REFERENCE_TYPE_SCALE.sectionTitle },
    'title-md': { ...REFERENCE_TYPE_SCALE.cardTitle },
    'body-md': {
      fontSize: REFERENCE_TYPE_SCALE.bodySmall.fontSize,
      lineHeight: 1.5,
    },
    'body-sm': { fontSize: '0.75rem', lineHeight: 1.5 },
    'body-xs': {
      fontSize: '0.625rem',
      lineHeight: 1.45,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          ...sovereignPrimaryLight,
          solidBg: sovereign.light.primary,
          solidColor: sovereign.light.primaryContrast,
          solidHoverBg: sovereign.light.primaryHover,
          softBg: sovereign.light.soft,
          softColor: sovereign.light.primary,
          outlinedBorder: sovereign.light.boundary,
        },
        neutral: sovereignNeutralLight,
        info: {
          ...copperLight,
          solidBg: sovereign.light.signal,
          solidHoverBg: sovereign.light.signalHover,
        },
        success: statusPalette('#86EFAC', '#F0FDF4', '#166534'),
        warning: statusPalette('#FCD34D', '#FFFBEB', '#854D0E'),
        danger: statusPalette('#FCA5A5', '#FEF2F2', '#991B1B'),
        background: {
          body: sovereign.light.page,
          surface: sovereign.light.surface,
          popup: sovereign.light.surface,
          level1: sovereign.light.raised,
          level2: sovereign.light.soft,
          level3: '#BEEFE5',
          tooltip: sovereign.light.strong,
          backdrop: 'rgba(23, 33, 31, 0.5)',
        },
        text: {
          primary: sovereign.light.text,
          secondary: sovereign.light.muted,
          tertiary: '#94A69F',
          icon: sovereign.light.muted,
        },
        divider: sovereign.light.boundary,
      },
    },
    dark: {
      palette: {
        primary: {
          ...sovereignPrimaryDark,
          solidBg: sovereign.dark.primary,
          solidColor: sovereign.dark.primaryContrast,
          solidHoverBg: sovereign.dark.primaryHover,
          softBg: sovereign.dark.soft,
          softColor: sovereign.dark.primary,
          outlinedBorder: sovereign.dark.boundary,
        },
        neutral: sovereignNeutralDark,
        info: {
          ...copperLight,
          500: sovereign.dark.signal,
          600: sovereign.dark.signal,
          700: sovereign.dark.signalHover,
          solidBg: sovereign.dark.signal,
          solidColor: '#431407',
          solidHoverBg: sovereign.dark.signalHover,
        },
        success: statusPalette('#86EFAC', '#052E16', '#86EFAC'),
        warning: statusPalette('#FCD34D', '#422006', '#FCD34D'),
        danger: statusPalette('#FCA5A5', '#450A0A', '#FCA5A5'),
        background: {
          body: sovereign.dark.page,
          surface: sovereign.dark.surface,
          popup: sovereign.dark.raised,
          level1: sovereign.dark.raised,
          level2: sovereign.dark.soft,
          level3: '#164E47',
          tooltip: sovereign.dark.raised,
          backdrop: 'rgba(0, 0, 0, 0.68)',
        },
        text: {
          primary: sovereign.dark.text,
          secondary: sovereign.dark.muted,
          tertiary: '#70847D',
          icon: sovereign.dark.muted,
        },
        divider: sovereign.dark.boundary,
      },
    },
  },
  components: componentOverrides({
    nav: '7px',
    control: '8px',
    card: '12px',
  }),
})

const themeVariables = {
  dydan: {
    light: {
      ...dydanCssVariables('light'),
      '--dydan-font-ui': DYDAN_UI_FONT,
      ...REFERENCE_ACCENT_PALETTES.dydan.light,
    },
    dark: {
      ...dydanCssVariables('dark'),
      '--dydan-font-ui': DYDAN_UI_FONT,
      ...REFERENCE_ACCENT_PALETTES.dydan.dark,
    },
  },
  sovereign: {
    light: {
      '--dydan-primary': sovereign.light.primary,
      '--dydan-signal': sovereign.light.signal,
      '--dydan-ink': sovereign.light.text,
      '--dydan-page': sovereign.light.page,
      '--dydan-surface': sovereign.light.surface,
      '--dydan-surface-subtle': sovereign.light.raised,
      '--dydan-brand-soft': sovereign.light.soft,
      '--dydan-text': sovereign.light.text,
      '--dydan-text-muted': sovereign.light.muted,
      '--dydan-boundary': sovereign.light.boundary,
      '--dydan-focus-inner': '#FFFFFF',
      '--dydan-focus-outer': sovereign.light.primary,
      '--dydan-font-ui': SOVEREIGN_UI_FONT,
      '--dydan-font-arabic': dydanTokens.font.arabic,
      '--dydan-font-data': dydanTokens.font.data,
      '--dydan-radius-nav': '7px',
      '--dydan-radius-control': '8px',
      '--dydan-radius-row': '10px',
      '--dydan-radius-card': '12px',
      '--dydan-radius-shell': '20px',
      ...REFERENCE_ACCENT_PALETTES.sovereign.light,
    },
    dark: {
      '--dydan-primary': sovereign.dark.primary,
      '--dydan-signal': sovereign.dark.signal,
      '--dydan-ink': sovereign.dark.text,
      '--dydan-page': sovereign.dark.page,
      '--dydan-surface': sovereign.dark.surface,
      '--dydan-surface-subtle': sovereign.dark.raised,
      '--dydan-brand-soft': sovereign.dark.soft,
      '--dydan-text': sovereign.dark.text,
      '--dydan-text-muted': sovereign.dark.muted,
      '--dydan-boundary': sovereign.dark.boundary,
      '--dydan-focus-inner': sovereign.dark.page,
      '--dydan-focus-outer': sovereign.dark.primary,
      '--dydan-font-ui': SOVEREIGN_UI_FONT,
      '--dydan-font-arabic': dydanTokens.font.arabic,
      '--dydan-font-data': dydanTokens.font.data,
      '--dydan-radius-nav': '7px',
      '--dydan-radius-control': '8px',
      '--dydan-radius-row': '10px',
      '--dydan-radius-card': '12px',
      '--dydan-radius-shell': '20px',
      ...REFERENCE_ACCENT_PALETTES.sovereign.dark,
    },
  },
}

const semanticVariables = {
  light: {
    '--joy-palette-success-softBg': '#F0FDF4',
    '--joy-palette-success-softColor': '#166534',
    '--joy-palette-success-softHoverBg': '#DCFCE7',
    '--joy-palette-success-outlinedBorder': '#86EFAC',
    '--joy-palette-success-outlinedColor': '#166534',
    '--joy-palette-success-solidBg': '#16A34A',
    '--joy-palette-success-solidColor': '#FFFFFF',
    '--joy-palette-warning-softBg': '#FFFBEB',
    '--joy-palette-warning-softColor': '#854D0E',
    '--joy-palette-warning-softHoverBg': '#FEF3C7',
    '--joy-palette-warning-outlinedBorder': '#FCD34D',
    '--joy-palette-warning-outlinedColor': '#854D0E',
    '--joy-palette-warning-solidBg': '#D97706',
    '--joy-palette-warning-solidColor': '#FFFFFF',
    '--joy-palette-danger-softBg': '#FEF2F2',
    '--joy-palette-danger-softColor': '#991B1B',
    '--joy-palette-danger-softHoverBg': '#FEE2E2',
    '--joy-palette-danger-outlinedBorder': '#FCA5A5',
    '--joy-palette-danger-outlinedColor': '#991B1B',
    '--joy-palette-danger-solidBg': '#DC2626',
    '--joy-palette-danger-solidColor': '#FFFFFF',
  },
  dark: {
    '--joy-palette-success-softBg': '#052E16',
    '--joy-palette-success-softColor': '#86EFAC',
    '--joy-palette-success-softHoverBg': '#14532D',
    '--joy-palette-success-outlinedBorder': '#166534',
    '--joy-palette-success-outlinedColor': '#86EFAC',
    '--joy-palette-success-solidBg': '#86EFAC',
    '--joy-palette-success-solidColor': '#052E16',
    '--joy-palette-warning-softBg': '#422006',
    '--joy-palette-warning-softColor': '#FCD34D',
    '--joy-palette-warning-softHoverBg': '#713F12',
    '--joy-palette-warning-outlinedBorder': '#854D0E',
    '--joy-palette-warning-outlinedColor': '#FCD34D',
    '--joy-palette-warning-solidBg': '#FCD34D',
    '--joy-palette-warning-solidColor': '#422006',
    '--joy-palette-danger-softBg': '#450A0A',
    '--joy-palette-danger-softColor': '#FCA5A5',
    '--joy-palette-danger-softHoverBg': '#7F1D1D',
    '--joy-palette-danger-outlinedBorder': '#991B1B',
    '--joy-palette-danger-outlinedColor': '#FCA5A5',
    '--joy-palette-danger-solidBg': '#FCA5A5',
    '--joy-palette-danger-solidColor': '#450A0A',
  },
}

const infoVariables = {
  dydan: {
    light: {
      '--joy-palette-info-softBg': '#E0F2FE',
      '--joy-palette-info-softColor': '#075985',
      '--joy-palette-info-softHoverBg': '#BAE6FD',
    },
    dark: {
      '--joy-palette-info-softBg': '#0C4A6E',
      '--joy-palette-info-softColor': '#7DD3FC',
      '--joy-palette-info-softHoverBg': '#075985',
    },
  },
  sovereign: {
    light: {
      '--joy-palette-info-softBg': '#FFF7ED',
      '--joy-palette-info-softColor': '#92400E',
      '--joy-palette-info-softHoverBg': '#FFEDD5',
    },
    dark: {
      '--joy-palette-info-softBg': '#431407',
      '--joy-palette-info-softColor': '#FDBA74',
      '--joy-palette-info-softHoverBg': '#78350F',
    },
  },
}

export { REFERENCE_TYPE_SCALE } from './referenceTypeScale.js'

const referenceDydanButton = {
  styleOverrides: {
    root: ({ ownerState }) => ({
      minHeight:
        ownerState.size === 'lg'
          ? '44px'
          : ownerState.size === 'sm'
            ? '36px'
            : '42px',
      borderRadius: dydanTokens.radius.control,
      fontWeight: REFERENCE_TYPE_SCALE.button.fontWeight,
      fontSize: REFERENCE_TYPE_SCALE.button.fontSize,
      lineHeight: REFERENCE_TYPE_SCALE.button.lineHeight,
      ...(ownerState.variant === 'solid' &&
        ownerState.size !== 'sm' &&
        ownerState.size !== 'lg' && {
          px: 2,
          py: 1.375,
        }),
      transition:
        'background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease',
      '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
    }),
  },
}

export const referenceDydanTheme = extendTheme({
  ...dydanTheme,
  fontFamily: {
    body: DYDAN_UI_FONT,
    display: DYDAN_UI_FONT,
    code: dydanTokens.font.data,
    fallback: 'system-ui, sans-serif',
  },
  typography: typographyOverrides(dydanTheme),
  components: {
    ...dydanTheme.components,
    JoyButton: referenceDydanButton,
  },
})

export const getReferenceTheme = brand =>
  brand === 'sovereign' ? sovereignTheme : referenceDydanTheme

export const getReferenceGlobalStyles = brand => ({
  ':root': {
    ...themeVariables[brand].light,
    ...semanticVariables.light,
    ...infoVariables[brand].light,
  },
  '[data-joy-color-scheme="dark"]': {
    ...themeVariables[brand].dark,
    ...semanticVariables.dark,
    ...infoVariables[brand].dark,
  },
  body: {
    margin: 0,
    minWidth: 320,
    minHeight: '100vh',
    backgroundColor: 'var(--joy-palette-background-body)',
  },
  '#root': { minHeight: '100vh' },
})

export const REFERENCE_PALETTES = themeVariables

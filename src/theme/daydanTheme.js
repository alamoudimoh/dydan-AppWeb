import { extendTheme } from '@mui/joy/styles'

import { daydanCssVariables, daydanTokens } from './tokens'

const violetLight = {
  50: '#F5F4FF',
  100: '#EDEBFF',
  200: '#D4D0FF',
  300: '#B5AFFF',
  400: '#8B83F0',
  500: '#4D40DB',
  600: '#3D33B0',
  700: '#322AA0',
  800: '#282388',
  900: '#1E1A66',
}
const violetDark = {
  50: '#2E2A52',
  100: '#3A3568',
  200: '#4A4480',
  300: '#6B63B8',
  400: '#8B83F0',
  500: '#A59CF5',
  600: '#B8B0FF',
  700: '#D4D0FF',
  800: '#EDEBFF',
  900: '#F5F4FF',
}
const signalLight = {
  50: '#F0F9FF',
  100: '#E0F2FE',
  200: '#BAE6FD',
  300: '#7DD3FC',
  400: '#38BDF8',
  500: '#0284C7',
  600: '#0369A1',
  700: '#075985',
  800: '#0C4A6E',
  900: '#082F49',
}
const signalDark = {
  ...signalLight,
  500: '#7DD3FC',
  600: '#7DD3FC',
  700: '#BAE6FD',
}
const neutralLight = {
  50: '#F6F7F9',
  100: '#EEF0F4',
  200: '#E0E3EB',
  300: '#C7CCDB',
  400: '#ADB2C4',
  500: '#6B7382',
  600: '#4A5260',
  700: '#1A1F26',
  800: '#141820',
  900: '#0D1017',
}
const neutralDark = {
  50: '#F8FAFC',
  100: '#ADB2C4',
  200: '#6B7382',
  300: '#4A5260',
  400: '#3A4150',
  500: '#2B313B',
  600: '#232830',
  700: '#1A1F26',
  800: '#141820',
  900: '#0D1017',
}
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

const light = daydanTokens.light
const dark = daydanTokens.dark
const { radius } = daydanTokens

export const daydanTheme = extendTheme({
  fontFamily: {
    body: daydanTokens.font.ui,
    display: daydanTokens.font.ui,
    code: daydanTokens.font.data,
    fallback: 'system-ui, sans-serif',
  },
  radius: {
    xs: '6px',
    sm: radius.nav,
    md: radius.control,
    lg: radius.card,
    xl: radius.shell,
  },
  shadow: {
    xs: '0 1px 2px rgba(26, 31, 38, 0.05)',
    sm: '0 2px 8px rgba(26, 31, 38, 0.06)',
    md: '0 8px 24px rgba(26, 31, 38, 0.08)',
    lg: '0 16px 40px rgba(26, 31, 38, 0.10)',
    xl: '0 24px 64px rgba(26, 31, 38, 0.12)',
  },
  typography: {
    h1: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.45,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.45,
    },
    'title-lg': {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.45,
    },
    'title-md': {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.45,
    },
    'body-md': {
      fontSize: '0.875rem',
      lineHeight: 1.45,
    },
    'body-sm': {
      fontSize: '0.75rem',
      lineHeight: 1.45,
    },
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
          ...violetLight,
          solidBg: light.primary,
          solidColor: light.primaryContrast,
          solidHoverBg: light.primaryHover,
          softBg: light.brandSoft,
          softColor: light.primary,
          outlinedBorder: light.boundary,
        },
        neutral: neutralLight,
        info: {
          ...signalLight,
          solidBg: light.signal,
          solidHoverBg: light.signalHover,
        },
        success: statusPalette(
          daydanTokens.status.success,
          '#F0FDF4',
          '#166534',
        ),
        warning: statusPalette(
          daydanTokens.status.warning,
          '#FFFBEB',
          '#854D0E',
        ),
        danger: statusPalette(
          daydanTokens.status.danger,
          '#FEF2F2',
          '#991B1B',
        ),
        background: {
          body: light.page,
          surface: light.surface,
          popup: light.surface,
          level1: light.surfaceSubtle,
          level2: light.brandSoft,
          level3: '#D4D0FF',
          tooltip: light.strong,
          backdrop: 'rgba(26, 31, 38, 0.48)',
        },
        text: {
          primary: light.text,
          secondary: light.textMuted,
          tertiary: '#ADB2C4',
          icon: light.textMuted,
        },
        divider: light.boundary,
      },
    },
    dark: {
      palette: {
        primary: {
          ...violetDark,
          solidBg: dark.primary,
          solidColor: dark.primaryContrast,
          solidHoverBg: dark.primaryHover,
          softBg: dark.brandSoft,
          softColor: dark.primary,
          outlinedBorder: dark.boundary,
        },
        neutral: neutralDark,
        info: {
          ...signalDark,
          solidBg: dark.signal,
          solidColor: dark.primaryContrast,
          solidHoverBg: dark.signalHover,
        },
        success: statusPalette(
          daydanTokens.status.success,
          '#052E16',
          '#86EFAC',
        ),
        warning: statusPalette(
          daydanTokens.status.warning,
          '#422006',
          '#FCD34D',
        ),
        danger: statusPalette(
          daydanTokens.status.danger,
          '#450A0A',
          '#FCA5A5',
        ),
        background: {
          body: dark.page,
          surface: dark.surface,
          popup: dark.surfaceRaised,
          level1: dark.surfaceRaised,
          level2: dark.brandSoft,
          level3: '#3A3568',
          tooltip: dark.surfaceRaised,
          backdrop: 'rgba(0, 0, 0, 0.64)',
        },
        text: {
          primary: dark.text,
          secondary: dark.textMuted,
          tertiary: '#ADB2C4',
          icon: dark.textMuted,
        },
        divider: dark.boundary,
      },
    },
  },
  components: {
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
          fontWeight: 500,
          fontSize: '0.875rem',
          lineHeight: 1.45,
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
    },
    JoyIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.control,
          transition:
            'background-color 180ms ease, border-color 180ms ease, color 180ms ease',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        },
      },
    },
    JoyCard: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: radius.card,
          borderColor: 'var(--joy-palette-divider)',
          '--Card-radius': radius.card,
          ...(ownerState.variant === 'outlined' && {
            boxShadow: 'none',
            bgcolor: 'background.surface',
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
        root: {
          borderRadius: radius.control,
          '--Input-focusedThickness': '2px',
        },
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
    JoyChip: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.variant === 'soft' &&
            ownerState.color === 'primary' && {
              bgcolor: 'var(--daydan-brand-soft)',
              color: 'var(--daydan-primary)',
              fontWeight: 500,
              fontSize: '0.75rem',
              borderRadius: '999px',
              px: 1.25,
              py: 0.75,
            }),
        }),
      },
    },
    JoyListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.nav,
        },
      },
    },
    JoyLink: {
      styleOverrides: {
        root: {
          color: 'var(--daydan-primary)',
          textUnderlineOffset: '0.18em',
          '&:hover': { textDecoration: 'underline' },
        },
      },
    },
  },
})

export const daydanGlobalStyles = {
  ':root': daydanCssVariables('light'),
  '[data-joy-color-scheme="dark"]': daydanCssVariables('dark'),
  '@media (prefers-contrast: more)': {
    ':root': {
      '--daydan-text-muted': '#1A1F26',
      '--daydan-boundary': '#4A5260',
      '--joy-palette-text-secondary': '#1A1F26',
      '--joy-palette-divider': '#4A5260',
    },
    '[data-joy-color-scheme="dark"]': {
      '--daydan-text-muted': '#F8FAFC',
      '--daydan-boundary': '#ADB2C4',
      '--joy-palette-text-secondary': '#F8FAFC',
      '--joy-palette-divider': '#ADB2C4',
    },
  },
}

export default daydanTheme

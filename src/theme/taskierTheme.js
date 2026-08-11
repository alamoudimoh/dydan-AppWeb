import { extendTheme } from '@mui/joy/styles'

import { taskierCssVariables, taskierTokens } from './tokens'

const violetLight = {
  50: '#F5F3FF',
  100: '#EDE9FE',
  200: '#DDD6FE',
  300: '#C4B5FD',
  400: '#A78BFA',
  500: '#7C3AED',
  600: '#5B21B6',
  700: '#4C1D95',
  800: '#3B1675',
  900: '#2E1065',
}
const violetDark = {
  ...violetLight,
  500: '#C4B5FD',
  600: '#C4B5FD',
  700: '#DDD6FE',
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
  50: '#FAFAFF',
  100: '#F5F3FF',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#838DA0',
  500: '#64748B',
  600: '#44516A',
  700: '#334155',
  800: '#1E293B',
  900: '#0B1220',
}
const neutralDark = {
  50: '#F8FAFC',
  100: '#E2E8F0',
  200: '#CBD5E1',
  300: '#94A3B8',
  400: '#64748B',
  500: '#475569',
  600: '#334155',
  700: '#1E293B',
  800: '#111827',
  900: '#0B1220',
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

const light = taskierTokens.light
const dark = taskierTokens.dark

export const taskierTheme = extendTheme({
  fontFamily: {
    body: taskierTokens.font.ui,
    display: taskierTokens.font.ui,
    code: taskierTokens.font.data,
    fallback: 'system-ui, sans-serif',
  },
  radius: { xs: '6px', sm: '10px', md: '12px', lg: '18px', xl: '24px' },
  shadow: {
    xs: '0 1px 2px rgba(11, 18, 32, 0.06)',
    sm: '0 2px 8px rgba(11, 18, 32, 0.08)',
    md: '0 8px 24px rgba(11, 18, 32, 0.10)',
    lg: '0 16px 40px rgba(11, 18, 32, 0.14)',
    xl: '0 24px 64px rgba(11, 18, 32, 0.18)',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          ...violetLight,
          solidBg: light.primary,
          solidColor: light.primaryContrast,
          solidHoverBg: light.primaryHover,
        },
        neutral: neutralLight,
        info: {
          ...signalLight,
          solidBg: light.signal,
          solidHoverBg: light.signalHover,
        },
        success: statusPalette(
          taskierTokens.status.success,
          '#F0FDF4',
          '#166534',
        ),
        warning: statusPalette(
          taskierTokens.status.warning,
          '#FFFBEB',
          '#854D0E',
        ),
        danger: statusPalette(
          taskierTokens.status.danger,
          '#FEF2F2',
          '#991B1B',
        ),
        background: {
          body: light.page,
          surface: light.surface,
          popup: light.surface,
          level1: light.surfaceSubtle,
          level2: light.brandSoft,
          level3: '#DDD6FE',
          tooltip: light.strong,
          backdrop: 'rgba(11, 18, 32, 0.48)',
        },
        text: {
          primary: light.text,
          secondary: light.textMuted,
          tertiary: '#5F6B81',
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
        },
        neutral: neutralDark,
        info: {
          ...signalDark,
          solidBg: dark.signal,
          solidColor: dark.primaryContrast,
          solidHoverBg: dark.signalHover,
        },
        success: statusPalette(
          taskierTokens.status.success,
          '#052E16',
          '#86EFAC',
        ),
        warning: statusPalette(
          taskierTokens.status.warning,
          '#422006',
          '#FCD34D',
        ),
        danger: statusPalette(
          taskierTokens.status.danger,
          '#450A0A',
          '#FCA5A5',
        ),
        background: {
          body: dark.page,
          surface: dark.surface,
          popup: dark.surfaceRaised,
          level1: dark.surfaceRaised,
          level2: dark.brandSoft,
          level3: '#312E81',
          tooltip: dark.surfaceRaised,
          backdrop: 'rgba(0, 0, 0, 0.64)',
        },
        text: {
          primary: dark.text,
          secondary: dark.textMuted,
          tertiary: '#94A3B8',
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
                : '40px',
          borderRadius: 'var(--Button-radius, 10px)',
          fontWeight: 600,
          transition:
            'background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }),
      },
    },
    JoyIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--IconButton-radius, 10px)',
          transition:
            'background-color 180ms ease, border-color 180ms ease, color 180ms ease',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        },
      },
    },
    JoyCard: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--Card-radius, 18px)',
          borderColor: 'var(--joy-palette-divider)',
        },
      },
    },
    JoyModalDialog: {
      styleOverrides: {
        root: {
          borderRadius: '18px',
          borderColor: 'var(--joy-palette-divider)',
        },
      },
    },
    JoyInput: { styleOverrides: { root: { borderRadius: '10px' } } },
    JoyTextarea: { styleOverrides: { root: { borderRadius: '10px' } } },
    JoySelect: { styleOverrides: { root: { borderRadius: '10px' } } },
    JoyLink: {
      styleOverrides: {
        root: {
          color: 'var(--taskier-signal)',
          textUnderlineOffset: '0.18em',
          '&:hover': { textDecoration: 'underline' },
        },
      },
    },
  },
})

export const taskierGlobalStyles = {
  ':root': taskierCssVariables('light'),
  '[data-joy-color-scheme="dark"]': taskierCssVariables('dark'),
  '@media (prefers-contrast: more)': {
    ':root': {
      '--taskier-text-muted': '#0B1220',
      '--taskier-boundary': '#5F6B81',
      '--joy-palette-text-secondary': '#0B1220',
      '--joy-palette-divider': '#5F6B81',
    },
    '[data-joy-color-scheme="dark"]': {
      '--taskier-text-muted': '#F8FAFC',
      '--taskier-boundary': '#94A3B8',
      '--joy-palette-text-secondary': '#F8FAFC',
      '--joy-palette-divider': '#94A3B8',
    },
  },
}

export default taskierTheme

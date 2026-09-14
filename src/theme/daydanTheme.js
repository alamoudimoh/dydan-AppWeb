import { extendTheme } from '@mui/joy/styles'

import { neutralPaletteFor } from './neutralPalette'
import {
  productCssVariables,
  productTokens,
  resolveProductBrand,
} from './tokens'
import { productTypeScale } from './typography'

const neutralPalettes = {
  daydan: {
    light: {
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
    },
    dark: {
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
    },
  },
  sovereign: {
    light: {
      50: '#F2F2F2',
      100: '#E6E6E6',
      200: '#999999',
      300: '#666666',
      400: '#4D4D4D',
      500: '#4D4D4D',
      600: '#2E2E2E',
      700: '#1A1A1A',
      800: '#1A1A1A',
      900: '#1A1A1A',
    },
    dark: {
      50: '#F2F2F2',
      100: '#999999',
      200: '#999999',
      300: '#999999',
      400: '#999999',
      500: '#2E2E2E',
      600: '#242424',
      700: '#1A1A1A',
      800: '#1A1A1A',
      900: '#1A1A1A',
    },
  },
}

const primaryPalettes = {
  daydan: {
    light: {
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
    },
    dark: {
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
    },
  },
  sovereign: {
    light: {
      50: '#F2F2F2',
      100: '#E6E6E6',
      200: '#FFC107',
      300: '#FFC107',
      400: '#FFC107',
      500: '#FFC107',
      600: '#FFC107',
      700: '#6B5200',
      800: '#1A1A1A',
      900: '#1A1A1A',
    },
    dark: {
      50: '#2E2E2E',
      100: '#2E2E2E',
      200: '#FFC107',
      300: '#FFC107',
      400: '#FFC107',
      500: '#FFC107',
      600: '#FFD04D',
      700: '#FFD04D',
      800: '#F2F2F2',
      900: '#F2F2F2',
    },
  },
}

const signalPalettes = {
  daydan: {
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
  },
  sovereign: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#B45309',
    700: '#92400E',
    800: '#78350F',
    900: '#431407',
  },
}

const statusPalette = (softBg, softColor, solidBg, solidColor = '#FFFFFF') => ({
  50: softBg,
  100: softBg,
  200: solidBg,
  300: solidBg,
  400: solidBg,
  500: softColor,
  600: softColor,
  700: softColor,
  800: softColor,
  900: softColor,
  softBg,
  softColor,
  solidBg,
  solidColor,
})

const statusForScheme = scheme =>
  scheme === 'light'
    ? {
        success: statusPalette('#F0FDF4', '#166534', '#16A34A'),
        warning: statusPalette('#FFFBEB', '#854D0E', '#D97706'),
        danger: statusPalette('#FEF2F2', '#991B1B', '#DC2626'),
      }
    : {
        success: statusPalette('#052E16', '#86EFAC', '#86EFAC', '#052E16'),
        warning: statusPalette('#422006', '#FCD34D', '#FCD34D', '#422006'),
        danger: statusPalette('#450A0A', '#FCA5A5', '#FCA5A5', '#450A0A'),
      }

const typography = {
  h1: { ...productTypeScale.pageTitle, letterSpacing: '-0.005em' },
  h2: productTypeScale.sectionTitle,
  'title-lg': productTypeScale.sectionTitle,
  'title-md': productTypeScale.cardTitle,
  'title-sm': productTypeScale.rowTitle,
  'body-md': productTypeScale.body,
  'body-sm': productTypeScale.bodySmall,
  'body-xs': productTypeScale.label,
}

const colorScheme = (brandId, scheme) => {
  const colors = productTokens[brandId][scheme]
  const statuses = statusForScheme(scheme)
  const signal = { ...signalPalettes[brandId] }
  if (scheme === 'dark') {
    signal[500] = colors.signal
    signal[600] = colors.signal
    signal[700] = colors.signalHover
  }
  return {
    palette: {
      primary: {
        ...primaryPalettes[brandId][scheme],
        solidBg: colors.primary,
        solidColor: colors.primaryContrast,
        solidHoverBg: colors.primaryHover,
        softBg: colors.brandSoft,
        softColor: colors.goldText || colors.primary,
        outlinedBorder: colors.boundary,
      },
      neutral: neutralPaletteFor(
        brandId,
        scheme,
        neutralPalettes[brandId][scheme],
        colors.textMuted,
      ),
      info: {
        ...signal,
        solidBg: colors.signal,
        solidHoverBg: colors.signalHover,
      },
      ...statuses,
      background: {
        body: colors.page,
        surface: colors.surface,
        popup: colors.surfaceRaised || colors.surface,
        level1: colors.surfaceSubtle || colors.surfaceRaised,
        level2: colors.brandSoft,
        level3: neutralPalettes[brandId][scheme][200],
        tooltip: colors.strong,
        backdrop: colors.backdrop,
      },
      text: {
        primary: colors.text,
        secondary: colors.textMuted,
        tertiary:
          neutralPalettes[brandId][scheme][scheme === 'dark' ? 100 : 400],
        icon: colors.textMuted,
      },
      divider: colors.boundary,
    },
  }
}

export const createProductTheme = brand => {
  const brandId = resolveProductBrand(brand)
  const tokens = productTokens[brandId]
  const { radius } = tokens
  const sovereign = brandId === 'sovereign'
  return extendTheme({
    breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
    fontFamily: {
      body: tokens.font.ui,
      display: tokens.font.ui,
      code: tokens.font.data,
      fallback: 'system-ui, sans-serif',
    },
    radius: {
      xs: radius.control,
      sm: radius.nav,
      md: radius.control,
      lg: radius.card,
      xl: radius.shell,
    },
    shadow: sovereign
      ? {
          xs: '0 1px 2px rgba(8, 22, 18, 0.06)',
          sm: '0 3px 10px rgba(8, 22, 18, 0.07)',
          md: '0 10px 26px rgba(8, 22, 18, 0.09)',
          lg: '0 18px 42px rgba(8, 22, 18, 0.12)',
          xl: '0 28px 68px rgba(8, 22, 18, 0.15)',
        }
      : {
          xs: '0 1px 2px rgba(26, 31, 38, 0.05)',
          sm: '0 2px 8px rgba(26, 31, 38, 0.06)',
          md: '0 8px 24px rgba(26, 31, 38, 0.08)',
          lg: '0 16px 40px rgba(26, 31, 38, 0.10)',
          xl: '0 24px 64px rgba(26, 31, 38, 0.12)',
        },
    typography,
    colorSchemes: {
      light: colorScheme(brandId, 'light'),
      dark: colorScheme(brandId, 'dark'),
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
            ...productTypeScale.button,
            transition:
              'background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }),
        },
      },
      JoyIconButton: {
        styleOverrides: {
          root: {
            minWidth: '36px',
            minHeight: '36px',
            borderRadius: radius.control,
            transition:
              'background-color 180ms ease, border-color 180ms ease, color 180ms ease',
            '@media (max-width: 599.95px)': {
              minWidth: '44px',
              minHeight: '44px',
            },
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
            borderRadius: radius.control,
            ...(ownerState.variant === 'soft' &&
              ownerState.color === 'primary' && {
                bgcolor: 'var(--product-brand-soft)',
                color: 'var(--product-gold-text)',
                fontWeight: 600,
                fontSize: productTypeScale.bodySmall.fontSize,
                px: 1.25,
                py: 0.75,
              }),
          }),
        },
      },
      JoyListItemButton: {
        styleOverrides: { root: { borderRadius: radius.nav } },
      },
      JoyLink: {
        styleOverrides: {
          root: {
            color: 'var(--product-brand)',
            textUnderlineOffset: '0.18em',
            '&:hover': { textDecoration: 'underline' },
          },
        },
      },
    },
  })
}

export const getProductGlobalStyles = brand => {
  const brandId = resolveProductBrand(brand)
  return {
    ':root': productCssVariables(brandId, 'light'),
    '[data-joy-color-scheme="dark"]': productCssVariables(brandId, 'dark'),
    '@media (prefers-contrast: more)': {
      ':root': {
        '--product-text-muted': productTokens[brandId].light.text,
        '--product-boundary': productTokens[brandId].light.textMuted,
        '--joy-palette-text-secondary': productTokens[brandId].light.text,
        '--joy-palette-divider': productTokens[brandId].light.textMuted,
      },
      '[data-joy-color-scheme="dark"]': {
        '--product-text-muted': productTokens[brandId].dark.text,
        '--product-boundary': productTokens[brandId].dark.textMuted,
        '--joy-palette-text-secondary': productTokens[brandId].dark.text,
        '--joy-palette-divider': productTokens[brandId].dark.textMuted,
      },
    },
  }
}

export const daydanTheme = createProductTheme('daydan')
export const sovereignTheme = createProductTheme('sovereign')
export const daydanGlobalStyles = getProductGlobalStyles('daydan')

export default daydanTheme

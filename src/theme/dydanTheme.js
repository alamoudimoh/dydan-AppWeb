import { extendTheme } from '@mui/joy/styles'

import { neutralPaletteFor } from './neutralPalette'
import {
  productCssVariables,
  productTokens,
  resolveProductBrand,
} from './tokens'
import { productTypeScale } from './typography'

const neutralPalettes = {
  dydan: {
    light: {
      50: '#FFFFFF',
      100: '#FFF8E8',
      200: '#EEEAF2',
      300: '#D9D1EB',
      400: '#746F7A',
      500: '#746F7A',
      600: '#2B2831',
      700: '#34236D',
      800: '#25174F',
      900: '#160D32',
    },
    dark: {
      50: '#FFF8E8',
      100: '#D9D1EB',
      200: '#C9BDEA',
      300: '#8A79BF',
      400: '#7769B6',
      500: '#34236D',
      600: '#25174F',
      700: '#25174F',
      800: '#160D32',
      900: '#160D32',
    },
  },
  sovereign: {
    light: {
      50: '#FFFFFF',
      100: '#F6F2E8',
      200: '#EBE7DE',
      300: '#D8C9A8',
      400: '#756F68',
      500: '#756F68',
      600: '#292724',
      700: '#071A2C',
      800: '#142D40',
      900: '#04111D',
    },
    dark: {
      50: '#F6F2E8',
      100: '#D8C9A8',
      200: '#AEC1CF',
      300: '#829FB4',
      400: '#4D7794',
      500: '#071A2C',
      600: '#142D40',
      700: '#142D40',
      800: '#04111D',
      900: '#04111D',
    },
  },
}

const primaryPalettes = {
  dydan: {
    light: {
      50: '#C9BDEA',
      100: '#C9BDEA',
      200: '#8A79BF',
      300: '#8A79BF',
      400: '#7769B6',
      500: '#34236D',
      600: '#34236D',
      700: '#25174F',
      800: '#25174F',
      900: '#160D32',
    },
    dark: {
      50: '#25174F',
      100: '#34236D',
      200: '#7769B6',
      300: '#8A79BF',
      400: '#C9BDEA',
      500: '#FFCC5C',
      600: '#FFDD8A',
      700: '#FFF3D1',
      800: '#FFF8E8',
      900: '#FFF8E8',
    },
  },
  sovereign: {
    light: {
      50: '#AEC1CF',
      100: '#AEC1CF',
      200: '#829FB4',
      300: '#829FB4',
      400: '#4D7794',
      500: '#071A2C',
      600: '#071A2C',
      700: '#142D40',
      800: '#142D40',
      900: '#04111D',
    },
    dark: {
      50: '#142D40',
      100: '#071A2C',
      200: '#4D7794',
      300: '#829FB4',
      400: '#AEC1CF',
      500: '#E0B45A',
      600: '#E8C97D',
      700: '#F7EDCF',
      800: '#F6F2E8',
      900: '#F6F2E8',
    },
  },
}

const signalPalettes = {
  dydan: {
    50: '#FFF8E8',
    100: '#FFF3D1',
    200: '#D9D1EB',
    300: '#7769B6',
    400: '#2F5F8A',
    500: '#174E78',
    600: '#174E78',
    700: '#2F5F8A',
    800: '#25174F',
    900: '#160D32',
  },
  sovereign: {
    50: '#F6F2E8',
    100: '#F7EDCF',
    200: '#D8C9A8',
    300: '#4D7794',
    400: '#2C6373',
    500: '#164D68',
    600: '#164D68',
    700: '#2C6373',
    800: '#142D40',
    900: '#04111D',
  },
}

const statusPalette = (background, color, border) => ({
  50: background,
  100: background,
  200: background,
  300: background,
  400: background,
  500: color,
  600: color,
  700: color,
  800: color,
  900: color,
  softBg: background,
  softColor: color,
  solidBg: background,
  solidColor: color,
  outlinedBorder: border,
  outlinedColor: color,
})

const statusForScheme = (brandId, scheme) => {
  const theme = productTokens[brandId]
  const statusText = brandId === 'dydan' ? '#FFF8E8' : '#F6F2E8'
  const border = theme[scheme].brand
  return {
    success: statusPalette(theme.status.success, statusText, border),
    warning: statusPalette(theme.status.warning, statusText, border),
    danger: statusPalette(theme.status.danger, statusText, border),
  }
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
  const statuses = statusForScheme(brandId, scheme)
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
        softColor: colors.primaryContrast,
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
        solidColor: brandId === 'dydan' ? '#FFF8E8' : '#F6F2E8',
        solidHoverBg: colors.signalHover,
        outlinedBorder: colors.brand,
        outlinedColor: brandId === 'dydan' ? '#FFF8E8' : '#F6F2E8',
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
          xs: '0 1px 2px rgba(7, 26, 44, 0.06)',
          sm: '0 3px 10px rgba(7, 26, 44, 0.07)',
          md: '0 10px 26px rgba(7, 26, 44, 0.09)',
          lg: '0 18px 42px rgba(7, 26, 44, 0.12)',
          xl: '0 28px 68px rgba(7, 26, 44, 0.15)',
        }
      : {
          xs: '0 1px 2px rgba(52, 35, 109, 0.05)',
          sm: '0 2px 8px rgba(52, 35, 109, 0.06)',
          md: '0 8px 24px rgba(52, 35, 109, 0.08)',
          lg: '0 16px 40px rgba(52, 35, 109, 0.10)',
          xl: '0 24px 64px rgba(52, 35, 109, 0.12)',
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

export const dydanTheme = createProductTheme('dydan')
export const sovereignTheme = createProductTheme('sovereign')
export const dydanGlobalStyles = getProductGlobalStyles('dydan')

export default dydanTheme

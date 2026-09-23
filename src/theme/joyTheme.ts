import { extendTheme } from '@mui/joy/styles'

/* ─────────────────────────────────────────────
   Joy UI theme bound to dydan design tokens.
   Every Joy component (Button, Card, Input, Modal,
   Checkbox, Switch, Select, Avatar) reads the same
   CSS variables that power the rest of the product,
   so switching dydan ⇄ Sovereign restyles Joy too.
───────────────────────────────────────────── */

const sharedPrimary = {
  solidBg: 'var(--brand)',
  solidHoverBg: 'var(--brand-hover)',
  solidActiveBg: 'var(--brand-hover)',
  solidColor: 'var(--brand-contrast)',
  solidDisabledBg: 'var(--surface-2)',
  plainColor: 'var(--brand)',
  plainHoverBg: 'var(--brand-faint)',
  outlinedColor: 'var(--brand)',
  outlinedBorder: 'var(--brand)',
  outlinedHoverBg: 'var(--brand-faint)',
  softBg: 'var(--brand-faint)',
  softColor: 'var(--brand)',
  softHoverBg: 'var(--surface-2)',
}

const sharedNeutral = {
  plainColor: 'var(--t-primary)',
  plainHoverBg: 'var(--surface-2)',
  outlinedBorder: 'var(--line)',
  outlinedColor: 'var(--t-primary)',
  outlinedHoverBg: 'var(--surface-2)',
  softBg: 'var(--surface-2)',
  softColor: 'var(--t-primary)',
}

const surfaces = {
  body: 'var(--page)',
  surface: 'var(--surface)',
  popup: 'var(--surface)',
  level1: 'var(--surface-2)',
  level2: 'var(--surface-3)',
}

const text = {
  primary: 'var(--t-primary)',
  secondary: 'var(--t-muted)',
  tertiary: 'var(--t-faint)',
  icon: 'var(--t-muted)',
}

export const joyTheme = extendTheme({
  fontFamily: {
    display: 'var(--font-ui)',
    body: 'var(--font-ui)',
    code: 'var(--font-ui)',
    fallback: 'system-ui, sans-serif',
  },
  radius: {
    xs: 'var(--r-xs)',
    sm: 'var(--r-sm)',
    md: 'var(--r-md)',
    lg: 'var(--r-lg)',
    xl: 'var(--r-xl)',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: sharedPrimary,
        neutral: sharedNeutral,
        background: surfaces,
        text,
        divider: 'var(--line)',
        focusVisible: 'var(--brand)',
      },
    },
    dark: {
      palette: {
        primary: sharedPrimary,
        neutral: sharedNeutral,
        background: surfaces,
        text,
        divider: 'var(--line)',
        focusVisible: 'var(--brand)',
      },
    },
  },
  components: {
    JoyCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-sm)',
        },
      },
    },
    JoyButton: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 'var(--r-md)' },
      },
    },
    JoyInput: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--r-md)',
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
          '--Input-focusedHighlight': 'var(--brand)',
        },
      },
    },
    JoyModalDialog: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
          borderRadius: 'var(--r-2xl)',
        },
      },
    },
  },
})

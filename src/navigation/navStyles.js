/** Minimum touch target per mobile accessibility guidance. */
export const NAV_ITEM_MIN_HEIGHT = 44

export const navSectionLabelSx = {
  px: 1.25,
  pt: 0.25,
  pb: 0.5,
  fontSize: '0.6875rem',
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'text.tertiary',
  opacity: 0.72,
  lineHeight: 1.3,
}

export const navSectionSpacingSx = index => ({
  mt: index === 0 ? 0 : 1.75,
})

export const navItemButtonSx = isActive => ({
  borderRadius: 'var(--joy-radius-md)',
  minHeight: NAV_ITEM_MIN_HEIGHT,
  py: 0.75,
  px: 1.25,
  gap: 1.25,
  transition:
    'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
  ...(isActive
    ? {
        bgcolor: 'var(--joy-palette-primary-softBg)',
        color: 'var(--joy-palette-primary-softColor)',
        fontWeight: 600,
        boxShadow: 'inset 0 0 0 1px var(--joy-palette-primary-outlinedBorder)',
        '& .MuiListItemDecorator-root': {
          color: 'var(--joy-palette-primary-500)',
        },
      }
    : {
        color: 'text.primary',
        '&:hover': {
          bgcolor: 'var(--joy-palette-neutral-softHoverBg)',
        },
      }),
  '&:focus-visible': {
    outline: '2px solid var(--joy-palette-primary-500)',
    outlineOffset: 2,
  },
  '& .MuiListItemDecorator-root': {
    minWidth: 28,
    color: isActive
      ? 'var(--joy-palette-primary-500)'
      : 'var(--joy-palette-neutral-500)',
  },
})

export const navDrawerContentSx = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxHeight: '100dvh',
  width: { xs: 'min(100vw - 24px, 320px)', sm: 288 },
  bgcolor: 'background.body',
}

export const navDrawerScrollSx = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  px: 1.25,
  py: 1,
  pt: {
    xs: 'calc(0.5rem + var(--safe-area-inset-top, 0px))',
    sm: 1,
  },
}

export const navDrawerFooterSx = {
  flexShrink: 0,
  borderTop: '1px solid',
  borderColor: 'divider',
  px: 1.25,
  py: 1,
  pb: 'calc(0.75rem + var(--safe-area-inset-bottom, 0px))',
  bgcolor: 'background.body',
}

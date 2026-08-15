/** Minimum touch target per mobile accessibility guidance. */
export const NAV_ITEM_MIN_HEIGHT = 44

export const NAV_DRAWER_WIDTH = 248

export const navBrandSx = {
  mb: 2,
  fontSize: '1.5625rem',
  fontWeight: 600,
  lineHeight: 1.45,
  color: 'primary.500',
  letterSpacing: '-0.01em',
}

export const navSectionLabelSx = {
  px: 1.25,
  pt: 0.25,
  pb: 0.5,
  fontSize: '0.625rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  lineHeight: 1.45,
}

export const navSectionSpacingSx = index => ({
  mt: index === 0 ? 0 : 2,
})

export const navItemButtonSx = isActive => ({
  borderRadius: 'var(--taskier-radius-nav)',
  minHeight: { xs: NAV_ITEM_MIN_HEIGHT, sm: 36 },
  py: 1,
  px: 1.25,
  gap: 1.25,
  fontSize: '0.8125rem',
  lineHeight: 1.45,
  fontWeight: isActive ? 500 : 400,
  transition:
    'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
  ...(isActive
    ? {
        '&, &.Mui-selected, &.Mui-selected:hover': {
          bgcolor: 'var(--taskier-brand-soft)',
          color: 'primary.500',
        },
        '& .MuiListItemDecorator-root': {
          color: 'primary.500',
        },
      }
    : {
        color: 'text.primary',
        '&:hover': {
          bgcolor: 'var(--joy-palette-neutral-50, var(--taskier-page))',
        },
      }),
  '&:focus-visible': {
    outline: '2px solid var(--taskier-focus-outer)',
    outlineOffset: 2,
  },
  '& .MuiListItemDecorator-root': {
    minWidth: 28,
    color: isActive ? 'primary.500' : 'text.secondary',
  },
})

export const navDrawerContentSx = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxHeight: '100dvh',
  width: { xs: 'min(100vw - 24px, 320px)', sm: NAV_DRAWER_WIDTH },
  bgcolor: 'background.surface',
  borderRight: '1px solid',
  borderColor: 'divider',
}

export const navDrawerScrollSx = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  px: 2.5,
  py: 2.5,
  pt: {
    xs: 'calc(1.25rem + var(--safe-area-inset-top, 0px))',
    sm: 2.5,
  },
}

export const navDrawerFooterSx = {
  flexShrink: 0,
  borderTop: '1px solid',
  borderColor: 'divider',
  px: 2.5,
  py: 1.25,
  pb: 'calc(0.75rem + var(--safe-area-inset-bottom, 0px))',
  bgcolor: 'background.surface',
}

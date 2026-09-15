/** Minimum touch target per mobile accessibility guidance. */
export const NAV_ITEM_MIN_HEIGHT = 44

export const NAV_DRAWER_WIDTH = 248

export const navBrandSx = {
  mb: 2,
  fontSize: '1.5625rem',
  fontFamily: 'var(--product-wordmark-font)',
  fontWeight: 700,
  lineHeight: 1.3,
  color: 'var(--product-brand)',
  letterSpacing: '-0.01em',
}

export const navSectionLabelSx = {
  px: 1.25,
  pt: 0.25,
  pb: 0.5,
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  lineHeight: 1.45,
}

export const navSectionSpacingSx = index => ({
  mt: index === 0 ? 0 : 2,
})

export const navItemButtonSx = isActive => ({
  borderRadius: 'var(--dydan-radius-nav)',
  minHeight: { xs: NAV_ITEM_MIN_HEIGHT, sm: 36 },
  py: 1,
  px: 1.25,
  gap: 1.25,
  fontSize: '0.875rem',
  lineHeight: 1.45,
  fontWeight: isActive ? 700 : 500,
  transition:
    'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
  ...(isActive
    ? {
        '&, &.Mui-selected, &.Mui-selected:hover': {
          bgcolor: 'var(--dydan-brand-soft)',
          color: 'var(--product-brand)',
        },
        '& .MuiListItemDecorator-root': {
          color: 'var(--product-brand)',
        },
      }
    : {
        color: 'text.primary',
        '&:hover': {
          bgcolor: 'var(--joy-palette-neutral-50, var(--dydan-page))',
        },
      }),
  '&:focus-visible': {
    outline: '2px solid var(--dydan-focus-outer)',
    outlineOffset: 2,
  },
  '& .MuiListItemDecorator-root': {
    minWidth: 28,
    color: isActive ? 'var(--product-brand)' : 'text.secondary',
  },
})

export const navDrawerContentSx = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxHeight: '100dvh',
  width: { xs: 'min(100vw - 24px, 320px)', sm: NAV_DRAWER_WIDTH },
  bgcolor: 'background.surface',
  borderInlineEnd: '1px solid',
  borderColor: 'divider',
}

export const navSidebarSx = {
  ...navDrawerContentSx,
  display: { xs: 'none', md: 'flex' },
  position: 'fixed',
  insetBlock: 0,
  insetInlineStart: 0,
  width: NAV_DRAWER_WIDTH,
  zIndex: 1200,
}

export const navHeaderSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  minHeight: 64,
  px: { xs: 1.5, sm: 2, md: 3 },
  pt: {
    xs: 'var(--safe-area-inset-top, 0px)',
    md: 0,
  },
  position: 'sticky',
  insetBlockStart: 0,
  marginInlineStart: { xs: 0, md: `${NAV_DRAWER_WIDTH}px` },
  zIndex: 1100,
  bgcolor: 'background.body',
  borderBlockEnd: '1px solid',
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

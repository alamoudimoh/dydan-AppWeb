/** Shared page rhythm for list/detail screens (DayDan Figma system). */

export const APP_PAGE_MAX_WIDTH = Object.freeze({
  wide: 1128,
  narrow: 760,
})

/** 24px section gap on desktop (Figma main column rhythm). */
export const pageStackSpacing = 3

export const settingsPageSx = {
  py: { xs: 2, sm: 4 },
}

export const pageShellSx = {
  maxWidth: APP_PAGE_MAX_WIDTH.wide,
  mx: 'auto',
  px: { xs: 1.5, sm: 4 },
  py: { xs: 2, sm: 4 },
}

export const narrowPageShellSx = {
  maxWidth: APP_PAGE_MAX_WIDTH.narrow,
  mx: 'auto',
  px: { xs: 1.5, sm: 4 },
  py: { xs: 2, sm: 4 },
}

/** List screens with edge-to-edge rows inside a padded page shell. */
export const listPageContainerSx = {
  ...settingsPageSx,
  px: 0,
  pb: 10,
}

export const detailPageContainerSx = {
  ...settingsPageSx,
  px: { xs: 1.5, sm: 4 },
}

export const widePageContainerSx = {
  ...settingsPageSx,
  pb: 10,
}

export const listPageHeaderSx = {
  px: 2,
}

export const pageHeaderTitleSx = {
  fontWeight: 600,
  fontSize: '1.75rem',
  lineHeight: 1.45,
  letterSpacing: '-0.01em',
  color: 'text.primary',
}

export const pageHeaderSubtitleSx = {
  color: 'text.secondary',
  fontSize: '0.875rem',
  lineHeight: 1.45,
  mt: 0.375,
}

export const sectionCardSx = {
  p: { xs: 2.25, sm: 2.25 },
  gap: 1.5,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 'var(--taskier-radius-card)',
}

export const sectionCardHeaderSx = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 1.5,
  mb: 0.5,
}

export const nestedRowSx = {
  p: 1.75,
  borderRadius: 'var(--taskier-radius-row)',
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.surface',
}

export const formStackSpacing = 2

export const formStackSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: formStackSpacing,
}

export const formActionsSx = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1,
  alignItems: 'center',
}

export const inlineLoadingSx = {
  display: 'grid',
  placeItems: 'center',
  py: { xs: 6, sm: 8 },
  minHeight: 120,
}

export const inlineErrorAlertSx = {
  alignItems: 'center',
}

export const settingsFormCardSx = {
  ...sectionCardSx,
  maxWidth: 480,
}

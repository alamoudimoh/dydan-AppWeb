/** Shared page rhythm for list/detail screens (Polish Batch 3). */

export const APP_PAGE_MAX_WIDTH = Object.freeze({
  wide: 1100,
  narrow: 760,
})

export const pageStackSpacing = 2

export const settingsPageSx = {
  py: { xs: 2, sm: 3 },
}

export const pageShellSx = {
  maxWidth: APP_PAGE_MAX_WIDTH.wide,
  mx: 'auto',
  px: { xs: 1.5, sm: 3 },
  py: { xs: 2, sm: 3 },
}

export const narrowPageShellSx = {
  maxWidth: APP_PAGE_MAX_WIDTH.narrow,
  mx: 'auto',
  px: { xs: 1.5, sm: 3 },
  py: { xs: 2, sm: 3 },
}

/** List screens with edge-to-edge rows inside a padded page shell. */
export const listPageContainerSx = {
  ...settingsPageSx,
  px: 0,
  pb: 10,
}

export const detailPageContainerSx = {
  ...settingsPageSx,
  px: { xs: 1.5, sm: 3 },
}

export const widePageContainerSx = {
  ...settingsPageSx,
  pb: 10,
}

export const listPageHeaderSx = {
  px: 2,
}

export const pageHeaderTitleSx = {
  fontWeight: 'lg',
  color: 'text.primary',
}

export const pageHeaderSubtitleSx = {
  color: 'text.secondary',
}

export const sectionCardSx = {
  p: { xs: 1.5, sm: 2 },
  gap: 1.5,
  display: 'flex',
  flexDirection: 'column',
}

export const sectionCardHeaderSx = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 1.5,
  mb: 0.5,
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

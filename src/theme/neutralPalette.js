/**
 * Neutral palette assembly shared by the product theme factory.
 *
 * Joy renders plain/outlined neutral variants with `palette-300` in dark mode,
 * which sits near the page background and makes `color='neutral'` chrome
 * unreadable. In dark schemes we pin those variants to the designed
 * muted-text token instead. Pure data so it stays unit-testable in Node.
 */
export const neutralPaletteFor = (
  brandId,
  scheme,
  neutralPalette,
  textMuted,
) => ({
  ...neutralPalette,
  ...(scheme === 'dark' && {
    plainColor: textMuted,
    outlinedColor: textMuted,
    softColor: neutralPalette[100],
    softHoverBg: neutralPalette[700],
  }),
})

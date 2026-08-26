import { productTypeScale } from '../../theme/typography.js'

// Shared shape for the auth screens so all four stay in one control vocabulary.
// Values are taken from the product theme tokens to avoid arbitrary sizes.
export const authInputSx = {
  '--Input-radius': 'var(--product-radius-row)',
  '--Input-focusedThickness': '2px',
  fontSize: productTypeScale.body.fontSize,
}

export const authButtonSx = {
  '--Button-radius': 'var(--product-radius-control)',
  fontWeight: 600,
}

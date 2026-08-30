import { productTypeScale } from '../../theme/typography.js'

// Onboarding and invitation flows remain unrepresented in Figma and retain
// their existing product styling until an owner-provided design is available.
export const authInputSx = {
  '--Input-radius': 'var(--product-radius-row)',
  '--Input-focusedThickness': '2px',
  fontSize: productTypeScale.body.fontSize,
}

export const authButtonSx = {
  '--Button-radius': 'var(--product-radius-control)',
  fontWeight: 600,
}

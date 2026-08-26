import { CssBaseline, GlobalStyles } from '@mui/joy'
import { CssVarsProvider } from '@mui/joy/styles'
import PropType from 'prop-types'

import { APP_BRAND_ID } from '@/config/AppBranding'
import { createProductTheme, getProductGlobalStyles } from '@/theme/daydanTheme'

const productTheme = createProductTheme(APP_BRAND_ID)
const productGlobalStyles = getProductGlobalStyles(APP_BRAND_ID)

const ThemeContext = ({ children }) => (
  <CssVarsProvider theme={productTheme} defaultMode='system'>
    <CssBaseline />
    <GlobalStyles styles={productGlobalStyles} />
    {children}
  </CssVarsProvider>
)

ThemeContext.propTypes = {
  children: PropType.node,
}

export default ThemeContext

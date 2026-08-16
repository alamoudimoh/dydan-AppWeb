import { CssBaseline, GlobalStyles } from '@mui/joy'
import { CssVarsProvider } from '@mui/joy/styles'
import PropType from 'prop-types'

import daydanTheme, { daydanGlobalStyles } from '@/theme/daydanTheme'

const ThemeContext = ({ children }) => (
  <CssVarsProvider theme={daydanTheme} defaultMode='system'>
    <CssBaseline />
    <GlobalStyles styles={daydanGlobalStyles} />
    {children}
  </CssVarsProvider>
)

ThemeContext.propTypes = {
  children: PropType.node,
}

export default ThemeContext

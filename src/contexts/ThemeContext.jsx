import { CssBaseline, GlobalStyles } from '@mui/joy'
import { CssVarsProvider } from '@mui/joy/styles'
import PropType from 'prop-types'

import taskierTheme, { taskierGlobalStyles } from '@/theme/taskierTheme'

const ThemeContext = ({ children }) => (
  <CssVarsProvider theme={taskierTheme} defaultMode='system'>
    <CssBaseline />
    <GlobalStyles styles={taskierGlobalStyles} />
    {children}
  </CssVarsProvider>
)

ThemeContext.propTypes = {
  children: PropType.node,
}

export default ThemeContext

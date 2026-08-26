import { Box, Stack } from '@mui/joy'
import PropTypes from 'prop-types'

import PageHeader from '../../components/common/PageHeader'
import { pageShellSx, pageStackSpacing } from '../../theme/appLayout'

const SettingsLayout = ({ children, title }) => (
  <Box sx={pageShellSx}>
    <PageHeader title={title} titleLevel='h2' sx={{ mb: 3 }} />
    <Stack spacing={pageStackSpacing}>{children}</Stack>
  </Box>
)

SettingsLayout.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node.isRequired,
}

export default SettingsLayout

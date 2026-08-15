import { Container, Stack } from '@mui/joy'

import PageHeader from '../../components/common/PageHeader'
import { pageStackSpacing, settingsPageSx } from '../../theme/appLayout'

const SettingsLayout = ({ title, children }) => (
  <Container maxWidth='lg' sx={settingsPageSx}>
    <PageHeader title={title} titleLevel='h2' sx={{ mb: 3 }} />
    <Stack spacing={pageStackSpacing}>{children}</Stack>
  </Container>
)

export default SettingsLayout

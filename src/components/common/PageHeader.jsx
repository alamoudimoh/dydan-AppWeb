import { Box, Stack, Typography } from '@mui/joy'
import PropTypes from 'prop-types'

import {
  pageHeaderSubtitleSx,
  pageHeaderTitleSx,
} from '../../theme/appLayout'

const PageHeader = ({
  action,
  icon,
  subtitle,
  title,
  titleLevel = 'h2',
  sx,
}) => (
  <Stack
    direction='row'
    spacing={1.5}
    alignItems='flex-start'
    justifyContent='space-between'
    sx={{ gap: 2, mb: 3, ...sx }}
  >
    <Stack direction='row' spacing={1.5} alignItems='flex-start' sx={{ minWidth: 0 }}>
      {icon && (
        <Box sx={{ color: 'text.secondary', display: 'flex', mt: 0.25 }}>
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography level={titleLevel} sx={pageHeaderTitleSx}>
          {title}
        </Typography>
        {subtitle && (
          <Typography level='body-sm' sx={pageHeaderSubtitleSx}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
    {action}
  </Stack>
)

PageHeader.propTypes = {
  action: PropTypes.node,
  icon: PropTypes.node,
  subtitle: PropTypes.node,
  title: PropTypes.node.isRequired,
  titleLevel: PropTypes.string,
  sx: PropTypes.object,
}

export default PageHeader

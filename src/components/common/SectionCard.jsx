import { Box, Card, Typography } from '@mui/joy'
import PropTypes from 'prop-types'

import {
  sectionCardHeaderSx,
  sectionCardSx,
} from '../../theme/appLayout'

const SectionCard = ({
  action,
  children,
  sx,
  title,
  titleLevel = 'title-lg',
  variant = 'outlined',
}) => (
  <Card variant={variant} sx={{ ...sectionCardSx, ...sx }}>
    {title && (
      <Box sx={sectionCardHeaderSx}>
        <Typography level={titleLevel}>{title}</Typography>
        {action}
      </Box>
    )}
    {children}
  </Card>
)

SectionCard.propTypes = {
  action: PropTypes.node,
  children: PropTypes.node,
  sx: PropTypes.object,
  title: PropTypes.node,
  titleLevel: PropTypes.string,
  variant: PropTypes.string,
}

export default SectionCard

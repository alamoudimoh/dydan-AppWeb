import { Box, CircularProgress, Typography } from '@mui/joy'
import PropTypes from 'prop-types'

import { inlineLoadingSx } from '../../theme/appLayout'

const QueryLoadingView = ({ label, size = 'md', sx }) => (
  <Box
    sx={{
      ...inlineLoadingSx,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      ...sx,
    }}
  >
    <CircularProgress size={size} aria-label={label || undefined} />
    {label && (
      <Typography level='body-sm' sx={{ mt: 1.5, color: 'text.secondary' }}>
        {label}
      </Typography>
    )}
  </Box>
)

QueryLoadingView.propTypes = {
  label: PropTypes.string,
  size: PropTypes.string,
  sx: PropTypes.object,
}

export default QueryLoadingView

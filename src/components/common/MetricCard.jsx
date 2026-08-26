import { Box, Card, Typography } from '@mui/joy'
import PropTypes from 'prop-types'

const MetricCard = ({ icon, label, value }) => (
  <Card
    variant='outlined'
    sx={{
      p: 2,
      minWidth: 0,
      gap: 1,
      bgcolor: 'background.surface',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: 'text.secondary',
      }}
    >
      {icon}
      <Typography level='body-sm'>{label}</Typography>
    </Box>
    <Typography
      level='h2'
      className='daydan-metric'
      sx={{ color: 'text.primary' }}
    >
      {value}
    </Typography>
  </Card>
)

MetricCard.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
}

export default MetricCard

import { Box, CircularProgress, Typography } from '@mui/joy'
import { styled } from '@mui/joy/styles'
import { useTranslation } from 'react-i18next'

// Styled components with keyframe animations
const LoadingContainer = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'var(--joy-palette-background-body)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  animation: 'fadeIn 0.3s ease-out',
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
    },
    to: {
      opacity: 1,
    },
  },
})

const LoadingContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
  animation: 'slideUp 0.5s ease-out 0.2s both',
  '@keyframes slideUp': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
})

const PulsingText = styled(Typography)({
  animation: 'pulse 2s ease-in-out infinite',
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
  },
})

const LogoContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '24px',
})

const LoadingScreen = ({
  message,
  showLogo = true,
  size = 'lg',
}) => {
  const { t } = useTranslation('common')
  const loadingMessage = message ?? t('loading')

  return (
    <LoadingContainer>
      <LoadingContent>
        {showLogo && (
          <LogoContainer>
            <Typography
              level='h1'
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem' },
                fontWeight: 700,
                color: 'primary.500',
                mb: 1,
              }}
            >
              Task
              <Box component='span' sx={{ color: 'var(--daydan-signal)' }}>
                i
              </Box>
              er
            </Typography>
          </LogoContainer>
        )}

        <CircularProgress
          size={size}
          sx={{
            '--CircularProgress-size': size === 'lg' ? '60px' : '40px',
            mb: 2,
          }}
        />

        <PulsingText level='body-md'>{loadingMessage}</PulsingText>
      </LoadingContent>
    </LoadingContainer>
  )
}

export default LoadingScreen

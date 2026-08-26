import { DnsOutlined } from '@mui/icons-material'
import { Box, Button, Link, Typography } from '@mui/joy'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import Logo from '../../Logo'
import { useResource } from '../../queries/ResourceQueries'
import { productTypeScale } from '../../theme/typography'
import { haptic, isNativeApp, markOnboardingSeen } from '../../utils/Onboarding'
import { LegalLinks } from '../Authorization/AuthFields'
import { authButtonSx } from '../Authorization/authStyles'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const enter = (delay = 0) => ({
  animation: `getStartedIn 520ms ${EASE} ${delay}ms both`,
  '@keyframes getStartedIn': {
    from: { opacity: 0, transform: 'translateY(12px)' },
    to: { opacity: 1, transform: 'none' },
  },
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
})

const GetStartedView = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const { data: resource } = useResource()
  const signupDisabled = Boolean(resource?.is_user_creation_disabled)

  const go = path => {
    markOnboardingSeen()
    haptic()
    navigate(path)
  }

  return (
    <Box
      component='main'
      sx={{
        minHeight: 'calc(100dvh - var(--safe-area-inset-top, 0px))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 3,
        pb: 3,
        bgcolor: 'background.body',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          my: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 1.5,
            mb: 4,
            ...enter(0),
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              '&::before': {
                content: '""',
                position: 'absolute',
                width: 190,
                height: 190,
                borderRadius: '50%',
                bgcolor: 'primary.softBg',
                opacity: 0.6,
                filter: 'blur(30px)',
              },
              '& > *': { position: 'relative' },
            }}
          >
            <Logo size='96px' />
          </Box>
          <Typography
            level='h1'
            sx={{
              ...productTypeScale.display,
              textWrap: 'balance',
            }}
          >
            Done
            <Box component='span' sx={{ color: 'primary.500' }}>
              tick
            </Box>
          </Typography>
          <Typography
            level='body-md'
            sx={{
              color: 'text.secondary',
              maxWidth: '30ch',
              textWrap: 'pretty',
            }}
          >
            {signupDisabled
              ? t('onboarding.getStarted.signInSubtitle')
              : t('onboarding.getStarted.subtitle')}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            ...enter(90),
          }}
        >
          {!signupDisabled && (
            <Button
              size='lg'
              fullWidth
              onClick={() => go('/signup')}
              sx={authButtonSx}
            >
              {t('auth.createAccount')}
            </Button>
          )}
          <Button
            size='lg'
            fullWidth
            variant={signupDisabled ? 'solid' : 'outlined'}
            color={signupDisabled ? 'primary' : 'neutral'}
            onClick={() => go('/login')}
            sx={authButtonSx}
          >
            {signupDisabled ? t('auth.signIn') : t('auth.alreadyHaveAccount')}
          </Button>
        </Box>

        {isNativeApp() && (
          <Box sx={{ mt: 2.5, textAlign: 'center', ...enter(160) }}>
            <Link
              component='button'
              type='button'
              level='body-sm'
              color='neutral'
              underline='hover'
              startDecorator={<DnsOutlined fontSize='small' />}
              onClick={() => navigate('/login/settings')}
            >
              {t('auth.connectSelfHosted')}
            </Link>
          </Box>
        )}
      </Box>

      <Box sx={{ width: '100%', maxWidth: 420, ...enter(220) }}>
        <LegalLinks />
      </Box>
    </Box>
  )
}

export default GetStartedView

import { CheckRounded } from '@mui/icons-material'
import { Box, Button, Input, Link, Switch, Typography } from '@mui/joy'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { productTypeScale } from '../../theme/typography'
import { isOfficialDayDanInstance } from '../../utils/FeatureToggle'
import {
  haptic,
  recordAcquisitionSource,
  recordPrivacyPreferences,
} from '../../utils/Onboarding'
import { authButtonSx, authInputSx } from '../Authorization/authStyles'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const enter = (delay = 0) => ({
  animation: `heardAboutIn 520ms ${EASE} ${delay}ms both`,
  '@keyframes heardAboutIn': {
    from: { opacity: 0, transform: 'translateY(12px)' },
    to: { opacity: 1, transform: 'none' },
  },
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
})

const cardSx = {
  bgcolor: 'background.surface',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 'var(--daydan-radius-card)',
}

const Shell = ({ children }) => (
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
      {children}
    </Box>
  </Box>
)

Shell.propTypes = {
  children: PropTypes.node,
}

const AcquisitionSurvey = ({ onDone, t }) => {
  const SOURCES = [
    t('onboarding.heardAbout.sources.appStore'),
    t('onboarding.heardAbout.sources.reddit'),
    t('onboarding.heardAbout.sources.friend'),
    t('onboarding.heardAbout.sources.video'),
    t('onboarding.heardAbout.sources.search'),
    t('onboarding.heardAbout.sources.other'),
  ]

  const OTHER = t('onboarding.heardAbout.other')

  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState('')

  const select = source => {
    haptic()
    setSelected(current => (current === source ? null : source))
  }

  const finish = () => {
    const answer = selected === OTHER ? detail.trim() || null : selected
    if (answer) recordAcquisitionSource(answer)
    onDone()
  }

  return (
    <>
      <Box sx={{ textAlign: 'center', mb: 3, ...enter(0) }}>
        <Typography
          level='h1'
          sx={{
            ...productTypeScale.display,
            textWrap: 'balance',
          }}
        >
          {t('onboarding.heardAbout.title')}
        </Typography>
        <Typography
          level='body-md'
          sx={{ mt: 1, color: 'text.secondary', textWrap: 'pretty' }}
        >
          {t('onboarding.heardAbout.subtitle')}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          ...enter(60),
        }}
      >
        {SOURCES.map(source => {
          const active = selected === source
          return (
            <Button
              key={source}
              type='button'
              variant='outlined'
              color={active ? 'primary' : 'neutral'}
              onClick={() => select(source)}
              sx={{
                justifyContent: 'space-between',
                gap: 1,
                px: 2,
                py: 1.25,
                borderRadius: 'var(--product-radius-row)',
                bgcolor: active ? 'primary.softBg' : 'background.surface',
                fontWeight: 600,
                fontSize: productTypeScale.body.fontSize,
                textAlign: 'start',
                transition: `border-color 200ms ${EASE}, background-color 200ms ${EASE}`,
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.500',
                  outlineOffset: '2px',
                },
              }}
            >
              {source}
              <Box
                aria-hidden={active ? undefined : 'true'}
                sx={{
                  flex: '0 0 auto',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  border: '1.5px solid',
                  borderColor: active
                    ? 'primary.500'
                    : 'neutral.outlinedBorder',
                  bgcolor: active ? 'primary.500' : 'transparent',
                  color: 'common.white',
                  '& svg': { fontSize: '0.9rem' },
                }}
              >
                {active && <CheckRounded />}
              </Box>
            </Button>
          )
        })}

        {selected === OTHER && (
          <Box sx={{ mt: 0.5, ...enter(0) }}>
            <Input
              placeholder={t('onboarding.heardAbout.otherPlaceholder')}
              value={detail}
              onChange={e => setDetail(e.target.value)}
              size='lg'
              fullWidth
              autoFocus
              sx={authInputSx}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 3, ...enter(120) }}>
        <Button size='lg' fullWidth onClick={finish} sx={authButtonSx}>
          {t('onboarding.heardAbout.continue')}
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 1.5, ...enter(150) }}>
        <Link
          component='button'
          type='button'
          level='body-sm'
          color='neutral'
          underline='hover'
          onClick={finish}
        >
          {t('onboarding.heardAbout.skip')}
        </Link>
      </Box>
    </>
  )
}

AcquisitionSurvey.propTypes = {
  onDone: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
}

const PrivacyPreferences = ({ onDone, t }) => {
  const PRIVACY_TOGGLES = [
    {
      key: 'crashReports',
      label: t('onboarding.privacy.crashReports.label'),
      description: t('onboarding.privacy.crashReports.description'),
    },
    {
      key: 'analytics',
      label: t('onboarding.privacy.analytics.label'),
      description: t('onboarding.privacy.analytics.description'),
    },
  ]

  const [crashReports, setCrashReports] = useState(false)
  const [analytics, setAnalytics] = useState(false)

  const toggle = key => {
    haptic()
    if (key === 'crashReports') setCrashReports(value => !value)
    if (key === 'analytics') setAnalytics(value => !value)
  }

  const values = { crashReports, analytics }

  const finish = () => {
    recordPrivacyPreferences(values)
    onDone()
  }

  return (
    <>
      <Box sx={{ textAlign: 'center', mb: 3, ...enter(0) }}>
        <Typography
          level='h1'
          sx={{
            ...productTypeScale.display,
            textWrap: 'balance',
          }}
        >
          {t('onboarding.privacy.title')}
        </Typography>
        <Typography
          level='body-md'
          sx={{ mt: 1, color: 'text.secondary', textWrap: 'pretty' }}
        >
          {t('onboarding.privacy.subtitle')}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          ...enter(60),
        }}
      >
        {PRIVACY_TOGGLES.map(({ description, key, label }) => (
          <Box
            key={key}
            sx={{
              ...cardSx,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1.5,
              px: 2,
              py: 1.5,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography level='title-sm' sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
              <Typography
                level='body-sm'
                sx={{ mt: 0.25, color: 'text.secondary' }}
              >
                {description}
              </Typography>
            </Box>
            <Switch
              checked={values[key]}
              onClick={() => toggle(key)}
              sx={{ flex: '0 0 auto', mt: 0.25 }}
            />
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 3, ...enter(120) }}>
        <Button size='lg' fullWidth onClick={finish} sx={authButtonSx}>
          {t('onboarding.privacy.continue')}
        </Button>
      </Box>
    </>
  )
}

PrivacyPreferences.propTypes = {
  onDone: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
}

const HeardAboutView = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const [isOfficial, setIsOfficial] = useState(null)

  useEffect(() => {
    let cancelled = false
    isOfficialDayDanInstance().then(result => {
      if (!cancelled) setIsOfficial(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const onDone = () => navigate('/circle-setup', { replace: true })

  if (isOfficial === null) return <Shell />

  return (
    <Shell>
      {isOfficial ? (
        <AcquisitionSurvey onDone={onDone} t={t} />
      ) : (
        <PrivacyPreferences onDone={onDone} t={t} />
      )}
    </Shell>
  )
}

export default HeardAboutView

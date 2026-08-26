import {
  ContentCopyRounded,
  GroupAddRounded,
  LinkRounded,
} from '@mui/icons-material'
import { Box, Button, IconButton, Input, Link, Typography } from '@mui/joy'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import useAcknowledgmentModal from '../../hooks/useAcknowledgmentModal'
import { useNotification } from '../../service/NotificationProvider'
import { productTypeScale } from '../../theme/typography'
import { GetUserCircle, JoinCircle } from '../../utils/Fetcher'
import { haptic } from '../../utils/Onboarding'
import { clearPendingInvite, getPendingInvite } from '../../utils/PendingInvite'
import { authButtonSx, authInputSx } from '../Authorization/authStyles'
import AcknowledgmentModal from '../Modals/Inputs/AcknowledgmentModal'
import { CircleVignette } from './OnboardingVignettes'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const enter = (delay = 0) => ({
  animation: `circleSetupIn 520ms ${EASE} ${delay}ms both`,
  '@keyframes circleSetupIn': {
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

const IconHalo = ({ icon }) => (
  <Box
    sx={{
      position: 'relative',
      display: 'grid',
      placeItems: 'center',
      width: 84,
      height: 84,
      '&::before': {
        content: '""',
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: '50%',
        bgcolor: 'primary.softBg',
        opacity: 0.6,
        filter: 'blur(28px)',
      },
      '& > *': { position: 'relative' },
    }}
  >
    <Box
      sx={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.surface',
        border: '1px solid',
        borderColor: 'divider',
        color: 'primary.plainColor',
        '& svg': { fontSize: '2rem' },
      }}
    >
      {icon}
    </Box>
  </Box>
)

IconHalo.propTypes = {
  icon: PropTypes.node.isRequired,
}

const CircleSetupView = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const { showNotification } = useNotification()
  const { ackModalConfig, showAcknowledgment } = useAcknowledgmentModal()
  const pendingInvite = getPendingInvite()

  const [mode, setMode] = useState(pendingInvite ? 'join' : 'invite')
  const [inviteCode, setInviteCode] = useState(null)
  const [joinCode, setJoinCode] = useState(pendingInvite ?? '')
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    GetUserCircle()
      .then(resp => resp.json())
      .then(data => setInviteCode(data.res?.[0]?.invite_code ?? null))
      .catch(() => setInviteCode(null))
  }, [])

  const finish = () => navigate('/ready', { replace: true })

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    showNotification({
      type: 'success',
      message: t('onboarding.circleSetup.copyCodeSuccess'),
    })
  }

  const copyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.protocol}//${window.location.host}/circle/join?code=${inviteCode}`,
    )
    showNotification({
      type: 'success',
      message: t('onboarding.circleSetup.copyLinkSuccess'),
    })
  }

  const joinCircle = async () => {
    if (!joinCode.trim()) return
    setIsJoining(true)
    haptic()
    try {
      const resp = await JoinCircle(joinCode.trim())
      if (resp.ok) {
        clearPendingInvite()
        showAcknowledgment(
          t('onboarding.circleSetup.joinRequestSentBody'),
          t('onboarding.circleSetup.joinRequestSentTitle'),
          finish,
        )
      } else {
        showNotification({
          type: 'error',
          message:
            resp.status === 409
              ? t('onboarding.circleSetup.alreadyMember')
              : t('onboarding.circleSetup.joinFailed'),
        })
      }
    } finally {
      setIsJoining(false)
    }
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
        <Box sx={{ mb: 2, ...enter(0) }}>
          {mode === 'invite' ? (
            <CircleVignette />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <IconHalo icon={<GroupAddRounded />} />
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 1.5,
            mb: 4,
            ...enter(60),
          }}
        >
          <Typography
            level='h1'
            sx={{
              ...productTypeScale.display,
              textWrap: 'balance',
            }}
          >
            {mode === 'invite'
              ? t('onboarding.circleSetup.inviteTitle')
              : t('onboarding.circleSetup.joinTitle')}
          </Typography>
          <Typography
            level='body-md'
            sx={{
              color: 'text.secondary',
              maxWidth: '32ch',
              textWrap: 'pretty',
            }}
          >
            {mode === 'invite'
              ? t('onboarding.circleSetup.inviteSubtitle')
              : t('onboarding.circleSetup.joinSubtitle')}
          </Typography>
        </Box>

        {mode === 'invite' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box
              sx={{
                ...enter(120),
                ...cardSx,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                px: 2,
                py: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: inviteCode ? 'text.primary' : 'text.tertiary',
                }}
              >
                {inviteCode ?? t('onboarding.circleSetup.codeLoading')}
              </Typography>
              <IconButton
                variant='soft'
                color='primary'
                disabled={!inviteCode}
                onClick={copyCode}
                aria-label={t('onboarding.circleSetup.copyCodeAria')}
                size='lg'
              >
                <ContentCopyRounded />
              </IconButton>
            </Box>

            <Box sx={{ textAlign: 'center', ...enter(150) }}>
              <Link
                component='button'
                type='button'
                level='body-sm'
                color='neutral'
                underline='hover'
                startDecorator={<LinkRounded fontSize='small' />}
                disabled={!inviteCode}
                onClick={copyLink}
              >
                {t('onboarding.circleSetup.copyLinkAria')}
              </Link>
            </Box>

            <Box sx={{ mt: 1, ...enter(190) }}>
              <Button size='lg' fullWidth onClick={finish} sx={authButtonSx}>
                {t('onboarding.circleSetup.continue')}
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', ...enter(230) }}>
              <Link
                component='button'
                type='button'
                level='body-sm'
                color='neutral'
                underline='hover'
                startDecorator={<GroupAddRounded fontSize='small' />}
                onClick={() => setMode('join')}
              >
                {t('onboarding.circleSetup.joinExisting')}
              </Link>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ ...enter(120) }}>
              <Input
                placeholder={t('onboarding.circleSetup.enterCode')}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                size='lg'
                fullWidth
                autoFocus
                sx={authInputSx}
              />
            </Box>
            <Box sx={{ ...enter(160) }}>
              <Button
                size='lg'
                fullWidth
                loading={isJoining}
                disabled={!joinCode.trim()}
                onClick={joinCircle}
                sx={authButtonSx}
              >
                {t('onboarding.circleSetup.joinCircle')}
              </Button>
            </Box>
            <Box sx={{ textAlign: 'center', ...enter(200) }}>
              <Link
                component='button'
                type='button'
                level='body-sm'
                color='neutral'
                underline='hover'
                onClick={() => {
                  clearPendingInvite()
                  setJoinCode('')
                  setMode('invite')
                }}
              >
                {t('onboarding.circleSetup.back')}
              </Link>
            </Box>
          </Box>
        )}
      </Box>

      <AcknowledgmentModal config={ackModalConfig} />
    </Box>
  )
}

export default CircleSetupView

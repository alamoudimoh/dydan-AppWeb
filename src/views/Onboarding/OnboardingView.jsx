import {
  ArrowForwardRounded,
  NotificationsActiveRounded,
} from '@mui/icons-material'
import { Box, Button, Typography } from '@mui/joy'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import Logo from '../../Logo'
import { productTypeScale } from '../../theme/typography'
import {
  haptic,
  markOnboardingSeen,
  requestNotificationPermission,
} from '../../utils/Onboarding'
import { authButtonSx } from '../Authorization/authStyles'
import {
  CaptureVignette,
  ProblemVignette,
  RemindersVignette,
  TakesTurnsVignette,
} from './OnboardingVignettes'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const SWIPE_THRESHOLD = 56

const OnboardingView = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const [activeIndex, setActiveIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const [asking, setAsking] = useState(false)
  const pointerRef = useRef(null)
  const viewportRef = useRef(null)

  const SLIDES = [
    {
      key: 'problem',
      title: t('onboarding.slides.problem.title'),
      body: t('onboarding.slides.problem.body'),
      Visual: ProblemVignette,
    },
    {
      key: 'capture',
      title: t('onboarding.slides.capture.title'),
      body: t('onboarding.slides.capture.body'),
      Visual: CaptureVignette,
    },
    {
      key: 'circle',
      title: t('onboarding.slides.circle.title'),
      body: t('onboarding.slides.circle.body'),
      Visual: TakesTurnsVignette,
    },
    {
      key: 'reminders',
      title: t('onboarding.slides.reminders.title'),
      body: t('onboarding.slides.reminders.body'),
      Visual: RemindersVignette,
      permission: true,
    },
  ]

  const isLast = activeIndex === SLIDES.length - 1
  const asksPermission = Boolean(SLIDES[activeIndex].permission)

  const finish = useCallback(() => {
    markOnboardingSeen()
    navigate('/get-started', { replace: true })
  }, [navigate])

  const goTo = useCallback(
    index => {
      setActiveIndex(current => {
        const next = Math.min(Math.max(index, 0), SLIDES.length - 1)
        if (next !== current) haptic()
        return next
      })
    },
    [SLIDES.length],
  )

  const enableNotifications = async () => {
    setAsking(true)
    try {
      await requestNotificationPermission()
    } finally {
      setAsking(false)
    }
    haptic('medium')
    finish()
  }

  const handleNext = () => {
    if (isLast) {
      haptic('medium')
      finish()
      return
    }
    goTo(activeIndex + 1)
  }

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'ArrowRight') goTo(activeIndex + 1)
      if (event.key === 'ArrowLeft') goTo(activeIndex - 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, goTo])

  const onPointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointerRef.current = { id: event.pointerId, startX: event.clientX }
  }

  const onPointerMove = event => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return

    const delta = event.clientX - pointer.startX
    const atEdge = (activeIndex === 0 && delta > 0) || (isLast && delta < 0)
    setDrag(atEdge ? delta * 0.35 : delta)
  }

  const endDrag = event => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return

    const delta = event.clientX - pointer.startX
    pointerRef.current = null
    setDrag(0)

    if (delta <= -SWIPE_THRESHOLD) goTo(activeIndex + 1)
    else if (delta >= SWIPE_THRESHOLD) goTo(activeIndex - 1)
  }

  const width = viewportRef.current?.offsetWidth || 1
  const dragPercent = (drag / width) * 100

  return (
    <Box
      component='main'
      sx={{
        minHeight: 'calc(100dvh - var(--safe-area-inset-top, 0px))',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.body',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Logo size='26px' />
          <Typography
            level='title-md'
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              fontSize: productTypeScale.cardTitle.fontSize,
            }}
          >
            Done
            <Box component='span' sx={{ color: 'primary.500' }}>
              tick
            </Box>
          </Typography>
        </Box>

        <Button
          variant='plain'
          color='neutral'
          size='sm'
          onClick={finish}
          sx={{ fontWeight: 600, borderRadius: '999px' }}
        >
          {t('onboarding.carousel.skip')}
        </Button>
      </Box>

      <Box
        ref={viewportRef}
        role='group'
        aria-roledescription='carousel'
        aria-label={t('onboarding.carousel.ariaLabel')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          overflow: 'hidden',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            minWidth: 0,
            minHeight: 0,
            transform: `translate3d(calc(${-activeIndex * 100}% + ${dragPercent}%), 0, 0)`,
            transition: pointerRef.current ? 'none' : `transform 360ms ${EASE}`,
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        >
          {SLIDES.map((slide, index) => {
            const active = index === activeIndex
            const { Visual } = slide
            return (
              <Box
                key={slide.key}
                role='group'
                aria-roledescription='slide'
                aria-label={t('onboarding.carousel.slideLabel', {
                  index: index + 1,
                  count: SLIDES.length,
                })}
                aria-hidden={!active}
                sx={{
                  flex: '0 0 100%',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 4,
                  px: 3,
                  py: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Visual key={active ? 'active' : 'idle'} />
                </Box>

                <Box
                  key={active ? 'copy-active' : 'copy-idle'}
                  aria-live='polite'
                  aria-atomic='true'
                  sx={{
                    textAlign: 'center',
                    '@media (prefers-reduced-motion: reduce)': {
                      '& > *': { animation: 'none' },
                    },
                  }}
                >
                  <Typography
                    level='h2'
                    sx={{
                      ...productTypeScale.display,
                      textWrap: 'balance',
                      animation: `slideCopyIn 460ms ${EASE} 60ms both`,
                      '@keyframes slideCopyIn': {
                        from: { opacity: 0, transform: 'translateY(10px)' },
                        to: { opacity: 1, transform: 'none' },
                      },
                    }}
                  >
                    {slide.title}
                  </Typography>
                  <Typography
                    level='body-md'
                    sx={{
                      mt: 1,
                      mx: 'auto',
                      maxWidth: '34ch',
                      color: 'text.secondary',
                      textWrap: 'pretty',
                      animation: `slideCopyIn 460ms ${EASE} 140ms both`,
                    }}
                  >
                    {slide.body}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>

      <Box
        sx={{
          px: 3,
          pt: 1,
          pb: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Dots
          count={SLIDES.length}
          activeIndex={activeIndex}
          onSelect={goTo}
          t={t}
        />

        {asksPermission ? (
          <>
            <Button
              size='lg'
              fullWidth
              loading={asking}
              onClick={enableNotifications}
              startDecorator={<NotificationsActiveRounded />}
              sx={authButtonSx}
            >
              {t('onboarding.carousel.turnOnReminders')}
            </Button>
            <Button
              variant='plain'
              color='neutral'
              size='lg'
              fullWidth
              disabled={asking}
              onClick={finish}
              sx={{ ...authButtonSx, mt: -1.5 }}
            >
              {t('onboarding.carousel.notNow')}
            </Button>
          </>
        ) : (
          <Button
            size='lg'
            fullWidth
            onClick={handleNext}
            endDecorator={!isLast ? <ArrowForwardRounded /> : null}
            sx={authButtonSx}
          >
            {isLast
              ? t('onboarding.carousel.getStarted')
              : t('onboarding.carousel.next')}
          </Button>
        )}
      </Box>
    </Box>
  )
}

const Dots = ({ activeIndex, count, onSelect, t }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
    {Array.from({ length: count }, (_, index) => {
      const active = index === activeIndex
      return (
        <Box
          key={index}
          component='button'
          type='button'
          aria-label={t('onboarding.carousel.goToStep', { step: index + 1 })}
          aria-current={active ? 'step' : undefined}
          onClick={() => onSelect(index)}
          sx={{
            border: 'none',
            p: 0,
            cursor: 'pointer',
            minWidth: 44,
            minHeight: 44,
            display: 'grid',
            placeItems: 'center',
            background: 'none',
            '&::after': {
              content: '""',
              display: 'block',
              height: 6,
              width: active ? 22 : 6,
              borderRadius: '999px',
              bgcolor: active ? 'primary.500' : 'neutral.softBg',
              transition: `width 280ms ${EASE}, background-color 280ms ease`,
            },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.500',
              outlineOffset: '2px',
              borderRadius: '8px',
            },
            '@media (prefers-reduced-motion: reduce)': {
              '&, &::after': { transition: 'none' },
            },
          }}
        />
      )
    })}
  </Box>
)

export default OnboardingView

import {
  AddRounded,
  CheckRounded,
  ContactlessRounded,
  HourglassEmptyRounded,
  KeyboardRounded,
  MicNoneRounded,
  NotificationsActiveRounded,
  PeopleAltRounded,
  PhoneIphoneRounded,
  PhotoCameraOutlined,
  PlayArrowRounded,
  Repeat,
  SwitchAccessShortcutRounded,
  ThumbDownRounded,
  ThumbUpRounded,
} from '@mui/icons-material'
import { Box, Typography } from '@mui/joy'
import { useTranslation } from 'react-i18next'

import { productTypeScale } from '../../theme/typography'
import {
  getPriorityColor,
  getTextColorFromBackgroundColor,
} from '../../utils/Colors'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const CYCLE_MS = 5400

const reducedMotion = {
  '@media (prefers-reduced-motion: reduce)': {
    '&, & *': { animation: 'none !important' },
  },
}

const cardSx = {
  bgcolor: 'background.surface',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 'var(--daydan-radius-card)',
  boxShadow: 'sm',
}

const Stage = ({ children }) => (
  <Box
    aria-hidden='true'
    sx={{
      position: 'relative',
      width: '100%',
      maxWidth: 320,
      mx: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: '-16% -12%',
        borderRadius: '50%',
        bgcolor: 'primary.softBg',
        opacity: 0.55,
        filter: 'blur(28px)',
        zIndex: 0,
      },
      '& > *': { position: 'relative', zIndex: 1 },
      ...reducedMotion,
    }}
  >
    {children}
  </Box>
)

const Chip = ({ children, color = 'primary', icon, sx }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      px: 0.875,
      py: 0.25,
      borderRadius: 'var(--r-sm)',
      bgcolor: `${color}.softBg`,
      color: color === 'neutral' ? 'text.secondary' : `${color}.softColor`,
      fontSize: productTypeScale.label.fontSize,
      fontWeight: 600,
      lineHeight: 1.6,
      whiteSpace: 'nowrap',
      '& svg': { fontSize: '0.875rem' },
      ...sx,
    }}
  >
    {icon}
    {children}
  </Box>
)

const LabelChip = ({ color, label, sx }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      alignSelf: 'flex-start',
      px: 0.75,
      py: 0.125,
      borderRadius: 'var(--r-sm)',
      fontSize: productTypeScale.label.fontSize,
      fontWeight: 700,
      lineHeight: 1.6,
      whiteSpace: 'nowrap',
      bgcolor: color,
      color: getTextColorFromBackgroundColor(color),
      ...sx,
    }}
  >
    {label}
  </Box>
)

const getName = name => {
  const split = Array.from(name)
  if (isNaN(Number(split[0])) && /\p{Emoji}/u.test(split[0])) {
    return split.slice(1).join('').trim()
  }
  return name
}

const MiniChoreCard = ({
  due,
  dueColor = 'primary',
  footer,
  label,
  labelColor = '#5c6bc0',
  repeat,
  title,
}) => (
  <Box>
    <Box sx={{ display: 'flex', gap: 0.5, ms: 1.25, mb: -1.25, zIndex: 2 }}>
      <Chip color={dueColor}>{due}</Chip>
      {repeat && (
        <Chip color='neutral' icon={<Repeat />}>
          {repeat}
        </Chip>
      )}
    </Box>

    <Box sx={{ ...cardSx, p: 1.75, display: 'flex', gap: 1.25 }}>
      <Box
        sx={{
          flex: '0 0 auto',
          width: 34,
          height: 34,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'neutral.softBg',
          color: 'text.primary',
          fontSize: '1rem',
          fontWeight: 600,
        }}
      >
        {Array.from(title)[0]}
      </Box>
      <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Typography level='title-sm' noWrap sx={{ fontWeight: 600 }}>
          {getName(title)}
        </Typography>
        {label && (
          <LabelChip label={label} color={labelColor} sx={{ mt: 0.375 }} />
        )}
        {footer}
      </Box>
    </Box>
  </Box>
)

const AssigneeChip = ({ color = 'primary', name, sx }) => (
  <Box
    sx={{
      mt: 0.5,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.625,
      alignSelf: 'flex-start',
      paddingInlineStart: 0.25,
      pr: 1,
      py: 0.25,
      borderRadius: 'var(--r-sm)',
      border: '1px solid',
      borderColor: 'divider',
      fontSize: productTypeScale.label.fontSize,
      fontWeight: 500,
      color: 'text.secondary',
      ...sx,
    }}
  >
    <Box
      sx={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        fontSize: '0.625rem',
        fontWeight: 700,
        bgcolor: `${color}.softBg`,
        color: 'text.primary',
      }}
    >
      {Array.from(name)[0]}
    </Box>
    {name}
  </Box>
)

const Cycler = ({ children, cycleMs = CYCLE_MS, sx }) => {
  const items = Array.isArray(children) ? children : [children]
  const count = items.length
  const step = cycleMs / count
  const hold = 100 / count
  const name = `cycleSwap${count}`

  return (
    <Box sx={{ display: 'grid', ...sx }}>
      {items.map((child, index) => (
        <Box
          key={index}
          sx={{
            gridArea: '1 / 1',
            opacity: index === 0 ? 1 : 0,
            animation: `${name} ${cycleMs}ms ${EASE} ${index * step}ms infinite both`,
            [`@keyframes ${name}`]: {
              '0%': { opacity: 0, transform: 'translateY(6px)' },
              '4%': { opacity: 1, transform: 'none' },
              [`${hold - 4}%`]: { opacity: 1, transform: 'none' },
              [`${hold + 1}%`]: { opacity: 0, transform: 'translateY(-6px)' },
              '100%': { opacity: 0, transform: 'translateY(-6px)' },
            },
            ...sx?.item,
          }}
        >
          {child}
        </Box>
      ))}
    </Box>
  )
}

/* ------------------------------------------- slide 1: three ways to capture */

const CAPTURE_STEP_MS = 3000
const CAPTURE_CYCLE_MS = CAPTURE_STEP_MS * 3

const SourcePill = ({ icon, index, label }) => (
  <Box
    sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.375,
      py: 1,
      borderRadius: 'var(--r-sm)',
      border: '1px solid',
      fontSize: productTypeScale.label.fontSize,
      fontWeight: 600,
      borderColor: index === 0 ? 'primary.500' : 'divider',
      bgcolor: index === 0 ? 'primary.softBg' : 'background.surface',
      color: index === 0 ? 'primary.plainColor' : 'text.secondary',
      animation: `sourcePulse ${CAPTURE_CYCLE_MS}ms ${EASE} ${index * CAPTURE_STEP_MS}ms infinite forwards`,
      '@keyframes sourcePulse': {
        '0%, 33%': {
          borderColor: 'var(--joy-palette-primary-500)',
          backgroundColor: 'var(--joy-palette-primary-softBg)',
          color: 'var(--joy-palette-primary-plainColor)',
          transform: 'translateY(-2px)',
        },
        '38%, 100%': {
          borderColor: 'var(--joy-palette-divider)',
          backgroundColor: 'var(--joy-palette-background-surface)',
          color: 'var(--joy-palette-text-secondary)',
          transform: 'none',
        },
      },
      '& svg': { fontSize: '1.25rem' },
    }}
  >
    {icon}
    {label}
  </Box>
)

const CaptureVariant = ({ caption, card, icon }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    {card}
    <Chip icon={icon} sx={{ alignSelf: 'flex-start' }}>
      {caption}
    </Chip>
  </Box>
)

const CaptureMorph = ({ after, before, delay = 0 }) => (
  <Box sx={{ display: 'grid' }}>
    <Box
      sx={{
        gridArea: '1 / 1',
        animation: `captureMorphOut ${CAPTURE_STEP_MS}ms ${EASE} ${delay}ms infinite both`,
        '@keyframes captureMorphOut': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '10%': { opacity: 1, transform: 'none' },
          '38%': { opacity: 1, transform: 'none' },
          '48%': { opacity: 0, transform: 'translateY(-6px)' },
          '100%': { opacity: 0, transform: 'translateY(-6px)' },
        },
      }}
    >
      {before}
    </Box>
    <Box
      sx={{
        gridArea: '1 / 1',
        animation: `captureMorphIn ${CAPTURE_STEP_MS}ms ${EASE} ${delay}ms infinite both`,
        '@keyframes captureMorphIn': {
          '0%, 46%': { opacity: 0, transform: 'translateY(6px) scale(0.96)' },
          '60%': { opacity: 1, transform: 'none' },
          '100%': { opacity: 1, transform: 'none' },
        },
      }}
    >
      {after}
    </Box>
  </Box>
)

const WAVE_BARS = [10, 18, 24, 14, 20, 11, 16]

const VoiceWave = ({ delay = 0, listeningLabel }) => (
  <Box
    sx={{
      ...cardSx,
      height: 68,
      px: 1.5,
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
    }}
  >
    <Box
      sx={{
        flex: '0 0 auto',
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: 'danger.500',
        animation: `recDotPulse 1000ms ease-in-out ${delay}ms infinite`,
        '@keyframes recDotPulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.35 },
        },
      }}
    />
    <Box
      sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 24 }}
    >
      {WAVE_BARS.map((height, index) => (
        <Box
          key={index}
          sx={{
            width: 3,
            height,
            borderRadius: '2px',
            bgcolor: 'primary.500',
            transformOrigin: 'bottom',
            animation: `waveBounce 900ms ease-in-out ${delay + index * 90}ms infinite`,
            '@keyframes waveBounce': {
              '0%, 100%': { transform: 'scaleY(0.4)' },
              '50%': { transform: 'scaleY(1)' },
            },
          }}
        />
      ))}
    </Box>
    <Typography level='body-xs' sx={{ color: 'text.tertiary' }}>
      {listeningLabel}
    </Typography>
  </Box>
)

const CORNER_MARKS = [
  { top: 6, insetInlineStart: 6, borderWidth: '2px 0 0 2px' },
  { top: 6, insetInlineEnd: 6, borderWidth: '2px 2px 0 0' },
  { bottom: 6, insetInlineStart: 6, borderWidth: '0 0 2px 2px' },
  { bottom: 6, insetInlineEnd: 6, borderWidth: '0 2px 2px 0' },
]

const CameraFrame = ({ delay = 0 }) => (
  <Box
    sx={{
      ...cardSx,
      height: 68,
      position: 'relative',
      overflow: 'hidden',
      display: 'grid',
      placeItems: 'center',
    }}
  >
    {CORNER_MARKS.map((mark, index) => (
      <Box
        key={index}
        sx={{
          position: 'absolute',
          width: 14,
          height: 14,
          borderStyle: 'solid',
          borderColor: 'primary.500',
          ...mark,
        }}
      />
    ))}
    <PhotoCameraOutlined sx={{ fontSize: 22, color: 'text.tertiary' }} />
    <Box
      aria-hidden='true'
      sx={{
        position: 'absolute',
        inset: 0,
        bgcolor: 'common.white',
        animation: `shutterFlash ${CAPTURE_STEP_MS}ms ${EASE} ${delay}ms infinite`,
        '@keyframes shutterFlash': {
          '0%, 36%': { opacity: 0 },
          '40%': { opacity: 0.9 },
          '46%, 100%': { opacity: 0 },
        },
      }}
    />
  </Box>
)

const TypingField = ({ delay = 0, typedText }) => (
  <Box
    sx={{
      ...cardSx,
      height: 68,
      px: 1.5,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}
  >
    <KeyboardRounded
      sx={{ fontSize: 18, color: 'text.tertiary', flex: '0 0 auto' }}
    />
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
      <Box
        sx={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          width: 0,
          animation: `typeReveal ${CAPTURE_STEP_MS}ms ${EASE} ${delay}ms infinite`,
          '@keyframes typeReveal': {
            '0%': {
              width: 0,
              animationTimingFunction: `steps(${typedText.length}, end)`,
            },
            '40%': { width: `${typedText.length}ch` },
            '100%': { width: `${typedText.length}ch` },
          },
        }}
      >
        <Typography
          level='body-sm'
          noWrap
          sx={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: productTypeScale.bodySmall.fontSize,
          }}
        >
          {typedText}
        </Typography>
      </Box>
      <Box
        sx={{
          width: '2px',
          height: '1.1em',
          ms: 0.25,
          bgcolor: 'primary.500',
          animation: 'caretBlink 500ms step-end infinite',
          '@keyframes caretBlink': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0 },
          },
        }}
      />
    </Box>
  </Box>
)

export const CaptureVignette = () => {
  const { t } = useTranslation('common')
  const SOURCES = [
    {
      icon: <MicNoneRounded />,
      label: t('onboarding.vignettes.capture.speak'),
    },
    {
      icon: <PhotoCameraOutlined />,
      label: t('onboarding.vignettes.capture.snap'),
    },
    {
      icon: <KeyboardRounded />,
      label: t('onboarding.vignettes.capture.type'),
    },
  ]

  return (
    <Stage>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {SOURCES.map((source, index) => (
          <SourcePill key={source.label} index={index} {...source} />
        ))}
      </Box>

      <Cycler cycleMs={CAPTURE_CYCLE_MS}>
        <CaptureVariant
          icon={<MicNoneRounded />}
          caption={t('onboarding.vignettes.capture.voiceCaption')}
          card={
            <CaptureMorph
              delay={0}
              before={
                <VoiceWave
                  delay={0}
                  listeningLabel={t('onboarding.vignettes.capture.listening')}
                />
              }
              after={
                <MiniChoreCard
                  title='♻️ Take out the trash'
                  due={t('onboarding.vignettes.capture.dueTomorrow')}
                  repeat={t('onboarding.vignettes.capture.everyMonday')}
                  label={t('onboarding.vignettes.capture.home')}
                  labelColor='#26a69a'
                />
              }
            />
          }
        />
        <CaptureVariant
          icon={<PhoneIphoneRounded />}
          caption={t('onboarding.vignettes.capture.photoCaption')}
          card={
            <CaptureMorph
              delay={CAPTURE_STEP_MS}
              before={<CameraFrame delay={CAPTURE_STEP_MS} />}
              after={
                <MiniChoreCard
                  title='🚗 Vehicle Registration Renewal'
                  due={t('onboarding.vignettes.capture.dueAug3')}
                  dueColor='warning'
                  footer={
                    <Cycler>
                      <AssigneeChip key='amalie' name='Amalie' color='blue' />
                    </Cycler>
                  }
                />
              }
            />
          }
        />
        <CaptureVariant
          icon={<KeyboardRounded />}
          caption={t('onboarding.vignettes.capture.typeCaption')}
          card={
            <CaptureMorph
              delay={2 * CAPTURE_STEP_MS}
              before={
                <TypingField
                  delay={2 * CAPTURE_STEP_MS}
                  typedText={t('onboarding.vignettes.capture.typedText')}
                />
              }
              after={
                <MiniChoreCard
                  title='💨 Change the AC filter'
                  due={t('onboarding.vignettes.capture.dueFri')}
                  repeat={t('onboarding.vignettes.capture.every3Months')}
                  footer={
                    <Cycler>
                      <AssigneeChip key='ryan' name='Ryan' color='green' />
                    </Cycler>
                  }
                />
              }
            />
          }
        />
      </Cycler>
    </Stage>
  )
}

/* --------------------------------- slide 2: due date vs. completion date */

const Milestone = ({ date, delay, label, tone = 'neutral' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5,
      animation: `milestoneIn 380ms ${EASE} ${delay}ms both`,
      '@keyframes milestoneIn': {
        from: { opacity: 0, transform: 'scale(0.8)' },
        to: { opacity: 1, transform: 'none' },
      },
    }}
  >
    <Box
      sx={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        color: 'common.white',
        bgcolor:
          tone === 'next'
            ? 'primary.500'
            : tone === 'done'
              ? 'success.500'
              : 'background.surface',
        border: '2px solid',
        borderColor:
          tone === 'next'
            ? 'primary.500'
            : tone === 'done'
              ? 'success.500'
              : 'neutral.outlinedBorder',
        '& svg': { fontSize: '0.75rem' },
      }}
    >
      {tone === 'done' && <CheckRounded />}
    </Box>
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        level='body-xs'
        sx={{
          fontSize: productTypeScale.label.fontSize,
          color: 'text.tertiary',
          lineHeight: 1.3,
        }}
      >
        {label}
      </Typography>
      <Typography
        level='body-xs'
        sx={{
          fontWeight: 600,
          lineHeight: 1.3,
          color: tone === 'next' ? 'primary.plainColor' : 'text.primary',
        }}
      >
        {date}
      </Typography>
    </Box>
  </Box>
)

const ScheduleTrack = ({ delay, mode, next, t }) => (
  <Box
    sx={{
      ...cardSx,
      px: 1.75,
      py: 1.5,
      animation: `trackIn 460ms ${EASE} ${delay}ms both`,
      '@keyframes trackIn': {
        from: { opacity: 0, transform: 'translateY(12px)' },
        to: { opacity: 1, transform: 'none' },
      },
    }}
  >
    <Typography
      level='body-xs'
      sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.25 }}
    >
      {mode}
    </Typography>

    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          insetInlineStart: '16%',
          insetInlineEnd: '16%',
          height: '2px',
          bgcolor: 'divider',
          transformOrigin: 'left center',
          animation: `trackDraw 520ms ${EASE} ${delay + 120}ms both`,
          '@keyframes trackDraw': {
            from: { transform: 'scaleX(0)' },
            to: { transform: 'scaleX(1)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}
      >
        <Milestone
          label={t('onboarding.vignettes.schedule.due')}
          date={t('onboarding.vignettes.schedule.mon6')}
          delay={delay + 160}
        />
        <Milestone
          label={t('onboarding.vignettes.schedule.done')}
          date={t('onboarding.vignettes.schedule.wed8')}
          tone='done'
          delay={delay + 320}
        />
        <Milestone
          label={t('onboarding.vignettes.schedule.next')}
          date={next}
          tone='next'
          delay={delay + 520}
        />
      </Box>
    </Box>
  </Box>
)

export const ScheduleVignette = () => {
  const { t } = useTranslation('common')
  return (
    <Stage>
      <ScheduleTrack
        mode={t('onboarding.vignettes.schedule.rescheduleFromDueDate')}
        next={t('onboarding.vignettes.schedule.mon13')}
        delay={0}
        t={t}
      />
      <ScheduleTrack
        mode={t('onboarding.vignettes.schedule.rescheduleFromCompletionDate')}
        next={t('onboarding.vignettes.schedule.wed15')}
        delay={220}
        t={t}
      />
    </Stage>
  )
}

/* ------------------------- slide 3: tap to finish, note, logged in history */

const HistoryRow = ({
  color,
  divider = true,
  icon,
  meta,
  note,
  performer,
  status,
}) => (
  <Box
    sx={{
      display: 'flex',
      bgcolor: 'background.body',
      ...(divider && {
        borderBottom: '1px solid',
        borderColor: 'divider',
      }),
      borderInlineStart: '3px solid',
      borderInlineStartColor: `${color}.400`,
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0, px: 1.5, py: 1.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: `${color}.softBg`,
            color: `${color}.plainColor`,
            '& svg': { fontSize: '11px' },
          }}
        >
          {icon}
        </Box>
        <Typography
          level='body-xs'
          sx={{ fontWeight: 700, color: `${color}.plainColor` }}
        >
          {status}
        </Typography>
      </Box>

      {note && (
        <Box
          sx={{
            mt: 0.75,
            px: 1,
            py: 0.75,
            borderRadius: 'var(--r-sm)',
            bgcolor: 'neutral.softBg',
          }}
        >
          <Typography
            level='body-xs'
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
              fontSize: productTypeScale.label.fontSize,
              lineHeight: 1.4,
            }}
          >
            {note}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          mt: 0.75,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          flexWrap: 'wrap',
        }}
      >
        {performer && <AssigneeChip name={performer} sx={{ mt: 0 }} />}
        <Typography
          level='body-xs'
          sx={{
            color: 'text.tertiary',
            fontSize: productTypeScale.label.fontSize,
          }}
        >
          {meta}
        </Typography>
      </Box>
    </Box>
  </Box>
)

const ActionButton = ({
  color = 'neutral',
  flex = 1,
  icon,
  label,
  variant,
}) => (
  <Box
    sx={{
      flex,
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.5,
      px: 1,
      py: 0.75,
      borderRadius: 'var(--r-sm)',
      fontSize: productTypeScale.bodySmall.fontSize,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      ...(variant === 'soft'
        ? { bgcolor: `${color}.softBg`, color: `${color}.plainColor` }
        : variant === 'outlined'
          ? {
              border: '1px solid',
              borderColor: 'neutral.outlinedBorder',
              color: 'text.secondary',
            }
          : { bgcolor: `${color}.500`, color: 'common.white' }),
      '& svg': { fontSize: '1rem' },
    }}
  >
    {icon}
    {label}
  </Box>
)

const ActionState = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
    {children}
  </Box>
)

const ActionRow = ({ children }) => (
  <Box sx={{ display: 'flex', gap: 0.75 }}>{children}</Box>
)

export const NfcVignette = () => {
  const { t } = useTranslation('common')
  return (
    <Stage>
      <Box
        sx={{
          ...cardSx,
          px: 1.5,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            flex: '0 0 auto',
            width: 38,
            height: 38,
            borderRadius: 'var(--r-sm)',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'primary.softBg',
            color: 'primary.plainColor',
            '& svg': { fontSize: '1.5rem' },
          }}
        >
          {[0, 1].map(ring => (
            <Box
              key={ring}
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'var(--r-sm)',
                border: '2px solid',
                borderColor: 'primary.400',
                opacity: 0,
                animation: `nfcPing 2400ms ${EASE} ${ring * 800}ms infinite both`,
                '@keyframes nfcPing': {
                  '0%': { opacity: 0.7, transform: 'scale(1)' },
                  '70%, 100%': { opacity: 0, transform: 'scale(1.55)' },
                },
              }}
            />
          ))}
          <ContactlessRounded />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography level='title-sm' sx={{ fontWeight: 600 }}>
            {t('onboarding.vignettes.nfc.tagOnWasher')}
          </Typography>
          <Typography level='body-xs' sx={{ color: 'text.tertiary' }}>
            {t('onboarding.vignettes.nfc.tapToOpen')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ ...cardSx, borderRadius: 'var(--r-sm)', px: 1.5, py: 1.25 }}>
        <Typography level='title-sm' sx={{ fontWeight: 600, mb: 1 }}>
          {t('onboarding.vignettes.nfc.swapFilter')}
        </Typography>

        <Cycler>
          <ActionState>
            <ActionRow>
              <ActionButton
                flex={3}
                color='success'
                icon={<CheckRounded />}
                label={t('onboarding.vignettes.nfc.done')}
              />
              <ActionButton
                variant='outlined'
                icon={<SwitchAccessShortcutRounded />}
                label={t('onboarding.vignettes.nfc.skip')}
              />
            </ActionRow>
            <ActionButton
              variant='soft'
              color='success'
              icon={<PlayArrowRounded />}
              label={t('onboarding.vignettes.nfc.startTimer')}
            />
          </ActionState>

          <ActionState>
            <Chip color='neutral' icon={<HourglassEmptyRounded />}>
              {t('onboarding.vignettes.nfc.waiting')}
            </Chip>
            <ActionRow>
              <ActionButton
                color='success'
                icon={<ThumbUpRounded />}
                label={t('onboarding.vignettes.nfc.approve')}
              />
              <ActionButton
                color='danger'
                icon={<ThumbDownRounded />}
                label={t('onboarding.vignettes.nfc.reject')}
              />
            </ActionRow>
          </ActionState>
        </Cycler>
      </Box>

      <Box sx={{ ...cardSx, borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateRows: '1fr',
            animation: `historyOpen 620ms ${EASE} 900ms both`,
            '@keyframes historyOpen': {
              from: { gridTemplateRows: '0fr' },
              to: { gridTemplateRows: '1fr' },
            },
          }}
        >
          <Box
            sx={{
              minHeight: 0,
              overflow: 'hidden',
              animation: `historyFade 420ms ease 1120ms both`,
              '@keyframes historyFade': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <HistoryRow
              status={t('onboarding.vignettes.history.completed')}
              color='success'
              icon={<CheckRounded />}
              performer='Mo'
              note={t('onboarding.vignettes.nfc.filterNote')}
              meta={
                t('onboarding.vignettes.history.justNow') +
                ' · ★ ' +
                t('onboarding.vignettes.history.points', { count: 5 })
              }
            />
          </Box>
        </Box>

        <HistoryRow
          status={t('onboarding.vignettes.history.completed')}
          color='success'
          icon={<CheckRounded />}
          performer='Amalie'
          meta={
            t('onboarding.vignettes.history.lastWeek') +
            ' · ★ ' +
            t('onboarding.vignettes.history.points', { count: 5 })
          }
        />
      </Box>
    </Stage>
  )
}

/* ----------------------------------------------- slide 4: share the load */

const MEMBERS = [
  { initial: 'M', name: 'Mo', color: 'primary' },
  { initial: 'A', name: 'Amalie', color: 'success' },
  { initial: 'S', name: 'Sam', color: 'warning' },
]

const AVATAR = 40
const AVATAR_GAP = 12
const STEP = AVATAR + AVATAR_GAP

export const CircleVignette = () => {
  const { t } = useTranslation('common')
  return (
    <Stage>
      <MiniChoreCard
        title={t('onboarding.vignettes.circle.kitchenDeepClean')}
        due={t('onboarding.vignettes.circle.dueSat')}
        repeat={t('onboarding.vignettes.circle.everyWeek')}
        footer={
          <Cycler>
            {MEMBERS.map(member => (
              <AssigneeChip
                key={member.name}
                name={member.name}
                color={member.color}
              />
            ))}
          </Cycler>
        }
      />

      <Box
        sx={{
          ...cardSx,
          px: 1.75,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            gap: `${AVATAR_GAP}px`,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -4,
              insetInlineStart: -4,
              width: AVATAR + 8,
              height: AVATAR + 8,
              borderRadius: '50%',
              border: '2px solid',
              borderColor: 'primary.500',
              animation: `ringHop ${CYCLE_MS}ms ${EASE} infinite both`,
              '@keyframes ringHop': {
                '0%, 28%': { transform: 'translateX(0)' },
                '33%, 61%': { transform: `translateX(${STEP}px)` },
                '66%, 94%': { transform: `translateX(${STEP * 2}px)` },
                '100%': { transform: 'translateX(0)' },
              },
            }}
          />
          {MEMBERS.map(member => (
            <Box
              key={member.name}
              sx={{
                width: AVATAR,
                height: AVATAR,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: '0.9375rem',
                fontWeight: 700,
                bgcolor: `${member.color}.softBg`,
                color: 'text.primary',
              }}
            >
              {member.initial}
            </Box>
          ))}
        </Box>

        <Chip icon={<PeopleAltRounded />} color='neutral'>
          {t('onboarding.vignettes.circle.takesTurns')}
        </Chip>
      </Box>
    </Stage>
  )
}

const NAG_STEP_MS = 3000
const NAG_CYCLE_MS = NAG_STEP_MS * MEMBERS.length

const NAG_HISTORY_ORDER = [MEMBERS[MEMBERS.length - 1], ...MEMBERS.slice(0, -1)]

const historyStackKeyframes = {
  '0%': { opacity: 0, transform: 'translateY(-14px) scale(0.94)', zIndex: 3 },
  '6%': { opacity: 1, transform: 'translateY(0) scale(1)', zIndex: 3 },
  '27%': { opacity: 1, transform: 'translateY(0) scale(1)', zIndex: 3 },
  '33%': {
    opacity: 0.75,
    transform: 'translateY(10px) scale(0.94)',
    zIndex: 2,
  },
  '54%': {
    opacity: 0.75,
    transform: 'translateY(10px) scale(0.94)',
    zIndex: 2,
  },
  '60%': {
    opacity: 0.45,
    transform: 'translateY(20px) scale(0.88)',
    zIndex: 1,
  },
  '88%': {
    opacity: 0.45,
    transform: 'translateY(20px) scale(0.88)',
    zIndex: 1,
  },
  '100%': { opacity: 0, transform: 'translateY(30px) scale(0.82)', zIndex: 1 },
}

export const TakesTurnsVignette = () => {
  const { t } = useTranslation('common')
  return (
    <Stage>
      <MiniChoreCard
        title='🗑️ Take bins to the curb'
        due={t('onboarding.vignettes.circle.dueTomorrow')}
        repeat={t('onboarding.vignettes.circle.everyWeek')}
        footer={
          <Cycler cycleMs={NAG_CYCLE_MS}>
            {MEMBERS.map(member => (
              <AssigneeChip
                key={member.name}
                name={member.name}
                color={member.color}
              />
            ))}
          </Cycler>
        }
      />

      <Box sx={{ position: 'relative', height: 88 }}>
        {NAG_HISTORY_ORDER.map((member, index) => (
          <Box
            key={member.name}
            sx={{
              ...cardSx,
              position: 'absolute',
              inset: 0,
              borderRadius: 'var(--r-sm)',
              overflow: 'hidden',
              animation: `historyStack ${NAG_CYCLE_MS}ms ${EASE} ${index * NAG_STEP_MS}ms infinite both`,
              '@keyframes historyStack': historyStackKeyframes,
            }}
          >
            <HistoryRow
              status={t('onboarding.vignettes.history.completed')}
              color='success'
              icon={<CheckRounded />}
              performer={member.name}
              meta={
                t('onboarding.vignettes.history.justNow') +
                ' · ★ ' +
                t('onboarding.vignettes.history.points', { count: 5 })
              }
              divider={false}
            />
          </Box>
        ))}
      </Box>
    </Stage>
  )
}

/* ------------------------------------- slide 5: widgets on the home screen */

const widgetSx = {
  ...cardSx,
  borderRadius: 'var(--r-sm)',
  boxShadow: 'md',
  p: 1.5,
}

const float = (duration, delay) => ({
  animation: `widgetFloat ${duration}ms ease-in-out ${delay}ms infinite alternate`,
  '@keyframes widgetFloat': {
    from: { transform: 'translateY(4px)' },
    to: { transform: 'translateY(-6px)' },
  },
})

const WidgetTask = ({ done, name, time }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box
      sx={{
        flex: '0 0 auto',
        width: 15,
        height: 15,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        border: '1.5px solid',
        borderColor: done ? 'success.500' : 'neutral.outlinedBorder',
        bgcolor: done ? 'success.500' : 'transparent',
        color: 'common.white',
        '& svg': { fontSize: '10px' },
      }}
    >
      {done && <CheckRounded />}
    </Box>
    <Typography
      level='body-xs'
      noWrap
      sx={{
        flex: 1,
        minWidth: 0,
        fontWeight: 500,
        color: done ? 'text.tertiary' : 'text.primary',
        textDecoration: done ? 'line-through' : 'none',
      }}
    >
      {name}
    </Typography>
    <Typography
      level='body-xs'
      sx={{ fontSize: productTypeScale.label.fontSize, color: 'text.tertiary' }}
    >
      {time}
    </Typography>
  </Box>
)

const TodayWidget = ({ t }) => (
  <Box sx={{ ...widgetSx, ...float(3600, 0) }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
      <Typography
        level='body-xs'
        sx={{ flex: 1, fontWeight: 700, letterSpacing: '-0.01em' }}
      >
        {t('onboarding.vignettes.reminders.today')}
      </Typography>
      <Chip color='primary'>
        {t('onboarding.vignettes.reminders.tasksLeft', { count: 3 })}
      </Chip>
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'primary.500',
          color: 'common.white',
          '& svg': { fontSize: '0.875rem' },
        }}
      >
        <AddRounded />
      </Box>
    </Box>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
      <WidgetTask
        name={t('onboarding.vignettes.reminders.schoolForms')}
        time='8:00'
        done
      />
      <WidgetTask
        name={t('onboarding.vignettes.reminders.takeOutTrash')}
        time='18:00'
      />
      <WidgetTask
        name={t('onboarding.vignettes.reminders.waterPlants')}
        time='20:30'
      />
    </Box>
  </Box>
)

const NotificationBanner = ({
  body,
  color = 'primary',
  delay,
  icon,
  title,
}) => (
  <Box
    sx={{
      ...cardSx,
      borderRadius: 'var(--r-sm)',
      boxShadow: 'md',
      px: 1.5,
      py: 1.25,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.25,
      animation: `bannerIn 560ms ${EASE} ${delay}ms both`,
      '@keyframes bannerIn': {
        from: { opacity: 0, transform: 'translateY(-14px) scale(0.96)' },
        to: { opacity: 1, transform: 'none' },
      },
    }}
  >
    <Box
      sx={{
        flex: '0 0 auto',
        width: 30,
        height: 30,
        borderRadius: 'var(--r-sm)',
        display: 'grid',
        placeItems: 'center',
        bgcolor: `${color}.softBg`,
        color: `${color}.plainColor`,
        '& svg': { fontSize: '1.125rem' },
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography level='title-sm' sx={{ fontWeight: 600, lineHeight: 1.3 }}>
        {title}
      </Typography>
      <Typography
        level='body-xs'
        sx={{ color: 'text.secondary', lineHeight: 1.4 }}
      >
        {body}
      </Typography>
    </Box>
  </Box>
)

export const RemindersVignette = () => {
  const { t } = useTranslation('common')
  return (
    <Stage>
      <NotificationBanner
        icon={<NotificationsActiveRounded />}
        title={t('onboarding.vignettes.reminders.takeOutTrash')}
        body={t('onboarding.vignettes.reminders.trashDue')}
        delay={160}
      />
      <NotificationBanner
        color='success'
        icon={<CheckRounded />}
        title={t('onboarding.vignettes.reminders.kitchenDone')}
        body={t('onboarding.vignettes.reminders.yourTurn')}
        delay={520}
      />
      <TodayWidget t={t} />
    </Stage>
  )
}

/* -------------------------------------------- slide 1: the problem itself */

const ProblemVignette = () => {
  const { t } = useTranslation('common')
  const LITTLE_THINGS = [
    {
      label: t('onboarding.vignettes.problem.waterBill'),
      priority: 1,
      frequency: t('onboarding.vignettes.problem.monthly'),
      tag: t('onboarding.vignettes.problem.bills'),
      tagColor: '#5c6bc0',
      from: '-28px, 18px, -6deg',
    },
    {
      label: t('onboarding.vignettes.problem.acFilter'),
      priority: 2,
      frequency: t('onboarding.vignettes.problem.every3Months'),
      tag: t('onboarding.vignettes.problem.home'),
      tagColor: '#26a69a',
      from: '30px, 22px, 5deg',
    },
    {
      label: t('onboarding.vignettes.problem.trashDay'),
      priority: 2,
      frequency: t('onboarding.vignettes.problem.everyMonday'),
      tag: t('onboarding.vignettes.problem.home'),
      tagColor: '#26a69a',
      from: '-34px, 26px, -4deg',
    },
    {
      label: t('onboarding.vignettes.problem.dogMedicine'),
      priority: 1,
      frequency: t('onboarding.vignettes.problem.daily'),
      tag: t('onboarding.vignettes.problem.pets'),
      tagColor: '#ec407a',
      from: '26px, 30px, 6deg',
    },
    {
      label: t('onboarding.vignettes.problem.whoseTurnToCook'),
      priority: 3,
      frequency: t('onboarding.vignettes.problem.weekly'),
      tag: t('onboarding.vignettes.problem.cooking'),
      tagColor: '#66bb6a',
      from: '-22px, 34px, -5deg',
    },
  ]

  return (
    <Stage>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {LITTLE_THINGS.map((thing, index) => (
          <Box
            key={thing.label}
            sx={{
              ...cardSx,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              pl: 1.75,
              pr: 1.25,
              py: 1,
              animation: `thingLand 620ms ${EASE} ${index * 130}ms both`,
              '@keyframes thingLand': {
                from: {
                  opacity: 0,
                  transform: `translate3d(${thing.from.split(',').slice(0, 2).join(',')}, 0) rotate(${thing.from.split(',')[2]})`,
                },
                to: { opacity: 1, transform: 'none' },
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                insetInlineStart: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                bgcolor: getPriorityColor(thing.priority),
              },
            }}
          >
            <Box
              aria-hidden='true'
              sx={{
                flex: '0 0 auto',
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'neutral.outlinedBorder',
              }}
            />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                level='title-sm'
                noWrap
                sx={{
                  fontWeight: 600,
                  fontSize: productTypeScale.bodySmall.fontSize,
                }}
              >
                {thing.label}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.375 }}>
                <Repeat sx={{ fontSize: 12, color: 'text.tertiary' }} />
                <Typography
                  level='body-xs'
                  sx={{
                    color: 'text.tertiary',
                    fontSize: productTypeScale.label.fontSize,
                  }}
                >
                  {thing.frequency}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                flex: '0 0 auto',
                px: 0.875,
                py: 0.125,
                borderRadius: 'var(--r-sm)',
                fontSize: productTypeScale.label.fontSize,
                fontWeight: 700,
                lineHeight: 1.6,
                whiteSpace: 'nowrap',
                bgcolor: thing.tagColor,
                color: getTextColorFromBackgroundColor(thing.tagColor),
              }}
            >
              {thing.tag}
            </Box>
          </Box>
        ))}
      </Box>
    </Stage>
  )
}

export { ProblemVignette }

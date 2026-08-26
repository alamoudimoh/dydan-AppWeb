// import { StyledButton } from '@/components/styled-button'
import { DarkMode, GitHub, LightMode } from '@mui/icons-material'
import { Button, IconButton, useColorScheme } from '@mui/joy'
import Typography from '@mui/joy/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import Logo from '@/assets/logo.svg'
import screenShotMyChore from '@/assets/screenshot-my-chore.png'
import screenShotMyChoreDark from '@/assets/screenshot-my-chore-dark.png'
import {
  APP_BRAND_ID,
  APP_DISPLAY_NAME,
  APP_DISPLAY_TAGLINE,
} from '@/config/AppBranding'
import { DAYDAN_APP_REPO } from '@/config/ReportDestinations'

import useWindowWidth from '../../hooks/useWindowWidth'

const HERO_TEXT =
  'The smart task manager that keeps individuals and families organized ' +
  'with intelligent scheduling and fair task distribution.'

const HomeHero = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const windowWidth = useWindowWidth()
  const windowThreshold = 600
  const { mode, setMode, systemMode } = useColorScheme()
  const effectiveMode = mode === 'system' ? systemMode : mode

  const title = (
    <Box
      sx={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {APP_BRAND_ID === 'daydan' && <img src={Logo} width='100' alt='' />}
      <Typography
        level='h1'
        fontSize={{ xs: 42, sm: 58 }}
        fontWeight={800}
        sx={{ overflowWrap: 'anywhere' }}
      >
        <span
          data-aos-delay={50 * 1}
          data-aos-anchor='[data-aos-id-hero]'
          data-aos='fade-up'
        >
          {APP_DISPLAY_NAME}
        </span>
      </Typography>
    </Box>
  )

  const subtitle = (
    <Typography
      level='h2'
      fontWeight={500}
      textAlign={'center'}
      className='opacity-70'
      data-aos-delay={100 * 5}
      data-aos-anchor='[data-aos-id-hero]'
      data-aos='zoom-in'
    >
      {APP_DISPLAY_TAGLINE}
    </Typography>
  )

  const ctaButton = (
    <Button
      data-aos-delay={100 * 2}
      data-aos-anchor='[data-aos-id-hero]'
      data-aos='fade-up'
      variant='solid'
      size='lg'
      sx={{
        py: 1.25,
        px: 5,
        fontSize: 20,
        mt: 2,
        borderWidth: 3,
        // boxShadow: '0px 0px 24px rgba(81, 230, 221, 0.5)',
        transition: 'all 0.20s',
      }}
      className='hover:scale-105'
      onClick={() => {
        // if the url is donetick.com then navigate to app.donetick.com/chores
        // else navigate to /chores
        if (window.location.hostname === 'donetick.com') {
          window.location.href = 'https://app.donetick.com/chores'
        } else {
          navigate('/chores')
        }
      }}
    >
      Get started
    </Button>
  )

  return (
    // <Box
    //   id='hero'
    //   className='grid min-h-[90vh] w-full place-items-center px-4 py-12'
    //   data-aos-id-hero
    // >
    <Grid
      container
      spacing={{ xs: 2, md: 16 }}
      sx={{ py: 12, position: 'relative' }}
    >
      <Grid item xs={12} md={7}>
        {title}
        <div className='flex flex-col gap-6'>
          {subtitle}

          <Typography
            level='title-lg'
            textAlign={'center'}
            fontSize={28}
            // textColor={'#06b6d4'}
            color='primary'
            data-aos-delay={100 * 1}
            data-aos-anchor='[data-aos-id-hero]'
            data-aos='fade-up'
          >
            {`"${HERO_TEXT}"`}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: 'center',
            }}
          >
            {ctaButton}
            {APP_BRAND_ID === 'daydan' && (
              <Button
                data-aos-delay={100 * 2.5}
                data-aos-anchor='[data-aos-id-hero]'
                data-aos='fade-up'
                variant='soft'
                size='lg'
                sx={{
                  py: 1.25,
                  px: 5,
                  fontSize: 20,
                  mt: 2,
                  borderWidth: 3,
                  transition: 'all 0.20s',
                }}
                className='hover:scale-105'
                onClick={() => window.open(DAYDAN_APP_REPO, '_blank')}
                startDecorator={<GitHub />}
              >
                GitHub
              </Button>
            )}
          </Box>
        </div>
      </Grid>
      {windowWidth > windowThreshold && (
        <Grid item xs={12} md={5}>
          <div className='flex justify-center'>
            <img
              src={
                effectiveMode === 'dark'
                  ? screenShotMyChoreDark
                  : screenShotMyChore
              }
              width={'100%'}
              height={'auto'}
              alt={`${APP_DISPLAY_NAME} task dashboard`}
              data-aos-delay={100 * 2}
              data-aos-anchor='[data-aos-id-hero]'
              data-aos='fade-left'
              style={{
                width: '100%',
                maxWidth: 300,
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'rotate(0deg) scale(1.05)'
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'rotate(5deg) scale(1)'
              }}
            />
          </div>
        </Grid>
      )}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          position: 'absolute',
          top: 16,
          insetInlineEnd: 0,
        }}
      >
        <IconButton
          aria-label={
            effectiveMode === 'dark'
              ? t('profileMenu.switchToLight')
              : t('profileMenu.switchToDark')
          }
          onClick={() => {
            setMode(effectiveMode === 'dark' ? 'light' : 'dark')
          }}
          sx={{
            backgroundColor: 'background.surface',
            borderRadius: '50%',
            boxShadow: 'sm',
            transition: 'background-color 0.3s',
          }}
        >
          {effectiveMode === 'dark' ? <LightMode /> : <DarkMode />}
        </IconButton>
      </Box>
    </Grid>
  )
}

export default HomeHero

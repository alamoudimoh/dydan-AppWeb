import { Button, Snackbar, Stack, Typography } from '@mui/joy'
import Cookies from 'js-cookie'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const CookiePermissionSnackbar = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(
    () => Cookies.get('cookies_permission') !== 'true',
  )

  const handleClose = () => {
    Cookies.set('cookies_permission', 'true')
    setOpen(false)
  }

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      onClose={(event, reason) => {
        if (reason === 'clickaway') {
          return
        }
        handleClose()
      }}
      sx={{
        gap: 2,
        bgcolor: 'background.surface',
        color: 'text.primary',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'md',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent='space-between'
        sx={{ width: '100%', gap: 2 }}
      >
        <Typography level='body-md' sx={{ color: 'text.primary' }}>
          {t('legal.cookieNotice')}
        </Typography>
        <Button
          variant='soft'
          onClick={handleClose}
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {t('legal.accept')}
        </Button>
      </Stack>
    </Snackbar>
  )
}

export default CookiePermissionSnackbar

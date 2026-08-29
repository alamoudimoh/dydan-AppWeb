import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  Link,
  Typography,
} from '@mui/joy'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'

import { productTypeScale } from '../../theme/typography.js'
import { authButtonSx, authInputSx } from './authStyles'

const labelSx = {
  fontSize: productTypeScale.button.fontSize,
  fontWeight: 600,
  mb: 0.75,
}

export const AuthField = ({ children, error, helper, label, ...formProps }) => (
  <FormControl error={Boolean(error)} {...formProps}>
    <FormLabel sx={labelSx}>{label}</FormLabel>
    {children}
    {(error || helper) && (
      <FormHelperText
        sx={{
          fontSize: productTypeScale.bodySmall.fontSize,
          color: error ? 'danger.plainColor' : 'text.secondary',
        }}
      >
        {error || helper}
      </FormHelperText>
    )}
  </FormControl>
)

export const AuthTextField = ({ error, helper, label, sx, ...inputProps }) => (
  <AuthField label={label} error={error} helper={helper}>
    <Input size='lg' sx={{ ...authInputSx, ...sx }} {...inputProps} />
  </AuthField>
)

export const AuthPasswordField = ({
  error,
  helper,
  label,
  sx,
  ...inputProps
}) => {
  const { t } = useTranslation('common')
  const [visible, setVisible] = useState(false)

  return (
    <AuthField
      label={label ?? t('auth.password')}
      error={error}
      helper={helper}
    >
      <Input
        size='lg'
        type={visible ? 'text' : 'password'}
        sx={{ ...authInputSx, ...sx }}
        endDecorator={
          <IconButton
            variant='plain'
            color='neutral'
            size='sm'
            tabIndex={-1}
            aria-label={
              visible ? t('auth.hidePassword') : t('auth.showPassword')
            }
            onClick={() => setVisible(v => !v)}
            sx={{ borderRadius: 'var(--product-radius-control)' }}
          >
            {visible ? (
              <VisibilityOffOutlined fontSize='small' />
            ) : (
              <VisibilityOutlined fontSize='small' />
            )}
          </IconButton>
        }
        {...inputProps}
      />
    </AuthField>
  )
}

export const AuthSubmitButton = ({ children, sx, ...props }) => (
  <Button
    type='submit'
    size='lg'
    variant='solid'
    fullWidth
    sx={{ ...authButtonSx, ...sx }}
    {...props}
  >
    {children}
  </Button>
)

export const SocialButton = ({ children, icon, sx, ...props }) => (
  <Button
    type='button'
    size='lg'
    variant='outlined'
    color='neutral'
    fullWidth
    startDecorator={icon}
    sx={{
      ...authButtonSx,
      fontWeight: 500,
      justifyContent: 'center',
      ...sx,
    }}
    {...props}
  >
    {children}
  </Button>
)

export const AuthDivider = ({ children }) => {
  const { t } = useTranslation('common')
  return (
    <Box
      role='separator'
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        my: 2.5,
        '&::before, &::after': {
          content: '""',
          flex: 1,
          height: '1px',
          bgcolor: 'divider',
        },
      }}
    >
      <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
        {children ?? t('auth.or')}
      </Typography>
    </Box>
  )
}

export const LegalLinks = () => {
  const { t } = useTranslation('common')
  return (
    <Typography
      level='body-xs'
      sx={{ textAlign: 'center', color: 'text.secondary' }}
    >
      <Link
        component={RouterLink}
        to='/privacy'
        color='neutral'
        underline='hover'
      >
        {t('auth.privacyPolicy')}
      </Link>
      {' · '}
      <Link
        component={RouterLink}
        to='/terms'
        color='neutral'
        underline='hover'
      >
        {t('auth.termsOfUse')}
      </Link>
    </Typography>
  )
}

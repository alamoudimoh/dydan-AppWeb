import MarkEmailReadOutlined from '@mui/icons-material/MarkEmailReadOutlined'
import { Box, Button, Link, Typography } from '@mui/joy'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useNotification } from '../../service/NotificationProvider'
import { ResetPassword } from '../../utils/Fetcher'
import { AuthSubmitButton, AuthTextField, LegalLinks } from './AuthFields'
import AuthShell from './AuthShell'
import { authButtonSx } from './authStyles'

const isInvalidEmail = email =>
  !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)

const ForgotPasswordView = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [resetStatusOk, setResetStatusOk] = useState(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showError, showNotification } = useNotification()

  const handleSubmit = async e => {
    e?.preventDefault()

    if (!email) {
      setEmailError(t('auth.emailRequired'))
      return
    }

    if (isInvalidEmail(email)) {
      setEmailError(t('auth.emailInvalid'))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await ResetPassword(email)

      if (response.ok) {
        setResetStatusOk(true)
        showNotification({
          type: 'success',
          title: t('auth.resetEmailSent'),
          message: t('auth.resetEmailInstructions'),
        })
      } else {
        setResetStatusOk(false)
        showError({
          title: t('auth.resetFailed'),
          message: t('auth.resetFailedMessage'),
        })
      }
    } catch (error) {
      setResetStatusOk(false)
      showError({
        title: t('auth.resetFailed'),
        message: t('auth.resetFailedMessage'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validate on blur/submit only; flagging a half-typed address as invalid on
  // every keystroke reads as the form yelling at you mid-word.
  const handleEmailChange = e => {
    setEmail(e.target.value)
    if (emailError) {
      setEmailError(null)
    }
  }

  const handleEmailBlur = () => {
    if (email && isInvalidEmail(email)) {
      setEmailError(t('auth.emailInvalid'))
    }
  }

  if (resetStatusOk !== null) {
    return (
      <AuthShell
        title={t('auth.checkEmailTitle')}
        subtitle={t('auth.checkEmailSubtitle', { email })}
        footer={<LegalLinks />}
        logoSize={0}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <MarkEmailReadOutlined
            fontSize='large'
            sx={{ color: 'primary.plainColor', mb: 2 }}
          />
          <Button
            fullWidth
            size='lg'
            variant='solid'
            sx={authButtonSx}
            onClick={() => navigate('/login')}
          >
            {t('auth.backToSignIn')}
          </Button>
        </Box>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth.forgotPasswordTitle')}
      subtitle={t('auth.forgotPasswordSubtitle')}
      footer={<LegalLinks />}
      logoSize={0}
    >
      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <AuthTextField
          label={t('auth.emailAddress')}
          id='email'
          name='email'
          type='email'
          autoComplete='email'
          placeholder={t('auth.emailPlaceholder')}
          autoFocus
          value={email}
          error={emailError}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
        />

        <AuthSubmitButton loading={isSubmitting} sx={{ mt: 1 }}>
          {t('auth.sendResetLink')}
        </AuthSubmitButton>
      </Box>

      <Typography
        level='body-sm'
        sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}
      >
        {t('auth.rememberedPassword')}{' '}
        <Link
          component='button'
          type='button'
          level='body-sm'
          fontWeight={600}
          underline='hover'
          onClick={() => navigate('/login')}
        >
          {t('auth.backToSignIn')}
        </Link>
      </Typography>
    </AuthShell>
  )
}

export default ForgotPasswordView

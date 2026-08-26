import { Box, Button } from '@mui/joy'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useNotification } from '../../service/NotificationProvider'
import { ChangePassword } from '../../utils/Fetcher'
import { consumePasswordResetCredential } from '../../utils/PasswordResetCredential.js'
import { AuthPasswordField, AuthSubmitButton, LegalLinks } from './AuthFields'
import AuthShell from './AuthShell'
import { authButtonSx } from './authStyles'

const UpdatePasswordView = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [passwordError, setPasswordError] = useState(null)
  const [passwordConfirmationError, setPasswordConfirmationError] =
    useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showError, showNotification } = useNotification()

  const [verificationCode] = useState(consumePasswordResetCredential)

  const handlePasswordChange = e => {
    setPassword(e.target.value)
    if (passwordError) {
      setPasswordError(null)
    }
  }

  const handlePasswordConfirmChange = e => {
    setPasswordConfirm(e.target.value)
    if (passwordConfirmationError) {
      setPasswordConfirmationError(null)
    }
  }

  const validate = () => {
    let isValid = true

    if (password.length < 8 || password.length > 64) {
      setPasswordError(t('auth.validation.passwordLength'))
      isValid = false
    }

    if (passwordConfirm !== password) {
      setPasswordConfirmationError(t('auth.passwordsDoNotMatch'))
      isValid = false
    }

    return isValid
  }

  const handleSubmit = async e => {
    e?.preventDefault()

    // The old version only bailed when an error was already set, so an
    // untouched form submitted an empty password.
    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await ChangePassword(verificationCode, password)

      if (response.ok) {
        showNotification({
          type: 'success',
          title: t('auth.passwordUpdated'),
          message: t('auth.passwordUpdatedRedirect'),
        })
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        showError({
          title: t('auth.passwordUpdateFailed'),
          message: t('auth.passwordUpdateFailedMessage'),
        })
      }
    } catch (error) {
      showError({
        title: t('auth.passwordUpdateFailed'),
        message: t('auth.passwordUpdateFailedMessage'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!verificationCode) {
    return (
      <AuthShell
        title={t('auth.linkInvalidTitle')}
        subtitle={t('auth.linkInvalidSubtitle')}
        footer={<LegalLinks />}
        showLogo
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            fullWidth
            size='lg'
            variant='solid'
            sx={authButtonSx}
            onClick={() => navigate('/forgot-password')}
          >
            {t('auth.requestNewLink')}
          </Button>
          <Button
            fullWidth
            size='lg'
            variant='plain'
            color='neutral'
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
      title={t('auth.updatePasswordTitle')}
      subtitle={t('auth.updatePasswordSubtitle')}
      footer={<LegalLinks />}
      // Reached from an emailed link, usually in a browser: an unbranded page
      // asking for a new password is the exact shape of a phishing screen.
      showLogo
    >
      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <AuthPasswordField
          label={t('auth.newPassword')}
          id='password'
          name='password'
          autoComplete='new-password'
          placeholder={t('auth.passwordPlaceholder')}
          autoFocus
          value={password}
          error={passwordError}
          helper={t('auth.validation.passwordLength')}
          onChange={handlePasswordChange}
        />

        <AuthPasswordField
          label={t('auth.confirmNewPassword')}
          id='passwordConfirm'
          name='passwordConfirm'
          autoComplete='new-password'
          placeholder={t('auth.reenterPassword')}
          value={passwordConfirm}
          error={passwordConfirmationError}
          onChange={handlePasswordConfirmChange}
        />

        <AuthSubmitButton loading={isSubmitting} sx={{ mt: 1 }}>
          {t('auth.savePassword')}
        </AuthSubmitButton>

        <Button
          type='button'
          fullWidth
          size='lg'
          variant='plain'
          color='neutral'
          sx={authButtonSx}
          onClick={() => navigate('/login')}
        >
          {t('cancel')}
        </Button>
      </Box>
    </AuthShell>
  )
}

export default UpdatePasswordView

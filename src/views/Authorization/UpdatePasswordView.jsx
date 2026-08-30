import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useNotification } from '../../service/NotificationProvider'
import { ChangePassword } from '../../utils/Fetcher'
import { consumePasswordResetCredential } from '../../utils/PasswordResetCredential.js'
import {
  AuthButton,
  AuthPasswordField,
  AuthSubmitButton,
  LegalLinks,
} from './AuthFields'
import AuthShell from './AuthShell'

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

  const validate = () => {
    let valid = true
    if (password.length < 8 || password.length > 64) {
      setPasswordError(t('auth.validation.passwordLength'))
      valid = false
    }
    if (passwordConfirm !== password) {
      setPasswordConfirmationError(t('auth.passwordsDoNotMatch'))
      valid = false
    }
    return valid
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const response = await ChangePassword(verificationCode, password)
      if (response.ok) {
        showNotification({
          type: 'success',
          title: t('auth.passwordUpdated'),
          message: t('auth.passwordUpdatedRedirect'),
        })
        setTimeout(() => navigate('/login'), 3000)
      } else {
        showError({
          title: t('auth.passwordUpdateFailed'),
          message: t('auth.passwordUpdateFailedMessage'),
        })
      }
    } catch {
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
        <div className='auth-stack'>
          <AuthButton
            variant='primary'
            onClick={() => navigate('/forgot-password')}
          >
            {t('auth.requestNewLink')}
          </AuthButton>
          <AuthButton onClick={() => navigate('/login')}>
            {t('auth.backToSignIn')}
          </AuthButton>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth.updatePasswordTitle')}
      subtitle={t('auth.updatePasswordSubtitle')}
      footer={<LegalLinks />}
      showLogo
    >
      <form className='auth-form' onSubmit={handleSubmit}>
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
          onChange={event => {
            setPasswordError(null)
            setPassword(event.target.value)
          }}
        />
        <AuthPasswordField
          label={t('auth.confirmNewPassword')}
          id='passwordConfirm'
          name='passwordConfirm'
          autoComplete='new-password'
          placeholder={t('auth.reenterPassword')}
          value={passwordConfirm}
          error={passwordConfirmationError}
          onChange={event => {
            setPasswordConfirmationError(null)
            setPasswordConfirm(event.target.value)
          }}
        />
        <AuthSubmitButton loading={isSubmitting}>
          {t('auth.savePassword')}
        </AuthSubmitButton>
        <AuthButton disabled={isSubmitting} onClick={() => navigate('/login')}>
          {t('cancel')}
        </AuthButton>
      </form>
    </AuthShell>
  )
}

export default UpdatePasswordView

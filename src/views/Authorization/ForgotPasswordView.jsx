import MarkEmailReadOutlined from '@mui/icons-material/MarkEmailReadOutlined'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useNotification } from '../../service/NotificationProvider'
import { ResetPassword } from '../../utils/Fetcher'
import {
  AuthButton,
  AuthSubmitButton,
  AuthTextField,
  LegalLinks,
} from './AuthFields'
import AuthShell from './AuthShell'

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

  const handleSubmit = async event => {
    event.preventDefault()
    if (!email) return setEmailError(t('auth.emailRequired'))
    if (isInvalidEmail(email)) return setEmailError(t('auth.emailInvalid'))

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
    } catch {
      setResetStatusOk(false)
      showError({
        title: t('auth.resetFailed'),
        message: t('auth.resetFailedMessage'),
      })
    } finally {
      setIsSubmitting(false)
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
        <div className='auth-stack'>
          <MarkEmailReadOutlined
            className='auth-status-icon'
            fontSize='large'
          />
          <AuthButton onClick={() => navigate('/login')} variant='primary'>
            {t('auth.backToSignIn')}
          </AuthButton>
        </div>
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
      <form className='auth-form' onSubmit={handleSubmit}>
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
          onChange={event => {
            setEmail(event.target.value)
            if (emailError) setEmailError(null)
          }}
          onBlur={() => {
            if (email && isInvalidEmail(email))
              setEmailError(t('auth.emailInvalid'))
          }}
        />
        <AuthSubmitButton loading={isSubmitting}>
          {t('auth.sendResetLink')}
        </AuthSubmitButton>
      </form>
      <p className='auth-copy auth-copy--spaced'>
        {t('auth.rememberedPassword')}{' '}
        <button
          className='auth-link'
          type='button'
          onClick={() => navigate('/login')}
        >
          {t('auth.backToSignIn')}
        </button>
      </p>
    </AuthShell>
  )
}

export default ForgotPasswordView

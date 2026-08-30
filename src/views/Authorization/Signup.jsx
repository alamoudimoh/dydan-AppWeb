import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth.jsx'
import { useNotification } from '../../service/NotificationProvider'
import { signUp } from '../../utils/Fetcher'
import { getPendingInvite, joinCirclePath } from '../../utils/PendingInvite'
import {
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
  LegalLinks,
} from './AuthFields'
import AuthShell from './AuthShell'

const SignupView = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showError } = useNotification()
  const { login: authLogin } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const next = {}
    if (
      !username.trim() ||
      username.length < 4 ||
      !/^[a-z0-9.-]+$/.test(username)
    ) {
      next.username = !username.trim()
        ? t('auth.validation.usernameRequired')
        : username.length < 4
          ? t('auth.validation.usernameMinLength')
          : t('auth.validation.usernameInvalid')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = t('auth.validation.emailInvalid')
    }
    if (password.length < 8 || password.length > 64) {
      next.password = t('auth.validation.passwordLength')
    }
    if (!displayName.trim() || !/^[a-zA-Z0-9 ]+$/.test(displayName)) {
      next.displayName = !displayName.trim()
        ? t('auth.validation.displayNameRequired')
        : t('auth.validation.displayNameInvalid')
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleLogin = async () => {
    const result = await authLogin({ username, password })
    if (!result.success) {
      showError({
        title: t('auth.signUpAlmostThere'),
        message: t('auth.signUpAutoLoginFailed'),
      })
      navigate('/login')
      return
    }
    queryClient.invalidateQueries(['userProfile'])
    const pendingInvite = getPendingInvite()
    navigate(pendingInvite ? joinCirclePath(pendingInvite) : '/circle-setup', {
      replace: true,
    })
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const response = await signUp(username, password, displayName, email)
      if (response.status === 201) {
        await handleLogin()
      } else if (response.status === 403) {
        showError({
          title: t('auth.signUp'),
          message: t('auth.signUpDisabled'),
        })
      } else {
        const result = await response.json()
        showError({
          title: t('auth.signUp'),
          message: result.error || t('auth.signUpFailedDefault'),
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearError = name =>
    setErrors(current => ({ ...current, [name]: null }))

  return (
    <AuthShell
      title={t('auth.createAccountTitle')}
      subtitle={
        getPendingInvite()
          ? t('auth.createAccountInviteSubtitle')
          : t('auth.createAccountSubtitle')
      }
      footer={<LegalLinks />}
      logoSize={0}
    >
      <form className='auth-form' onSubmit={handleSubmit}>
        <AuthTextField
          label={t('auth.displayName')}
          id='displayName'
          name='displayName'
          autoComplete='name'
          placeholder={t('auth.displayNamePlaceholder')}
          autoFocus
          value={displayName}
          error={errors.displayName}
          onChange={event => {
            clearError('displayName')
            setDisplayName(event.target.value)
          }}
        />
        <AuthTextField
          label={t('auth.username')}
          id='username'
          name='username'
          autoComplete='username'
          placeholder={t('auth.usernamePlaceholder')}
          value={username}
          error={errors.username}
          onChange={event => {
            clearError('username')
            setUsername(event.target.value.trim())
          }}
        />
        <AuthTextField
          label={t('auth.email')}
          id='email'
          name='email'
          type='email'
          autoComplete='email'
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          error={errors.email}
          onChange={event => {
            clearError('email')
            setEmail(event.target.value.trim())
          }}
        />
        <AuthPasswordField
          id='password'
          name='password'
          autoComplete='new-password'
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          error={errors.password}
          helper={t('auth.validation.passwordLength')}
          onChange={event => {
            clearError('password')
            setPassword(event.target.value)
          }}
        />
        <AuthSubmitButton loading={isSubmitting}>
          {t('auth.signUp')}
        </AuthSubmitButton>
        <p className='auth-copy'>{t('auth.termsAgreement')}</p>
      </form>
      <p className='auth-copy auth-copy--spaced'>
        {t('auth.alreadyHaveAccount')}{' '}
        <button
          className='auth-link'
          type='button'
          onClick={() => navigate('/login')}
        >
          {t('auth.signIn')}
        </button>
      </p>
    </AuthShell>
  )
}

export default SignupView

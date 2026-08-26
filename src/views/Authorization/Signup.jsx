import { Box, Link, Typography } from '@mui/joy'
import { useQueryClient } from '@tanstack/react-query'
import React from 'react'
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
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const Navigate = useNavigate()
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [usernameError, setUsernameError] = React.useState('')
  const [passwordError, setPasswordError] = React.useState('')
  const [emailError, setEmailError] = React.useState('')
  const [displayNameError, setDisplayNameError] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { showError } = useNotification()
  const { login: authLogin } = useAuth()

  // Sign-in goes through the auth context, not a bare fetch: it stores the
  // refresh token and updates the provider's own state, so the rest of the app
  // sees the new session without a reload.
  const handleLogin = async (username, password) => {
    const result = await authLogin({ username, password })
    if (!result.success) {
      showError({
        title: t('auth.signUpAlmostThere'),
        message: t('auth.signUpAutoLoginFailed'),
      })
      Navigate('/login')
      return
    }

    // Invalidate user profile queries to ensure fresh data
    queryClient.invalidateQueries(['userProfile'])

    // Someone who signed up from a circle invite is joining an existing
    // circle, so sending them through "name your circle" is both a dead
    // end for the invite and the wrong question.
    const pendingInvite = getPendingInvite()
    if (pendingInvite) {
      Navigate(joinCirclePath(pendingInvite), { replace: true })
      return
    }

    // The "how did you hear about us" step (/heard-about) is
    // temporarily skipped; new accounts go straight to circle setup.
    // Re-enable by navigating to '/heard-about' again — that view
    // already forwards to '/circle-setup' when done.
    Navigate('/circle-setup', { replace: true })
  }

  const handleSignUpValidation = () => {
    // Reset errors before validation
    setUsernameError(null)
    setPasswordError(null)
    setDisplayNameError(null)
    setEmailError(null)

    let isValid = true

    if (!username.trim()) {
      setUsernameError(t('auth.validation.usernameRequired'))
      isValid = false
    }
    if (username.length < 4) {
      setUsernameError(t('auth.validation.usernameMinLength'))
      isValid = false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('auth.validation.emailInvalid'))
      isValid = false
    }

    if (password.length < 8) {
      setPasswordError(t('auth.validation.passwordLength'))
      isValid = false
    }

    if (password.length > 64) {
      setPasswordError(t('auth.validation.passwordLength'))
      isValid = false
    }

    if (!displayName.trim()) {
      setDisplayNameError(t('auth.validation.displayNameRequired'))
      isValid = false
    }

    // display name should only contain letters and spaces and numbers:
    if (!/^[a-zA-Z0-9 ]+$/.test(displayName)) {
      setDisplayNameError(t('auth.validation.displayNameInvalid'))
      isValid = false
    }

    // username should only contain lowercase letters, numbers, dot and dash:
    if (!/^[a-z0-9.-]+$/.test(username)) {
      setUsernameError(t('auth.validation.usernameInvalid'))
      isValid = false
    }

    return isValid
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!handleSignUpValidation()) {
      return
    }
    setIsSubmitting(true)
    signUp(username, password, displayName, email)
      .then(response => {
        if (response.status === 201) {
          handleLogin(username, password)
        } else if (response.status === 403) {
          showError({
            title: t('auth.signUp'),
            message: t('auth.signUpDisabled'),
          })
        } else {
          console.log('Signup failed')
          response.json().then(res => {
            showError({
              title: t('auth.signUp'),
              message: res.error || t('auth.signUpFailedDefault'),
            })
          })
        }
      })
      .finally(() => setIsSubmitting(false))
  }

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
      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <AuthTextField
          label={t('auth.displayName')}
          id='displayName'
          name='displayName'
          autoComplete='name'
          placeholder={t('auth.displayNamePlaceholder')}
          autoFocus
          value={displayName}
          error={displayNameError}
          onChange={e => {
            setDisplayNameError(null)
            setDisplayName(e.target.value)
          }}
        />

        <AuthTextField
          label={t('auth.username')}
          id='username'
          name='username'
          autoComplete='username'
          placeholder={t('auth.usernamePlaceholder')}
          value={username}
          error={usernameError}
          onChange={e => {
            setUsernameError(null)
            setUsername(e.target.value.trim())
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
          error={emailError}
          onChange={e => {
            setEmailError(null)
            setEmail(e.target.value.trim())
          }}
        />

        <AuthPasswordField
          id='password'
          name='password'
          autoComplete='new-password'
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          error={passwordError}
          helper={t('auth.validation.passwordLength')}
          onChange={e => {
            setPasswordError(null)
            setPassword(e.target.value)
          }}
        />

        <AuthSubmitButton loading={isSubmitting} sx={{ mt: 1 }}>
          {t('auth.signUp')}
        </AuthSubmitButton>

        <Typography
          level='body-xs'
          sx={{ textAlign: 'center', color: 'text.secondary' }}
        >
          {t('auth.termsAgreement')}
        </Typography>
      </Box>

      <Typography
        level='body-sm'
        sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}
      >
        {t('auth.alreadyHaveAccount')}{' '}
        <Link
          component='button'
          type='button'
          level='body-sm'
          fontWeight={600}
          underline='hover'
          onClick={() => Navigate('/login')}
        >
          {t('auth.signIn')}
        </Link>
      </Typography>
    </AuthShell>
  )
}

export default SignupView

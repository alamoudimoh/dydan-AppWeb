import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { Device } from '@capacitor/device'
// import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { SettingsOutlined } from '@mui/icons-material'
import AppleIcon from '@mui/icons-material/Apple'
import GoogleIcon from '@mui/icons-material/Google'
import { Avatar, Box, Button, IconButton, Link, Typography } from '@mui/joy'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoginSocialGoogle } from 'reactjs-social-login'

import { GOOGLE_CLIENT_ID, REDIRECT_URL } from '../../Config'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useResource } from '../../queries/ResourceQueries'
import { useUserProfile } from '../../queries/UserQueries.jsx'
import { useNotification } from '../../service/NotificationProvider'
import { apiClient } from '../../utils/ApiClient'
import { getPendingInvite } from '../../utils/PendingInvite'
import {
  clearSessionExpired,
  consumeReturnPath,
  wasSessionExpired,
} from '../../utils/ReturnPath'
import { saveTokens } from '../../utils/TokenStorage'
import { buildChildUsername, getUserDisplayInfo } from '../../utils/UserHelpers'
import {
  AuthDivider,
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
  LegalLinks,
  SocialButton,
} from './AuthFields'
import AuthShell from './AuthShell'
import { authButtonSx } from './authStyles'
import MFAVerificationModal from './MFAVerificationModal'

const SegmentedControl = ({ onChange, options, value }) => (
  <Box
    role='tablist'
    sx={{
      display: 'flex',
      p: 0.5,
      gap: 0.5,
      borderRadius: '12px',
      bgcolor: 'neutral.softBg',
      mb: 2.5,
    }}
  >
    {options.map(option => {
      const selected = option.value === value
      return (
        <Box
          key={option.value}
          component='button'
          type='button'
          role='tab'
          aria-selected={selected}
          onClick={() => onChange(option.value)}
          sx={{
            flex: 1,
            border: 'none',
            cursor: 'pointer',
            borderRadius: '9px',
            py: 1,
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            fontWeight: 600,
            color: selected ? 'text.primary' : 'text.secondary',
            bgcolor: selected ? 'background.surface' : 'transparent',
            boxShadow: selected ? 'xs' : 'none',
            transition: 'background-color 180ms ease, color 180ms ease',
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.500',
              outlineOffset: '2px',
            },
          }}
        >
          {option.label}
        </Box>
      )
    })}
  </Box>
)

const LoginView = () => {
  // Use React Query client directly to invalidate the user profile query
  const { t } = useTranslation('common')
  const queryClient = useQueryClient()
  const { data: userProfile } = useUserProfile()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mfaModalOpen, setMfaModalOpen] = useState(false)
  const [mfaSessionToken, setMfaSessionToken] = useState('')
  const [isAppleSignInSupported, setIsAppleSignInSupported] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Child login state
  const [loginType, setLoginType] = useState('primary')
  const [parentUsername, setParentUsername] = useState('')
  const [childName, setChildName] = useState('')

  // Clear fields when switching login modes
  const handleLoginModeChange = newValue => {
    setLoginType(newValue)
    setUsername('')
    setParentUsername('')
    setChildName('')
    setPassword('')
  }
  const { data: resource } = useResource()
  const { showError } = useNotification()
  const { isAuthenticated, login: authLogin, user } = useAuth()
  const Navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionExpired =
    searchParams.get('session') === 'expired' || wasSessionExpired()

  useEffect(() => {
    if (!sessionExpired) return
    clearSessionExpired()
  }, [sessionExpired])

  const goAfterAuth = () => Navigate(consumeReturnPath('/chores'))
  useEffect(() => {
    const initializeSocialLogin = async () => {
      await SocialLogin.initialize({
        google: {
          webClientId: import.meta.env.VITE_APP_GOOGLE_CLIENT_ID,
          iOSClientId: import.meta.env.VITE_APP_IOS_CLIENT_ID,
          mode: 'online', // replaces grantOfflineAccess
        },
      })

      // Check if Apple Sign In is supported (iOS 13+)
      if (Capacitor.isNativePlatform()) {
        try {
          const deviceInfo = await Device.getInfo()
          if (deviceInfo.platform === 'ios') {
            const majorVersion = parseInt(deviceInfo.osVersion.split('.')[0])
            setIsAppleSignInSupported(majorVersion >= 13)
          }
        } catch (error) {
          console.log(
            'Could not determine device info for Apple Sign In support',
          )
        }
      }
    }
    initializeSocialLogin()
  }, [])
  useEffect(() => {
    if (isAuthenticated && user) {
      goAfterAuth()
    }
  }, [isAuthenticated, user, Navigate])
  const handleSubmit = async e => {
    e.preventDefault()

    // Validation for child login
    if (loginType === 'sub') {
      if (!parentUsername.trim()) {
        showError({
          title: t('auth.validationError'),
          message: t('auth.primaryUsernameRequired'),
        })
        return
      }
      if (!childName.trim()) {
        showError({
          title: t('auth.validationError'),
          message: t('auth.subAccountNameRequired'),
        })
        return
      }
    } else {
      if (!username.trim()) {
        showError({
          title: t('auth.validationError'),
          message: t('auth.usernameRequired'),
        })
        return
      }
    }

    if (!password) {
      showError({
        title: t('auth.validationError'),
        message: t('auth.passwordRequired'),
      })
      return
    }

    // Determine the actual username to send
    const actualUsername =
      loginType === 'sub'
        ? buildChildUsername(parentUsername, childName)
        : username

    setIsSubmitting(true)
    let result
    try {
      result = await authLogin({ username: actualUsername, password })
    } catch (error) {
      showError({
        title: t('auth.loginFailed'),
        message: error?.message || t('auth.loginErrorDefault'),
      })
      return
    } finally {
      setIsSubmitting(false)
    }

    if (result.success) {
      if (result.data?.mfaRequired) {
        setMfaSessionToken(result.data.sessionToken)
        setMfaModalOpen(true)
        return
      }

      // Refetch user profile after successful login
      queryClient.refetchQueries(['userProfile'])

      goAfterAuth()
    } else {
      showError({
        title: t('auth.loginFailed'),
        message: result.error || t('auth.loginErrorDefault'),
      })
    }
  }

  const loggedWithProvider = async function (provider, data) {
    const getAccessToken = data => {
      if (data['access_token']) {
        return data['access_token']
      } else if (data['accessToken']) {
        return data['accessToken']['token']
      } else if (data['response'] && data['response']['id_token']) {
        return data['response']['id_token']
      } else if (data['id_token']) {
        return data['id_token']
      }
    }

    try {
      const response = await apiClient.post(
        `/auth/${provider}/callback`,
        JSON.stringify({
          provider: provider,
          token: getAccessToken(data),
          data: data,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (response.ok) {
        const responseData = await response.json()

        // Check if MFA is required for OAuth login
        if (responseData.mfaRequired) {
          setMfaSessionToken(responseData.sessionToken)
          setMfaModalOpen(true)
          return
        }

        // Use new auth system to handle token storage
        if (responseData.token || responseData.access_token) {
          const token = responseData.token || responseData.access_token
          const expiry = responseData.expire || responseData.access_token_expiry

          // Save all tokens including refresh tokens
          await saveTokens({
            accessToken: token,
            accessTokenExpiry: expiry,
            refreshToken: responseData.refresh_token,
            refreshTokenExpiry: responseData.refresh_token_expiry,
          })

          // Refetch user profile after successful OAuth login
          queryClient.invalidateQueries(['userProfile'])

          goAfterAuth()
        }
      } else {
        const providerName = provider === 'apple' ? 'Apple' : 'Google'
        showError({
          title: t('auth.providerLoginFailed', { provider: providerName }),
          message: t('auth.providerLoginFailedMessage', {
            provider: providerName,
          }),
        })
      }
    } catch (error) {
      const providerName = provider === 'apple' ? 'Apple' : 'Google'
      showError({
        title: t('auth.providerLoginError', { provider: providerName }),
        message: t('auth.networkError'),
      })
    }
  }
  const getUserProfileAndNavigateToHome = () => {
    // Refetch user profile after login using React Query
    queryClient.invalidateQueries(['userProfile']).then(() => {
      Navigate(consumeReturnPath('/chores'))
    })
  }

  const handleMFASuccess = async data => {
    // Save all tokens including refresh tokens
    await saveTokens({
      accessToken: data.token,
      accessTokenExpiry: data.expire,
      refreshToken: data.refresh_token,
      refreshTokenExpiry: data.refresh_token_expiry,
    })

    setMfaModalOpen(false)
    setMfaSessionToken('')

    // Refetch user profile after MFA success
    queryClient.invalidateQueries(['userProfile'])

    goAfterAuth()
  }

  const handleMFAError = errorMessage => {
    showError({
      title: t('auth.mfaFailed'),
      message: errorMessage,
    })
  }

  const handleMFAClose = () => {
    setMfaModalOpen(false)
    setMfaSessionToken('')
  }

  const handleForgotPassword = () => {
    Navigate('/forgot-password')
  }
  // Cryptographically strong fallback state for servers that predate the
  // hardened /auth/oauth2/start endpoint (which issues its own state).
  const generateRandomState = () => {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    const randomState = Array.from(bytes, b =>
      b.toString(16).padStart(2, '0'),
    ).join('')
    localStorage.setItem('authState', randomState)

    return randomState
  }

  const startOAuthTransaction = async redirectUri => {
    // Ask the server to mint a single-use state bound to a PKCE S256
    // verifier. Falls back to a local crypto-random state when talking to an
    // older server that does not implement the start endpoint.
    try {
      await apiClient.init()
      const baseURL = apiClient.getApiURL()
      const response = await fetch(`${baseURL}/auth/oauth2/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_uri: redirectUri }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data?.state && data?.code_challenge) {
          localStorage.setItem('authState', data.state)
          return {
            state: data.state,
            codeChallenge: data.code_challenge,
            codeChallengeMethod: data.code_challenge_method || 'S256',
          }
        }
      }
    } catch (error) {
      console.warn(
        'Server-side OAuth state unavailable, using local fallback',
        error,
      )
    }
    return { state: generateRandomState() }
  }

  const handleAuthentikLogin = async () => {
    const authentikAuthorizeUrl = resource?.identity_provider?.auth_url

    if (Capacitor.isNativePlatform()) {
      const redirectUri = 'donetick://auth/oauth2'
      const txn = await startOAuthTransaction(redirectUri)
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: resource?.identity_provider?.client_id,
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        state: txn.state,
      })
      if (txn.codeChallenge) {
        params.set('code_challenge', txn.codeChallenge)
        params.set('code_challenge_method', txn.codeChallengeMethod)
      }

      const authUrl = `${authentikAuthorizeUrl}?${params.toString()}`

      try {
        // Open OAuth flow in system browser
        await Browser.open({ url: authUrl })

        // Note: The OAuth callback will be handled by deep link handling
        // You'll need to implement deep link handling to catch the redirect
        // and extract the authorization code
      } catch (error) {
        console.error('Failed to open OAuth browser:', error)
        showError({
          title: t('auth.oauthError'),
          message: t('auth.oauthBrowserFailed'),
        })
      }
    } else {
      // For web platforms, use the current approach
      const redirectUri = `${window.location.origin}/auth/oauth2`
      const txn = await startOAuthTransaction(redirectUri)
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: resource?.identity_provider?.client_id,
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        state: txn.state,
      })
      if (txn.codeChallenge) {
        params.set('code_challenge', txn.codeChallenge)
        params.set('code_challenge_method', txn.codeChallengeMethod)
      }

      window.location.href = `${authentikAuthorizeUrl}?${params.toString()}`
    }
  }

  const displayName = userProfile?.displayName || userProfile?.username
  const showSocialLogin = import.meta.env.VITE_IS_SELF_HOSTED !== 'true'
  const hasSocialOptions =
    showSocialLogin || Boolean(resource?.identity_provider?.client_id)

  return (
    <AuthShell
      title={userProfile ? t('auth.welcomeBack') : t('auth.signIn')}
      subtitle={
        sessionExpired
          ? t('auth.sessionExpiredSubtitle')
          : getPendingInvite()
            ? t('auth.pendingInviteSubtitle')
            : userProfile
              ? t('auth.returningUserSubtitle')
              : t('auth.signInSubtitle')
      }
      logoSize={0}
      footer={<LegalLinks />}
      action={
        Capacitor.isNativePlatform() ? (
          <IconButton
            variant='plain'
            color='neutral'
            aria-label={t('auth.serverSettings')}
            onClick={() => Navigate('/login/settings')}
          >
            <SettingsOutlined />
          </IconButton>
        ) : null
      }
    >
      {userProfile ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            src={userProfile?.image}
            alt={displayName}
            sx={{ width: 88, height: 88 }}
          />
          <Box sx={{ textAlign: 'center' }}>
            <Typography level='title-md'>{displayName}</Typography>
            {getUserDisplayInfo(userProfile).userType === 'child' && (
              <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                {t('auth.subAccount')}
              </Typography>
            )}
          </Box>

          <Button
            fullWidth
            size='lg'
            sx={{ ...authButtonSx, mt: 1 }}
            onClick={getUserProfileAndNavigateToHome}
          >
            {t('auth.continueAs', { name: displayName })}
          </Button>
          <Button
            fullWidth
            size='lg'
            variant='plain'
            color='neutral'
            sx={authButtonSx}
            onClick={() => apiClient.handleLogout()}
          >
            {t('auth.useDifferentAccount')}
          </Button>
        </Box>
      ) : (
        <Box
          component='form'
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column' }}
        >
          <SegmentedControl
            value={loginType}
            onChange={handleLoginModeChange}
            options={[
              { value: 'primary', label: t('auth.primaryAccount') },
              { value: 'sub', label: t('auth.subAccount') },
            ]}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loginType === 'primary' ? (
              <AuthTextField
                label={t('auth.username')}
                id='username'
                name='username'
                autoComplete='username'
                placeholder={t('auth.usernamePlaceholder')}
                autoFocus
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            ) : (
              <>
                <AuthTextField
                  label={t('auth.primaryUsername')}
                  id='parentUsername'
                  name='parentUsername'
                  autoComplete='username'
                  placeholder={t('auth.primaryUsernamePlaceholder')}
                  autoFocus
                  value={parentUsername}
                  onChange={e => setParentUsername(e.target.value)}
                />
                <AuthTextField
                  label={t('auth.subAccountName')}
                  id='childName'
                  name='childName'
                  placeholder={t('auth.subAccountNamePlaceholder')}
                  value={childName}
                  onChange={e => setChildName(e.target.value)}
                />
              </>
            )}

            <Box>
              <AuthPasswordField
                id='password'
                name='password'
                autoComplete='current-password'
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Link
                  component='button'
                  type='button'
                  level='body-sm'
                  underline='hover'
                  onClick={handleForgotPassword}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </Box>
            </Box>
          </Box>

          <AuthSubmitButton loading={isSubmitting} sx={{ mt: 3 }}>
            {loginType === 'sub'
              ? t('auth.signInAsSubAccount')
              : t('auth.signIn')}
          </AuthSubmitButton>
        </Box>
      )}

      {hasSocialOptions && (
        <AuthDivider>{t('auth.orContinueWith')}</AuthDivider>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {showSocialLogin &&
          !Capacitor.isNativePlatform() &&
          GOOGLE_CLIENT_ID && (
            <LoginSocialGoogle
              client_id={GOOGLE_CLIENT_ID}
              redirect_uri={REDIRECT_URL}
              scope='openid profile email'
              discoveryDocs='claims_supported'
              access_type='online'
              isOnlyGetToken={true}
              onResolve={({ data, provider }) => {
                loggedWithProvider(provider, data)
              }}
              onReject={() => {
                showError({
                  title: t('auth.providerLoginFailed', { provider: 'Google' }),
                  message: t('auth.providerLoginFailedMessage', {
                    provider: 'Google',
                  }),
                })
              }}
            >
              <SocialButton icon={<GoogleIcon />}>Google</SocialButton>
            </LoginSocialGoogle>
          )}

        {showSocialLogin && Capacitor.isNativePlatform() && (
          <>
            <SocialButton
              icon={<GoogleIcon />}
              onClick={async () => {
                try {
                  const user = await SocialLogin.login({
                    provider: 'google',
                    options: { scopes: ['profile', 'email', 'openid'] },
                  })
                  console.log('Google user', user)
                  loggedWithProvider('google', user.result)
                } catch (error) {
                  console.error('Google login error:', error)
                  showError({
                    title: t('auth.providerLoginFailed', {
                      provider: 'Google',
                    }),
                    message: t('auth.providerLoginFailedMessageDetail', {
                      provider: 'Google',
                      detail: error?.message ? `: ${error.message}` : '',
                    }),
                  })
                }
              }}
            >
              Google
            </SocialButton>

            {isAppleSignInSupported && (
              <SocialButton
                icon={<AppleIcon />}
                onClick={() => {
                  SocialLogin.login({
                    provider: 'apple',
                    options: {
                      scopes: ['email', 'name'],
                      state: 'random_string',
                    },
                  })
                    .then(user => {
                      console.log('Apple user', user)
                      loggedWithProvider('apple', user)
                    })
                    .catch(error => {
                      console.error('Apple login error:', error)
                      showError({
                        title: t('auth.providerLoginFailed', {
                          provider: 'Apple',
                        }),
                        message: t('auth.providerLoginFailedMessage', {
                          provider: 'Apple',
                        }),
                      })
                    })
                }}
              >
                Apple
              </SocialButton>
            )}
          </>
        )}

        {resource?.identity_provider?.client_id && (
          <SocialButton onClick={handleAuthentikLogin}>
            {resource?.identity_provider?.name}
          </SocialButton>
        )}
      </Box>

      {!userProfile && !resource?.is_user_creation_disabled && (
        <Typography
          level='body-sm'
          sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}
        >
          {t('auth.noAccount')}{' '}
          <Link
            component='button'
            type='button'
            level='body-sm'
            fontWeight={600}
            underline='hover'
            onClick={() => Navigate('/signup')}
          >
            {t('auth.createOne')}
          </Link>
        </Typography>
      )}

      <MFAVerificationModal
        open={mfaModalOpen}
        onClose={handleMFAClose}
        sessionToken={mfaSessionToken}
        onSuccess={handleMFASuccess}
        onError={handleMFAError}
      />
    </AuthShell>
  )
}

export default LoginView

import { Capacitor } from '@capacitor/core'
import { Box, Button, LinearProgress } from '@mui/joy'
import { useEffect, useState } from 'react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { useUserProfile } from '../../queries/UserQueries'
import { apiClient } from '../../utils/ApiClient'
import { GetUserProfile } from '../../utils/Fetcher'
import { endOAuthExchange } from '../../utils/OAuthExchangeState'
import { consumeReturnPath } from '../../utils/ReturnPath'
import AuthShell from './AuthShell'
import { authButtonSx } from './authStyles'
import MFAVerificationModal from './MFAVerificationModal'

const AuthenticationLoading = () => {
  const { t } = useTranslation('common')
  const { establishSession } = useAuth()
  const { refetch: refetchUserProfile } = useUserProfile()
  const Navigate = useNavigate()
  const hasCalledHandleOAuth2 = useRef(false)
  const [message, setMessage] = useState(t('auth.signingIn'))
  const [subMessage, setSubMessage] = useState(t('auth.signingInSubtitle'))
  const [status, setStatus] = useState('pending')
  const [mfaModalOpen, setMfaModalOpen] = useState(false)
  const [mfaSessionToken, setMfaSessionToken] = useState('')
  const { provider } = useParams()

  useEffect(() => {
    if (provider === 'oauth2' && !hasCalledHandleOAuth2.current) {
      hasCalledHandleOAuth2.current = true
      // Release the guard once the exchange settles, so a stuck flag can never
      // suppress a genuine session expiry later on.
      handleOAuth2().finally(endOAuthExchange)
    } else if (provider !== 'oauth2') {
      setMessage(t('auth.unknownProvider'))
      setSubMessage(t('auth.contactSupport'))
      setStatus('error')
    }
    return endOAuthExchange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

  const getUserProfileAndNavigateToHome = () => {
    GetUserProfile().then(response => {
      response.json().then(() => {
        refetchUserProfile().then(() => {
          Navigate(consumeReturnPath('/chores'))
        })
      })
    })
  }

  const handleMFASuccess = async data => {
    await establishSession(data)

    setMfaModalOpen(false)
    setMfaSessionToken('')

    getUserProfileAndNavigateToHome()
  }

  const handleMFAClose = () => {
    setMfaModalOpen(false)
    setMfaSessionToken('')
    setMessage(t('auth.signInFailed'))
    setSubMessage(t('auth.mfaCancelled'))
    setStatus('error')
  }

  const handleOAuth2 = async () => {
    // get provider from params:
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const returnedState = urlParams.get('state')
    // Authorization codes are bearer credentials. Remove them from history,
    // referrers, diagnostics, and crash-report URLs before any network work.
    window.history.replaceState(null, '', window.location.pathname)

    const storedState = localStorage.getItem('authState')
    localStorage.removeItem('authState')

    if (returnedState !== storedState) {
      setMessage(t('auth.signInFailed'))
      setSubMessage(t('auth.signInRequestUnverified'))
      setStatus('error')
      return
    }

    if (code) {
      await apiClient.init()
      const baseURL = apiClient.getApiURL()
      const redirectURI = Capacitor.isNativePlatform()
        ? 'donetick://auth/oauth2'
        : `${window.location.origin}/auth/oauth2`
      try {
        const response = await fetch(`${baseURL}/auth/oauth2/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state: returnedState,
            redirect_uri: redirectURI,
          }),
        })

        if (!response.ok) {
          console.error('Authentication failed')
          setMessage(t('auth.signInFailed'))
          setSubMessage(t('auth.tryAgain'))
          setStatus('error')
          return
        }

        const data = await response.json()

        if (data.mfaRequired) {
          if (!data.sessionToken) {
            setMessage(t('auth.signInFailed'))
            setSubMessage(t('auth.mfaSessionMissing'))
            setStatus('error')
            return
          }

          setMfaSessionToken(data.sessionToken)
          setMfaModalOpen(true)
          setMessage(t('auth.mfaTitle'))
          setSubMessage(t('auth.verifyLogin'))
          return
        }

        if (!data.token && !data.access_token) {
          setMessage(t('auth.signInFailed'))
          setSubMessage(t('auth.noTokenReturned'))
          setStatus('error')
          return
        }

        await establishSession(data)

        getUserProfileAndNavigateToHome()
      } catch (error) {
        console.error('Authentication request failed', error)
        setMessage(t('auth.signInFailed'))
        setSubMessage(t('auth.tryAgain'))
        setStatus('error')
      }
    }
  }

  return (
    <AuthShell title={message} subtitle={subMessage}>
      <Box
        role='status'
        aria-live='polite'
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {status === 'pending' && (
          <LinearProgress
            sx={{ width: '60%', '--LinearProgress-radius': '999px' }}
          />
        )}

        {status === 'error' && (
          <Button
            component={Link}
            to='/login'
            size='lg'
            variant='soft'
            color='neutral'
            fullWidth
            sx={authButtonSx}
          >
            {t('auth.backToSignIn')}
          </Button>
        )}
      </Box>

      <MFAVerificationModal
        open={mfaModalOpen}
        onClose={handleMFAClose}
        sessionToken={mfaSessionToken}
        onSuccess={handleMFASuccess}
        onError={() => {
          setMessage(t('auth.signInFailed'))
          setSubMessage(t('auth.mfaFailedRetry'))
        }}
      />
    </AuthShell>
  )
}

export default AuthenticationLoading

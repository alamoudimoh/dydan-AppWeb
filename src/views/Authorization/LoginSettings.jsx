import { Preferences } from '@capacitor/preferences'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import WifiIcon from '@mui/icons-material/Wifi'
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/joy'
import { useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { API_URL } from '../../Config'
import { useImpersonateUser } from '../../contexts/ImpersonateUserContext'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useResource } from '../../queries/ResourceQueries'
import { clearWidgetData } from '../../service/WidgetService'
import { apiClient } from '../../utils/ApiClient'
import { logout } from '../../utils/Fetcher'
import { offlineDB } from '../../utils/OfflineDB'
import { AuthSubmitButton, AuthTextField } from './AuthFields'
import AuthShell from './AuthShell'
import { authButtonSx } from './authStyles'

const CONNECTION_TIMEOUT_MS = 8000

const LoginSettings = () => {
  const { t } = useTranslation('common')
  const Navigate = useNavigate()
  const queryClient = useQueryClient()
  const { stopImpersonation } = useImpersonateUser()
  const { clearAuth } = useAuth()
  const { refetch: refetchResource } = useResource()
  const [serverURL, setServerURL] = React.useState('')
  const [status, setStatus] = React.useState('idle') // 'idle' | 'testing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = React.useState('')

  React.useEffect(() => {
    Preferences.get({ key: 'customServerUrl' }).then(result => {
      setServerURL(result.value || API_URL)
    })
  }, [])

  const isValidURL = url => {
    return /^(http|https):\/\/[^ "]+$/.test(url.trim())
  }

  const testConnection = async url => {
    const testURL = url.replace(/\/+$/, '') + '/api/v1/resource'
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      CONNECTION_TIMEOUT_MS,
    )

    try {
      const response = await fetch(testURL, {
        method: 'GET',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      // Any HTTP response (even 401/404) means the server is reachable
      if (response.status < 500) {
        return { ok: true }
      }
      if (response.status === 503) {
        return {
          ok: false,
          message: t('auth.connectionErrors.startingUp'),
        }
      }
      return {
        ok: false,
        message: t('auth.connectionErrors.serverError', {
          status: response.status,
        }),
      }
    } catch (err) {
      clearTimeout(timeoutId)

      if (err.name === 'AbortError') {
        return {
          ok: false,
          message: t('auth.connectionErrors.timeout', {
            seconds: CONNECTION_TIMEOUT_MS / 1000,
          }),
        }
      }

      // Try no-cors to distinguish CORS misconfiguration from server being down
      const noCorsController = new AbortController()
      const noCorsTimeout = setTimeout(() => noCorsController.abort(), 3000)
      try {
        const probe = await fetch(testURL, {
          method: 'GET',
          mode: 'no-cors',
          signal: noCorsController.signal,
        })
        clearTimeout(noCorsTimeout)
        if (probe.type === 'opaque') {
          // Server responded but CORS headers blocked the real request
          return {
            ok: false,
            message: t('auth.connectionErrors.cors'),
          }
        }
        // Opaque is the only expected type for no-cors success; anything else is odd
      } catch (probeErr) {
        clearTimeout(noCorsTimeout)
        if (probeErr.name !== 'AbortError') {
          // Both normal and no-cors fetch threw immediately → port refused
          const msg = probeErr.message?.toLowerCase() ?? ''
          if (
            msg.includes('getaddrinfo') ||
            msg.includes('name not resolved') ||
            msg.includes('err_name')
          ) {
            return {
              ok: false,
              message: t('auth.connectionErrors.dns'),
            }
          }
          return {
            ok: false,
            message: t('auth.connectionErrors.refused'),
          }
        }
        // no-cors also timed out → server/host truly unreachable
        return {
          ok: false,
          message: t('auth.connectionErrors.unreachable'),
        }
      }

      // Fallback (should rarely hit)
      return {
        ok: false,
        message: t('auth.connectionErrors.unreachable'),
      }
    }
  }

  const switchServer = async targetURL => {
    try {
      await logout()
    } catch {
      // The old server may be unavailable; local credentials still must go.
    }
    await clearAuth()
    stopImpersonation()
    queryClient.clear()
    await clearWidgetData()
    try {
      await offlineDB.clearAll()
    } catch (e) {
      console.error('Error clearing offline data on server change', e)
    }
    await Preferences.set({ key: 'customServerUrl', value: targetURL })
    await apiClient.init(true)
    refetchResource()
  }

  const handleSave = async e => {
    e.preventDefault()
    const trimmedURL = serverURL.trim()

    if (trimmedURL === '') {
      try {
        await switchServer(API_URL)
        Navigate('/login')
      } catch {
        setStatus('error')
        setErrorMessage(t('auth.clearSessionFailed'))
      }
      return
    }

    if (!isValidURL(trimmedURL)) {
      setStatus('error')
      setErrorMessage(t('auth.invalidURL'))
      return
    }

    setStatus('testing')
    setErrorMessage('')

    const result = await testConnection(trimmedURL)

    if (!result.ok) {
      setStatus('error')
      setErrorMessage(result.message)
      return
    }

    // Never carry credentials across server origins. Revoke against the old
    // origin first, then clear before persisting or contacting the new origin.
    try {
      await switchServer(trimmedURL)
    } catch {
      setStatus('error')
      setErrorMessage(t('auth.clearSessionFailed'))
      return
    }
    setStatus('success')

    setTimeout(() => {
      Navigate('/login')
    }, 1200)
  }

  const handleURLChange = e => {
    setServerURL(e.target.value)
    if (status !== 'idle') {
      setStatus('idle')
      setErrorMessage('')
    }
  }

  const isTesting = status === 'testing'

  return (
    <AuthShell
      title={t('auth.serverSettingsTitle')}
      subtitle={t('auth.serverSettingsSubtitle')}
    >
      <Box
        component='form'
        onSubmit={handleSave}
        sx={{ display: 'flex', flexDirection: 'column' }}
      >
        <AuthTextField
          label={t('auth.serverURL')}
          id='serverURL'
          name='serverURL'
          inputMode='url'
          autoCapitalize='none'
          autoCorrect='off'
          spellCheck='false'
          placeholder={t('auth.serverURLPlaceholder')}
          autoFocus
          value={serverURL}
          onChange={handleURLChange}
          disabled={isTesting}
          color={
            status === 'success'
              ? 'success'
              : status === 'error'
                ? 'danger'
                : 'neutral'
          }
          endDecorator={
            status === 'success' ? (
              <CheckCircleOutlineIcon color='success' fontSize='small' />
            ) : status === 'error' ? (
              <ErrorOutlineIcon color='error' fontSize='small' />
            ) : null
          }
          helper={t('auth.serverURLHelper')}
        />

        {status === 'error' && (
          <Alert
            color='danger'
            variant='soft'
            startDecorator={<ErrorOutlineIcon />}
            sx={theme => ({
              mt: 2,
              borderRadius: theme.radius.row,
              alignItems: 'flex-start',
            })}
          >
            {errorMessage}
          </Alert>
        )}

        {status === 'success' && (
          <Alert
            color='success'
            variant='soft'
            startDecorator={<CheckCircleOutlineIcon />}
            sx={theme => ({ mt: 2, borderRadius: theme.radius.row })}
          >
            {t('auth.connectedRedirect')}
          </Alert>
        )}

        {status === 'testing' && (
          <Alert
            color='neutral'
            variant='soft'
            startDecorator={<WifiIcon />}
            sx={theme => ({ mt: 2, borderRadius: theme.radius.row })}
          >
            {t('auth.testingConnection')}
          </Alert>
        )}

        <AuthSubmitButton
          loading={isTesting}
          disabled={status === 'success'}
          startDecorator={isTesting ? <CircularProgress size='sm' /> : null}
          sx={{ mt: 3 }}
        >
          {isTesting
            ? t('auth.testingConnectionButton')
            : t('auth.saveAndConnect')}
        </AuthSubmitButton>

        <Button
          type='button'
          fullWidth
          size='lg'
          variant='plain'
          color='neutral'
          disabled={isTesting}
          sx={{ ...authButtonSx, mt: 1 }}
          onClick={async () => {
            await switchServer(API_URL)
            Navigate('/login')
          }}
        >
          {t('auth.resetToDefaultServer')}
        </Button>
      </Box>

      <Typography
        level='body-xs'
        sx={{ mt: 2.5, textAlign: 'center', color: 'text.secondary' }}
      >
        {t('auth.serverChangeClearsData')}
      </Typography>
    </AuthShell>
  )
}

export default LoginSettings

import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import WifiIcon from '@mui/icons-material/Wifi'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
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
import { isAllowedServerURL } from '../../utils/ServerUrlValidation'
import { AuthButton, AuthSubmitButton, AuthTextField } from './AuthFields'
import AuthShell from './AuthShell'

const CONNECTION_TIMEOUT_MS = 8000

const LoginSettings = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { stopImpersonation } = useImpersonateUser()
  const { clearAuth } = useAuth()
  const { refetch: refetchResource } = useResource()
  const [serverURL, setServerURL] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    Preferences.get({ key: 'customServerUrl' }).then(result => {
      setServerURL(result.value || API_URL)
    })
  }, [])

  const testConnection = async url => {
    const testURL = `${url.replace(/\/+$/, '')}/api/v1/resource`
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
      if (response.status < 500) return { ok: true }
      return {
        ok: false,
        message:
          response.status === 503
            ? t('auth.connectionErrors.startingUp')
            : t('auth.connectionErrors.serverError', {
                status: response.status,
              }),
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        return {
          ok: false,
          message: t('auth.connectionErrors.timeout', {
            seconds: CONNECTION_TIMEOUT_MS / 1000,
          }),
        }
      }
      const probeController = new AbortController()
      const probeTimeout = setTimeout(() => probeController.abort(), 3000)
      try {
        const probe = await fetch(testURL, {
          method: 'GET',
          mode: 'no-cors',
          signal: probeController.signal,
        })
        clearTimeout(probeTimeout)
        if (probe.type === 'opaque') {
          return { ok: false, message: t('auth.connectionErrors.cors') }
        }
      } catch (probeError) {
        clearTimeout(probeTimeout)
        if (probeError.name === 'AbortError') {
          return { ok: false, message: t('auth.connectionErrors.unreachable') }
        }
        const message = probeError.message?.toLowerCase() ?? ''
        return {
          ok: false,
          message:
            message.includes('getaddrinfo') ||
            message.includes('name not resolved') ||
            message.includes('err_name')
              ? t('auth.connectionErrors.dns')
              : t('auth.connectionErrors.refused'),
        }
      }
      return { ok: false, message: t('auth.connectionErrors.unreachable') }
    }
  }

  const switchServer = async targetURL => {
    try {
      await logout()
    } catch {
      // Clearing local credentials is still mandatory when the old server is down.
    }
    await clearAuth()
    stopImpersonation()
    queryClient.clear()
    await clearWidgetData()
    try {
      await offlineDB.clearAll()
    } catch (error) {
      console.error('Error clearing offline data on server change', error)
    }
    await Preferences.set({ key: 'customServerUrl', value: targetURL })
    await apiClient.init(true)
    refetchResource()
  }

  const handleSave = async event => {
    event.preventDefault()
    const targetURL = serverURL.trim()
    if (!targetURL) {
      try {
        await switchServer(API_URL)
        navigate('/login')
      } catch {
        setStatus('error')
        setErrorMessage(t('auth.clearSessionFailed'))
      }
      return
    }
    if (!isAllowedServerURL(targetURL, Capacitor.isNativePlatform())) {
      setStatus('error')
      setErrorMessage(
        t(
          Capacitor.isNativePlatform()
            ? 'auth.httpsRequiredNative'
            : 'auth.invalidURL',
        ),
      )
      return
    }
    setStatus('testing')
    setErrorMessage('')
    const result = await testConnection(targetURL)
    if (!result.ok) {
      setStatus('error')
      setErrorMessage(result.message)
      return
    }
    try {
      await switchServer(targetURL)
      setStatus('success')
      setTimeout(() => navigate('/login'), 1200)
    } catch {
      setStatus('error')
      setErrorMessage(t('auth.clearSessionFailed'))
    }
  }

  const isTesting = status === 'testing'
  const message =
    status === 'error'
      ? errorMessage
      : status === 'success'
        ? t('auth.connectedRedirect')
        : status === 'testing'
          ? t('auth.testingConnection')
          : null
  const MessageIcon =
    status === 'error'
      ? ErrorOutlineIcon
      : status === 'success'
        ? CheckCircleOutlineIcon
        : WifiIcon

  return (
    <AuthShell
      title={t('auth.serverSettingsTitle')}
      subtitle={t('auth.serverSettingsSubtitle')}
    >
      <form className='auth-form' onSubmit={handleSave}>
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
          disabled={isTesting}
          helper={t('auth.serverURLHelper')}
          endDecorator={
            status === 'success' ? (
              <CheckCircleOutlineIcon />
            ) : status === 'error' ? (
              <ErrorOutlineIcon />
            ) : null
          }
          onChange={event => {
            setServerURL(event.target.value)
            if (status !== 'idle') {
              setStatus('idle')
              setErrorMessage('')
            }
          }}
        />
        {message && (
          <div
            className={`auth-alert auth-alert--${
              status === 'error'
                ? 'error'
                : status === 'success'
                  ? 'success'
                  : 'neutral'
            }`}
            role='status'
          >
            <MessageIcon fontSize='small' /> {message}
          </div>
        )}
        <AuthSubmitButton disabled={status === 'success'} loading={isTesting}>
          {isTesting
            ? t('auth.testingConnectionButton')
            : t('auth.saveAndConnect')}
        </AuthSubmitButton>
        <AuthButton
          disabled={isTesting}
          onClick={async () => {
            await switchServer(API_URL)
            navigate('/login')
          }}
        >
          {t('auth.resetToDefaultServer')}
        </AuthButton>
      </form>
      <p className='auth-copy auth-copy--spaced'>
        {t('auth.serverChangeClearsData')}
      </p>
    </AuthShell>
  )
}

export default LoginSettings

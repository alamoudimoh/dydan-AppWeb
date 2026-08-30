import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import ModalActions from '../../components/common/ModalActions'
import { useResponsiveModal } from '../../hooks/useResponsiveModal'
import { VerifyMFA } from '../../utils/Fetcher'

const MFAVerificationModal = ({
  onClose,
  onError,
  onSuccess,
  open,
  sessionToken,
}) => {
  const [verificationCode, setVerificationCode] = useState('')
  const [isBackupCode, setIsBackupCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslation('common')
  const { ResponsiveModal } = useResponsiveModal()

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError(t('auth.mfaCodeRequired'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await VerifyMFA(sessionToken, verificationCode)

      if (response.ok) {
        const data = await response.json()
        onSuccess(data)
      } else {
        const errorData = await response.json()
        const message = errorData.message || t('auth.mfaInvalidCode')
        setError(message)
        onError?.(message)
      }
    } catch (error) {
      // A wrong code is shown inline; a failed request is escalated to the
      // caller so it can surface a toast instead of looking like a bad code.
      const message = t('auth.mfaVerifyFailed')
      setError(message)
      onError?.(message)
      console.error('MFA verification error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setVerificationCode('')
    setIsBackupCode(false)
    setError('')
    setLoading(false)
    onClose()
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault()
      handleVerify()
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onClose={handleClose}
      size='md'
      title={t('auth.mfaTitle')}
      description={
        isBackupCode
          ? t('auth.mfaBackupCodeDescription')
          : t('auth.mfaCodeDescription')
      }
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      footer={
        <ModalActions
          secondary={{
            label: t('cancel'),
            onClick: handleClose,
            disabled: loading,
          }}
          primary={{
            label: t('auth.mfaVerifySignIn'),
            onClick: handleVerify,
            loading,
            disabled: !verificationCode.trim(),
          }}
        />
      }
    >
      <div className='auth-stack'>
        <label className='auth-field' htmlFor='mfa-code'>
          <span className='auth-field__label'>
            {isBackupCode
              ? t('auth.mfaBackupCodeLabel')
              : t('auth.mfaVerificationCodeLabel')}
          </span>
          <input
            id='mfa-code'
            className='input auth-input auth-mfa-input'
            placeholder={
              isBackupCode ? t('auth.mfaBackupCodePlaceholder') : '000000'
            }
            value={verificationCode}
            onChange={e => setVerificationCode(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={Boolean(error)}
            autoFocus
            maxLength={isBackupCode ? 50 : 6}
            inputMode={isBackupCode ? 'text' : 'numeric'}
            pattern={isBackupCode ? undefined : '[0-9]*'}
            autoComplete={isBackupCode ? 'off' : 'one-time-code'}
            style={{ letterSpacing: isBackupCode ? 'normal' : '0.4em' }}
          />
        </label>

        {error && (
          <div className='auth-alert' role='alert'>
            {error}
          </div>
        )}

        <div className='auth-copy'>
          <button
            className='auth-link'
            type='button'
            onClick={() => {
              setIsBackupCode(!isBackupCode)
              setVerificationCode('')
              setError('')
            }}
          >
            {isBackupCode
              ? t('auth.mfaUseAuthApp')
              : t('auth.mfaUseBackupCode')}
          </button>
        </div>

        {isBackupCode && (
          <p className='auth-copy'>{t('auth.mfaBackupOneTime')}</p>
        )}
      </div>
    </ResponsiveModal>
  )
}

export default MFAVerificationModal

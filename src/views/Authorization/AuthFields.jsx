import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'

export const AuthField = ({ children, error, helper, id, label }) => {
  const helperId = error || helper ? `${id}-help` : undefined

  return (
    <div className='auth-field'>
      <label className='auth-field__label' htmlFor={id}>
        {label}
      </label>
      {children(helperId)}
      {(error || helper) && (
        <span
          id={helperId}
          className={error ? 'auth-field__error' : 'auth-field__helper'}
        >
          {error || helper}
        </span>
      )}
    </div>
  )
}

export const AuthTextField = ({
  color: _color,
  endDecorator,
  error,
  helper,
  label,
  sx: _sx,
  ...inputProps
}) => (
  <AuthField id={inputProps.id} label={label} error={error} helper={helper}>
    {helperId => (
      <span className='auth-input-wrap'>
        <input
          className='input auth-input'
          aria-describedby={helperId}
          aria-invalid={Boolean(error)}
          {...inputProps}
        />
        {endDecorator && (
          <span className='auth-input__end'>{endDecorator}</span>
        )}
      </span>
    )}
  </AuthField>
)

export const AuthPasswordField = ({
  error,
  helper,
  label,
  sx: _sx,
  ...inputProps
}) => {
  const { t } = useTranslation('common')
  const [visible, setVisible] = useState(false)

  return (
    <AuthField
      id={inputProps.id}
      label={label ?? t('auth.password')}
      error={error}
      helper={helper}
    >
      {helperId => (
        <span className='auth-input-wrap'>
          <input
            className='input auth-input'
            type={visible ? 'text' : 'password'}
            aria-describedby={helperId}
            aria-invalid={Boolean(error)}
            {...inputProps}
          />
          <button
            className='auth-input__toggle'
            type='button'
            tabIndex={-1}
            aria-label={
              visible ? t('auth.hidePassword') : t('auth.showPassword')
            }
            onClick={() => setVisible(value => !value)}
          >
            {visible ? (
              <VisibilityOffOutlined fontSize='small' />
            ) : (
              <VisibilityOutlined fontSize='small' />
            )}
          </button>
        </span>
      )}
    </AuthField>
  )
}

export const AuthSubmitButton = ({
  children,
  loading,
  startDecorator,
  sx: _sx,
  ...props
}) => (
  <button className='btn btn-primary auth-submit' type='submit' {...props}>
    {startDecorator}
    {loading ? (
      <span className='auth-spinner' aria-label='Loading' />
    ) : (
      children
    )}
  </button>
)

export const SocialButton = ({ children, icon, sx: _sx, ...props }) => (
  <button className='btn btn-secondary auth-submit' type='button' {...props}>
    {icon}
    {children}
  </button>
)

export const AuthButton = ({ children, variant = 'secondary', ...props }) => (
  <button className={`btn btn-${variant} auth-submit`} type='button' {...props}>
    {children}
  </button>
)

export const AuthDivider = ({ children }) => {
  const { t } = useTranslation('common')
  return <div className='auth-divider'>{children ?? t('auth.or')}</div>
}

export const LegalLinks = () => {
  const { t } = useTranslation('common')
  return (
    <p className='auth-legal'>
      <RouterLink to='/privacy'>{t('auth.privacyPolicy')}</RouterLink>
      {' · '}
      <RouterLink to='/terms'>{t('auth.termsOfUse')}</RouterLink>
    </p>
  )
}

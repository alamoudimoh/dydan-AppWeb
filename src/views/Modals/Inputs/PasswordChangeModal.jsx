import { FormControl, FormHelperText, Input, Typography } from '@mui/joy'
import { useEffect, useState } from 'react'

import ModalActions from '../../../components/common/ModalActions'
import { useResponsiveModal } from '../../../hooks/useResponsiveModal'

/**
 * Password-change modal for the signed-in user's own account. Requires the
 * current password; the server verifies it before accepting the change.
 *
 * When `requireCurrentPassword` is false (e.g. a parent setting a child
 * account's password) the current-password step is skipped entirely.
 */
function PasswordChangeModal({
  isOpen,
  onClose,
  requireCurrentPassword = true,
}) {
  const { ResponsiveModal } = useResponsiveModal()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState(null)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false)
  const [currentTouched, setCurrentTouched] = useState(false)

  useEffect(() => {
    if (!requireCurrentPassword) return
    if (!passwordTouched || !confirmPasswordTouched) return

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
    } else if (password.length > 64) {
      setPasswordError('Password must be less than 64 characters')
    } else if (password === currentPassword && currentTouched) {
      setPasswordError('New password must be different from the current one')
    } else {
      setPasswordError(null)
    }
  }, [
    password,
    confirmPassword,
    currentPassword,
    passwordTouched,
    confirmPasswordTouched,
    currentTouched,
    requireCurrentPassword,
  ])

  const handleAction = isConfirmed =>
    onClose(
      isConfirmed && requireCurrentPassword
        ? { currentPassword, password }
        : isConfirmed
          ? password
          : null,
    )
  const canSubmit =
    passwordTouched &&
    confirmPasswordTouched &&
    password.length >= 8 &&
    password === confirmPassword &&
    passwordError == null &&
    (!requireCurrentPassword || (currentTouched && currentPassword.length > 0))

  return (
    <ResponsiveModal
      open={isOpen}
      onClose={() => handleAction(false)}
      size='sm'
      title='Change Password'
      description={
        requireCurrentPassword
          ? 'Confirm your current password and choose a new one between 8 and 64 characters.'
          : 'Choose a password between 8 and 64 characters.'
      }
      footer={
        <ModalActions
          secondary={{ label: 'Cancel', onClick: () => handleAction(false) }}
          primary={{
            label: 'Change Password',
            disabled: !canSubmit,
            onClick: () => handleAction(true),
          }}
        />
      }
    >
      <FormControl
        sx={{ mb: 2 }}
        error={currentTouched && currentPassword.length === 0}
      >
        {requireCurrentPassword && (
          <>
            <Typography level='body-sm'>Current password</Typography>
            <Input
              required
              name='currentPassword'
              type='password'
              autoComplete='current-password'
              placeholder='Enter current password'
              value={currentPassword}
              onChange={event => {
                setCurrentTouched(true)
                setCurrentPassword(event.target.value)
              }}
            />
            {currentTouched && currentPassword.length === 0 && (
              <FormHelperText>
                Enter your current password to confirm the change
              </FormHelperText>
            )}
          </>
        )}
      </FormControl>

      <FormControl sx={{ mb: 2 }}>
        <Typography level='body-sm'>New password</Typography>
        <Input
          required
          name='password'
          type='password'
          autoComplete='new-password'
          placeholder='Enter new password'
          value={password}
          onChange={event => {
            setPasswordTouched(true)
            setPassword(event.target.value)
          }}
        />
      </FormControl>

      <FormControl error={Boolean(passwordError)}>
        <Typography level='body-sm'>Confirm new password</Typography>
        <Input
          required
          name='confirmPassword'
          type='password'
          autoComplete='new-password'
          placeholder='Repeat new password'
          value={confirmPassword}
          onChange={event => {
            setConfirmPasswordTouched(true)
            setConfirmPassword(event.target.value)
          }}
        />
        {passwordError && <FormHelperText>{passwordError}</FormHelperText>}
      </FormControl>
    </ResponsiveModal>
  )
}

export default PasswordChangeModal

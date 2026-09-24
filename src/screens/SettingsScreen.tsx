/* eslint-disable max-lines -- the settings screen is a single long screen file */
import Option from '@mui/joy/Option'
import Select from '@mui/joy/Select'
import Switch from '@mui/joy/Switch'
import Tab from '@mui/joy/Tab'
import TabList from '@mui/joy/TabList'
import TabPanel from '@mui/joy/TabPanel'
import Tabs from '@mui/joy/Tabs'
import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'

import { version as appVersion } from '../../package.json'
import { AppCtx, Icon, Theme, View } from '../App'
import { useLocalization } from '../contexts/LocalizationContext'
import { useProductTheme } from '../contexts/ThemeContext'
import {
  type MFASetup,
  useAccountSettingsMutations,
  useAuthSessions,
  useMFAStatus,
  useUserCircles,
} from '../hooks/useAccountSettings'
import { KEYS } from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'
import { offlineDB } from '../utils/OfflineDB'
import { clearAllTokens } from '../utils/TokenStorage'

type Props = {
  ctx: AppCtx
  isSolo: boolean
}

/* ─── Shared building blocks ──────────── */
function Section({
  children,
  title,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <div className='mb-6'>
      {title && (
        <div className='section-label' style={{ padding: '0 0 8px' }}>
          {title}
        </div>
      )}
      <div className='card overflow-hidden'>{children}</div>
    </div>
  )
}

function Row({
  children,
  icon,
  label,
  onClick,
  sub,
}: {
  icon?: string
  label: string
  sub?: string
  children?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      className='flex items-center gap-4 px-5 py-4 border-b border-line last:border-0'
      style={{
        borderColor: 'var(--line)',
        cursor: onClick ? 'pointer' : undefined,
      }}
      onClick={onClick}
    >
      {icon && (
        <Icon
          name={icon}
          size={18}
          style={{ color: 'var(--t-muted)', flexShrink: 0 }}
        />
      )}
      <div className='flex-1 min-w-0'>
        <div className='font-medium text-primary' style={{ fontSize: 14 }}>
          {label}
        </div>
        {sub && (
          <div className='text-muted' style={{ fontSize: 12, marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
      {children && <div className='flex-shrink-0'>{children}</div>}
    </div>
  )
}

function JoyToggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <Switch
      checked={on}
      onChange={onChange}
      color={on ? 'primary' : 'neutral'}
      variant='solid'
    />
  )
}

function SelectField({
  onChange,
  options,
  value,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select
      value={value}
      onChange={(_, v) => v && onChange(v)}
      size='sm'
      variant='outlined'
      sx={{
        minWidth: 150,
        fontWeight: 600,
        bgcolor: 'var(--surface)',
        color: 'var(--t-primary)',
        border: '1px solid var(--line-strong)',
        borderRadius: 'var(--r-md)',
        fontFamily: 'var(--font-ui)',
        boxShadow: 'none',
        '--Select-focusedHighlight': 'var(--focus-ring)',
        '&:hover': {
          bgcolor: 'var(--surface-2)',
          borderColor: 'var(--line-strong)',
        },
        '&:focus-within': {
          border: '1px solid var(--focus-ring)',
          boxShadow: 'none',
        },
      }}
    >
      {options.map(o => (
        <Option key={o.value} value={o.value}>
          {o.label}
        </Option>
      ))}
    </Select>
  )
}

function TabHeader({
  action,
  desc,
  title,
}: {
  title: string
  desc: string
  action?: React.ReactNode
}) {
  return (
    <div className='flex items-start justify-between gap-3 mb-5 flex-wrap'>
      <div>
        <h2
          className='text-primary'
          style={{ fontSize: 19, fontWeight: 800, margin: 0 }}
        >
          {title}
        </h2>
        <div className='text-muted' style={{ fontSize: 13, marginTop: 3 }}>
          {desc}
        </div>
      </div>
      {action}
    </div>
  )
}

/* ─── Invite modal ────────────────────── */
function InviteModal({
  inviteCode,
  onClose,
}: {
  inviteCode: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const joinURL = `${window.location.origin}/settings?invite_code=${encodeURIComponent(inviteCode)}`
  const copy = async () => {
    await navigator.clipboard.writeText(joinURL)
    setCopied(true)
  }

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        style={{ maxWidth: 440 }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className='flex items-center justify-between px-6 pt-6 pb-4'
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <div className='font-bold text-primary' style={{ fontSize: 17 }}>
            Invite to your team
          </div>
          <button className='btn btn-ghost btn-icon' onClick={onClose}>
            <Icon name='x' size={18} />
          </button>
        </div>
        <div className='p-6'>
          <div className='flex flex-col gap-4'>
            <div
              className='text-muted'
              style={{ fontSize: 14, lineHeight: 1.6 }}
            >
              Share this real team join link. dydan does not send an email
              invitation from this screen.
            </div>
            <code
              className='p-3 rounded-lg text-primary'
              style={{ background: 'var(--surface-2)', wordBreak: 'break-all' }}
            >
              {joinURL}
            </code>
            <div
              className='p-3 rounded-lg flex items-start gap-2'
              style={{
                background: 'var(--brand-faint)',
                borderRadius: 'var(--r-md)',
              }}
            >
              <Icon
                name='info'
                size={15}
                style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }}
              />
              <div style={{ fontSize: 12, color: 'var(--t-muted)' }}>
                Anyone who uses the link must authenticate before the server
                processes the join request.
              </div>
            </div>
            <div className='flex gap-3'>
              <button className='btn btn-secondary flex-1' onClick={onClose}>
                Close
              </button>
              <button
                className='btn btn-primary flex-1'
                onClick={() => void copy()}
              >
                {copied ? 'Copied' : 'Copy join link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Edit profile modal ──────────────── */
function EditProfileModal({
  onClose,
  onPhotoChange,
  onSave,
  photoUrl,
}: {
  onClose: () => void
  onSave: (name: string) => Promise<void>
  photoUrl: string
  onPhotoChange: (file: File) => void
}) {
  const { currentUser, members } = useLiveData()
  const live = currentUser ?? members[0]
  const [name, setName] = useState(live?.name ?? '')
  const photoInputRef = useRef<HTMLInputElement>(null)

  if (!live) return null

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        style={{ maxWidth: 440 }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className='flex items-center justify-between px-6 pt-6 pb-4'
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <div className='font-bold text-primary' style={{ fontSize: 17 }}>
            Edit Profile
          </div>
          <button className='btn btn-ghost btn-icon' onClick={onClose}>
            <Icon name='x' size={18} />
          </button>
        </div>
        <div className='p-6'>
          <div className='flex flex-col gap-5'>
            <div className='flex items-center gap-4'>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt='Profile'
                  className='avatar'
                  style={{ width: 64, height: 64, objectFit: 'cover' }}
                />
              ) : (
                <div
                  className='avatar'
                  style={{
                    width: 64,
                    height: 64,
                    background: live.avatarColor,
                    fontSize: 22,
                  }}
                >
                  {live.initials}
                </div>
              )}
              <div>
                <input
                  ref={photoInputRef}
                  type='file'
                  accept='image/png,image/jpeg,image/gif'
                  className='sr-only'
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) onPhotoChange(file)
                    e.currentTarget.value = ''
                  }}
                />
                <button
                  className='btn btn-secondary btn-sm'
                  onClick={() => photoInputRef.current?.click()}
                >
                  Change photo
                </button>
                <div className='text-faint mt-1' style={{ fontSize: 11 }}>
                  JPG, PNG or GIF · max 2 MB
                </div>
              </div>
            </div>
            <div>
              <label
                className='block font-semibold text-primary mb-1.5'
                style={{ fontSize: 13 }}
              >
                Display name
              </label>
              <input
                className='input'
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label
                className='block font-semibold text-primary mb-1.5'
                style={{ fontSize: 13 }}
              >
                Email
              </label>
              <input
                className='input'
                disabled
                type='email'
                value={live.email}
              />
              <div className='text-faint mt-1' style={{ fontSize: 11 }}>
                Email is managed by your sign-in provider and cannot be changed
                here.
              </div>
            </div>
            <div className='flex gap-3'>
              <button
                className='btn btn-secondary flex-1'
                style={{ justifyContent: 'center' }}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className='btn btn-primary flex-1'
                style={{ justifyContent: 'center' }}
                onClick={() => void onSave(name)}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CredentialModal({
  actionLabel,
  body,
  onClose,
  onSubmit,
  title,
}: {
  actionLabel: string
  body: string
  onClose: () => void
  onSubmit: (value: string) => Promise<void>
  title: string
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!value.trim()) {
      setError('Enter your verification code to continue.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(value.trim())
      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'This action could not be completed.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        style={{ maxWidth: 420 }}
        onClick={e => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-line'>
          <h2
            className='text-primary font-semibold'
            style={{ fontSize: 18, margin: 0 }}
          >
            {title}
          </h2>
          <button
            className='btn btn-ghost btn-icon'
            onClick={onClose}
            aria-label='Close'
          >
            <Icon name='x' size={18} />
          </button>
        </div>
        <div className='p-6 flex flex-col gap-4'>
          <p
            className='text-muted'
            style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}
          >
            {body}
          </p>
          <input
            autoComplete='one-time-code'
            className='input'
            inputMode='numeric'
            onChange={e => setValue(e.target.value)}
            placeholder='Authenticator or recovery code'
            value={value}
          />
          {error && (
            <p className='text-sig-over' style={{ fontSize: 12, margin: 0 }}>
              {error}
            </p>
          )}
          <div className='flex gap-3'>
            <button
              className='btn btn-secondary flex-1'
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className='btn btn-primary flex-1'
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? 'Working…' : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async () => {
    if (!currentPassword || newPassword.length < 8) {
      setError(
        'Enter your current password and a new password with at least 8 characters.',
      )
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(currentPassword, newPassword)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password update failed.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        style={{ maxWidth: 420 }}
        onClick={e => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-line'>
          <h2
            className='text-primary font-semibold'
            style={{ fontSize: 18, margin: 0 }}
          >
            Update password
          </h2>
          <button
            className='btn btn-ghost btn-icon'
            onClick={onClose}
            aria-label='Close'
          >
            <Icon name='x' size={18} />
          </button>
        </div>
        <div className='p-6 flex flex-col gap-4'>
          <input
            autoComplete='current-password'
            className='input'
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder='Current password'
            type='password'
            value={currentPassword}
          />
          <input
            autoComplete='new-password'
            className='input'
            onChange={e => setNewPassword(e.target.value)}
            placeholder='New password'
            type='password'
            value={newPassword}
          />
          <p className='text-faint' style={{ fontSize: 12, margin: 0 }}>
            Changing your password signs out your other sessions.
          </p>
          {error && (
            <p className='text-sig-over' style={{ fontSize: 12, margin: 0 }}>
              {error}
            </p>
          )}
          <div className='flex gap-3'>
            <button
              className='btn btn-secondary flex-1'
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className='btn btn-primary flex-1'
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TextInputModal({
  initialValue,
  label,
  onClose,
  onSubmit,
  title,
}: {
  initialValue: string
  label: string
  onClose: () => void
  onSubmit: (value: string) => Promise<void>
  title: string
}) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async () => {
    if (!value.trim()) {
      setError(`${label} is required.`)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(value.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        style={{ maxWidth: 420 }}
        onClick={e => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-line'>
          <h2
            className='text-primary font-semibold'
            style={{ fontSize: 18, margin: 0 }}
          >
            {title}
          </h2>
          <button
            className='btn btn-ghost btn-icon'
            onClick={onClose}
            aria-label='Close'
          >
            <Icon name='x' size={18} />
          </button>
        </div>
        <div className='p-6 flex flex-col gap-4'>
          <label
            className='font-semibold text-primary'
            style={{ fontSize: 13 }}
          >
            {label}
          </label>
          <input
            autoFocus
            className='input'
            onChange={e => setValue(e.target.value)}
            value={value}
          />
          {error && (
            <p className='text-sig-over' style={{ fontSize: 12, margin: 0 }}>
              {error}
            </p>
          )}
          <div className='flex gap-3'>
            <button
              className='btn btn-secondary flex-1'
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className='btn btn-primary flex-1'
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeleteAccountModal({
  onClose,
  onDelete,
}: {
  onClose: () => void
  onDelete: (password: string) => Promise<void>
}) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async () => {
    if (confirmation !== 'DELETE') {
      setError('Type DELETE to confirm this irreversible action.')
      return
    }
    if (!password) {
      setError('Enter your password to continue.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onDelete(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account deletion failed.')
      setSubmitting(false)
    }
  }
  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        style={{ maxWidth: 440 }}
        onClick={e => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-line'>
          <h2
            className='text-primary font-semibold'
            style={{ fontSize: 18, margin: 0 }}
          >
            Delete your account
          </h2>
          <button
            className='btn btn-ghost btn-icon'
            onClick={onClose}
            aria-label='Close'
          >
            <Icon name='x' size={18} />
          </button>
        </div>
        <div className='p-6 flex flex-col gap-4'>
          <p
            className='text-sig-over'
            style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}
          >
            This calls the server immediately. Your account and eligible
            personal data cannot be restored.
          </p>
          <input
            autoComplete='current-password'
            className='input'
            onChange={e => setPassword(e.target.value)}
            placeholder='Current password'
            type='password'
            value={password}
          />
          <input
            className='input'
            onChange={e => setConfirmation(e.target.value)}
            placeholder='Type DELETE to confirm'
            value={confirmation}
          />
          {error && (
            <p className='text-sig-over' style={{ fontSize: 12, margin: 0 }}>
              {error}
            </p>
          )}
          <div className='flex gap-3'>
            <button
              className='btn btn-secondary flex-1'
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className='btn btn-ghost flex-1 text-sig-over'
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MFASetupModal({
  onClose,
  onConfirm,
  setup,
}: {
  setup: MFASetup
  onClose: () => void
  onConfirm: (code: string) => Promise<void>
}) {
  const [code, setCode] = useState('')
  const [qr, setQR] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void QRCode.toDataURL(setup.qrCodeUrl, { margin: 1, width: 180 })
      .then(setQR)
      .catch(() => setQR(''))
  }, [setup.qrCodeUrl])

  const submit = async () => {
    if (!code.trim()) {
      setError('Enter the six-digit code from your authenticator app.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onConfirm(code.trim())
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not verify this code.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        style={{ maxWidth: 460 }}
        onClick={e => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-line'>
          <h2
            className='text-primary font-semibold'
            style={{ fontSize: 18, margin: 0 }}
          >
            Set up authenticator app
          </h2>
          <button
            className='btn btn-ghost btn-icon'
            onClick={onClose}
            aria-label='Close'
          >
            <Icon name='x' size={18} />
          </button>
        </div>
        <div className='p-6 flex flex-col gap-4'>
          <p className='text-muted' style={{ fontSize: 13, margin: 0 }}>
            Scan this code with your authenticator app, then enter its first
            verification code.
          </p>
          {qr ? (
            <img
              src={qr}
              alt='Authenticator setup QR code'
              style={{ width: 180, height: 180, alignSelf: 'center' }}
            />
          ) : (
            <code
              className='p-3 rounded-lg text-primary'
              style={{ background: 'var(--surface-2)', wordBreak: 'break-all' }}
            >
              {setup.secret}
            </code>
          )}
          <details className='text-muted' style={{ fontSize: 12 }}>
            <summary>Can’t scan the code?</summary>
            <code
              style={{ display: 'block', marginTop: 8, wordBreak: 'break-all' }}
            >
              {setup.secret}
            </code>
          </details>
          <div
            className='p-3 rounded-lg'
            style={{ background: 'var(--sig-due-bg)', fontSize: 12 }}
          >
            <strong>Save these recovery codes now.</strong>
            <div className='font-mono mt-2' style={{ lineHeight: 1.8 }}>
              {setup.backupCodes.join(' · ')}
            </div>
          </div>
          <input
            autoComplete='one-time-code'
            className='input'
            inputMode='numeric'
            onChange={e => setCode(e.target.value)}
            placeholder='Authenticator code'
            value={code}
          />
          {error && (
            <p className='text-sig-over' style={{ fontSize: 12, margin: 0 }}>
              {error}
            </p>
          )}
          <button
            className='btn btn-primary'
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? 'Verifying…' : 'Enable two-factor authentication'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RecoveryCodesModal({
  codes,
  onClose,
}: {
  codes: string[]
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(codes.join('\n'))
    setCopied(true)
  }
  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        style={{ maxWidth: 440 }}
        onClick={event => event.stopPropagation()}
      >
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-line'>
          <h2
            className='text-primary font-semibold'
            style={{ fontSize: 18, margin: 0 }}
          >
            New recovery codes
          </h2>
          <button
            className='btn btn-ghost btn-icon'
            onClick={onClose}
            aria-label='Close'
          >
            <Icon name='x' size={18} />
          </button>
        </div>
        <div className='p-6 flex flex-col gap-4'>
          <p
            className='text-muted'
            style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}
          >
            Save these one-time codes somewhere secure. They will not be shown
            again, and your old recovery codes no longer work.
          </p>
          <div
            className='p-3 rounded-lg font-mono text-primary'
            style={{ background: 'var(--surface-2)', lineHeight: 1.8 }}
          >
            {codes.map(code => (
              <div key={code}>{code}</div>
            ))}
          </div>
          <div className='flex gap-3'>
            <button className='btn btn-secondary flex-1' onClick={onClose}>
              I saved them
            </button>
            <button
              className='btn btn-primary flex-1'
              onClick={() => void copy()}
            >
              {copied ? 'Copied' : 'Copy codes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const TABS: { id: string; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'security', label: 'Security', icon: 'lock' },
  { id: 'team', label: 'Team', icon: 'users' },
  { id: 'theme', label: 'Theme', icon: 'sparkle' },
  { id: 'language', label: 'Language & region', icon: 'globe' },
  { id: 'sidepanel', label: 'Side panel', icon: 'bars' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'privacy', label: 'Privacy', icon: 'eye' },
  { id: 'billing', label: 'Billing & plan', icon: 'tag' },
  { id: 'integrations', label: 'Integrations', icon: 'external' },
  { id: 'advanced', label: 'Advanced', icon: 'settings' },
  { id: 'about', label: 'About', icon: 'info' },
]

export default function SettingsScreen({ ctx, isSolo }: Props) {
  const { currentUser: liveUser, members, profile } = useLiveData()
  const { data: mfaStatus, isLoading: mfaLoading } = useMFAStatus()
  const { data: sessions = [], isLoading: sessionsLoading } = useAuthSessions()
  const { data: circles = [] } = useUserCircles()
  const account = useAccountSettingsMutations()
  const currentUser = liveUser ?? members[0]
  const { mode, setMode } = useProductTheme()
  const {
    dateFormat,
    firstDayOfWeek,
    isRTL,
    language,
    setDateFormat,
    setFirstDayOfWeek,
    setLanguage,
    setTimeFormat,
    timeFormat,
  } = useLocalization()

  const [tab, setTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem('dydan.settings.tab')
      return saved && TABS.some(t => t.id === saved) ? saved : 'overview'
    } catch {
      return 'overview'
    }
  })
  const setTabPersisted = (id: string) => {
    setTab(id)
    try {
      sessionStorage.setItem('dydan.settings.tab', id)
    } catch {}
  }
  const [showInvite, setShowInvite] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState('')
  const [mfaSetup, setMfaSetup] = useState<MFASetup | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [credentialAction, setCredentialAction] = useState<
    'disable-mfa' | 'recovery-codes' | null
  >(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showRenameTeam, setShowRenameTeam] = useState(false)
  const profilePhotoInputRef = useRef<HTMLInputElement>(null)
  const handlePhotoChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      ctx.showToast('Choose a PNG, JPG, or GIF image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      ctx.showToast('Profile photos must be smaller than 2 MB.')
      return
    }
    try {
      await account.uploadProfilePhoto.mutateAsync(file)
      setProfilePhoto(URL.createObjectURL(file))
      ctx.showToast('Profile photo updated')
    } catch (err) {
      ctx.showToast(
        err instanceof Error ? err.message : 'Profile photo upload failed',
      )
    }
  }

  const [notifToggles, setNotifToggles] = useState({
    taskReminders: true,
    routineNudges: true,
    familyActivity: false,
    rewards: true,
    weeklySummary: false,
    quietHours: false,
    pushChannel: true,
    emailChannel: false,
  })
  const toggleNotif = (key: keyof typeof notifToggles) =>
    setNotifToggles(prev => ({ ...prev, [key]: !prev[key] }))

  const mfaEnabled = Boolean(mfaStatus?.mfaEnabled)
  const [activityVisible, setActivityVisible] = useState(true)
  const [analytics, setAnalytics] = useState(true)
  const [personalization, setPersonalization] = useState(true)

  const [panelPrefs, setPanelPrefs] = useState({
    showBadges: true,
    rememberState: true,
  })
  const [integrations, setIntegrations] = useState({
    gcal: true,
    apple: false,
    alexa: false,
    webhooks: false,
  })
  const [devFlags, setDevFlags] = useState({
    verboseLogs: false,
    betaFeatures: false,
  })

  const locale = {
    language,
    dateFormat,
    timeFormat,
    firstDay: String(firstDayOfWeek),
    timezone:
      profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }

  const go = (id: string) => setTabPersisted(id)

  // Member data may not have loaded yet on a cold start / fresh sign-in.
  if (!currentUser) return null
  const profileImage = profilePhoto || profile?.image || ''
  const circle =
    circles.find(item => item.id === profile?.circleID) ?? circles[0]
  const inviteCode = circle?.inviteCode ?? circle?.invite_code ?? 'Unavailable'
  const pendingJoinCode = new URLSearchParams(window.location.search).get(
    'invite_code',
  )

  return (
    <>
      <div className='page-container' style={{ paddingBottom: 80 }}>
        <div className='page-header pb-4'>
          <div>
            <h1
              className='text-primary'
              style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
            >
              Settings
            </h1>
            <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
              Manage your account, team, and preferences
            </div>
          </div>
        </div>

        <Tabs
          value={tab}
          onChange={(_, v) => v && setTabPersisted(v as string)}
          sx={{ bgcolor: 'transparent' }}
        >
          {/* Horizontal, scrollable tab strip */}
          <div
            className='px-4 md:px-7 sticky top-0 z-30'
            style={{ background: 'var(--page)' }}
          >
            <TabList
              disableUnderline
              sx={{
                gap: 0.5,
                overflowX: 'auto',
                flexWrap: 'nowrap',
                scrollbarWidth: 'none',
                borderBottom: '1px solid var(--line)',
                pb: '6px',
                '&::-webkit-scrollbar': { display: 'none' },
                '& .MuiTab-root': {
                  flex: 'none',
                  whiteSpace: 'nowrap',
                  borderRadius: 'var(--r-md)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--t-muted)',
                  minHeight: 34,
                  px: 1.5,
                },
                '& .MuiTab-root:hover': {
                  bgcolor: 'var(--surface-2)',
                  color: 'var(--t-primary)',
                },
                "& .MuiTab-root[aria-selected='true']": {
                  bgcolor: 'var(--brand-faint)',
                  color: 'var(--brand)',
                },
              }}
            >
              {TABS.map(tb => (
                <Tab key={tb.id} value={tb.id} disableIndicator>
                  <Icon name={tb.icon} size={14} />
                  <span className='ms-1.5'>{tb.label}</span>
                </Tab>
              ))}
            </TabList>
          </div>

          <div className='px-4 md:px-7 pt-6'>
            {/* ── Overview ── */}
            <TabPanel value='overview' sx={{ p: 0 }}>
              <TabHeader
                title='Overview'
                desc='A snapshot of your account and quick access to every setting.'
              />
              <Section>
                <div className='flex items-center gap-5 px-5 py-5'>
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt='Profile'
                      className='avatar'
                      style={{ width: 56, height: 56, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className='avatar'
                      style={{
                        width: 56,
                        height: 56,
                        background: currentUser.avatarColor,
                        fontSize: 22,
                      }}
                    >
                      {currentUser.initials}
                    </div>
                  )}
                  <div className='flex-1'>
                    <div
                      className='font-bold text-primary'
                      style={{ fontSize: 16 }}
                    >
                      {currentUser.name}
                    </div>
                    <div className='text-muted' style={{ fontSize: 13 }}>
                      {currentUser.email}
                    </div>
                    <div className='flex gap-1.5 mt-1.5'>
                      <span
                        className='badge bg-brand-faint text-brand'
                        style={{ fontSize: 11 }}
                      >
                        {currentUser.role}
                      </span>
                      <span
                        className='badge bg-sig-done-bg text-sig-done'
                        style={{ fontSize: 11 }}
                      >
                        {profile?.subscription ?? 'No active subscription'}
                      </span>
                    </div>
                  </div>
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => go('profile')}
                  >
                    Edit profile
                  </button>
                </div>
              </Section>
              <div
                className='grid gap-3'
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                }}
              >
                {TABS.filter(t => t.id !== 'overview').map(t => (
                  <button
                    key={t.id}
                    className='card flex items-center gap-3 p-4 text-start'
                    style={{ cursor: 'pointer' }}
                    onClick={() => go(t.id)}
                  >
                    <div
                      className='flex items-center justify-center'
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--r-md)',
                        background: 'var(--brand-faint)',
                        color: 'var(--brand)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={t.icon} size={16} />
                    </div>
                    <span
                      className='font-semibold text-primary'
                      style={{ fontSize: 13 }}
                    >
                      {t.label}
                    </span>
                    <Icon
                      name='chevron_right'
                      size={15}
                      style={{
                        color: 'var(--t-faint)',
                        marginInlineStart: 'auto',
                      }}
                    />
                  </button>
                ))}
              </div>
            </TabPanel>

            {/* ── Profile (identity only) ── */}
            <TabPanel value='profile' sx={{ p: 0 }}>
              <TabHeader
                title='Profile'
                desc='Your personal identity as it appears across the team.'
                action={
                  <button
                    className='btn btn-primary btn-sm'
                    onClick={() => setShowEditProfile(true)}
                  >
                    Edit profile
                  </button>
                }
              />
              <Section>
                <div
                  className='flex items-center gap-5 px-5 py-5 border-b border-line'
                  style={{ borderColor: 'var(--line)' }}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt='Profile'
                      className='avatar'
                      style={{ width: 64, height: 64, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className='avatar'
                      style={{
                        width: 64,
                        height: 64,
                        background: currentUser.avatarColor,
                        fontSize: 24,
                      }}
                    >
                      {currentUser.initials}
                    </div>
                  )}
                  <div className='flex-1'>
                    <input
                      ref={profilePhotoInputRef}
                      type='file'
                      accept='image/png,image/jpeg,image/gif'
                      className='sr-only'
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handlePhotoChange(file)
                        e.currentTarget.value = ''
                      }}
                    />
                    <button
                      className='btn btn-secondary btn-sm'
                      onClick={() => profilePhotoInputRef.current?.click()}
                    >
                      Change photo
                    </button>
                    <div className='text-faint mt-1.5' style={{ fontSize: 11 }}>
                      JPG, PNG or GIF · max 2 MB
                    </div>
                  </div>
                </div>
                <Row icon='user' label='Display name' sub={currentUser.name}>
                  <button
                    className='btn btn-ghost btn-sm text-brand'
                    onClick={() => setShowEditProfile(true)}
                  >
                    Change
                  </button>
                </Row>
                <Row icon='mail' label='Email' sub={currentUser.email}>
                  <button
                    className='btn btn-ghost btn-sm text-brand'
                    onClick={() => setShowEditProfile(true)}
                  >
                    Change
                  </button>
                </Row>
                <Row
                  icon='star'
                  label='Role in team'
                  sub='Determines what you can manage'
                >
                  <span
                    className='badge bg-brand-faint text-brand'
                    style={{ fontSize: 11, textTransform: 'capitalize' }}
                  >
                    {currentUser.role}
                  </span>
                </Row>
                <Row
                  icon='user'
                  label='Profile fields'
                  sub='The server currently supports your display name and profile photo.'
                />
              </Section>
            </TabPanel>

            {/* ── Security ── */}
            <TabPanel value='security' sx={{ p: 0 }}>
              <TabHeader
                title='Security'
                desc="Protect your account and manage where you're signed in."
              />
              <Section title='Sign-in'>
                <Row
                  icon='lock'
                  label='Password'
                  sub='Changing it signs out your other active sessions'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => setShowPassword(true)}
                  >
                    Update password
                  </button>
                </Row>
              </Section>
              <Section title='Two-factor authentication'>
                <Row
                  icon='shield'
                  label='Two-factor authentication'
                  sub={
                    mfaEnabled
                      ? 'Your account is protected with a second step'
                      : 'Add an extra layer of security'
                  }
                >
                  <JoyToggle
                    on={mfaEnabled}
                    onChange={() => {
                      if (mfaLoading) return
                      if (mfaEnabled) {
                        ctx.showConfirm({
                          title: 'Disable two-factor authentication?',
                          message:
                            'This makes your account less secure. Are you sure?',
                          confirmLabel: 'Disable',
                          danger: true,
                          onConfirm: () => setCredentialAction('disable-mfa'),
                        })
                      } else {
                        void account.setupMFA
                          .mutateAsync()
                          .then(setMfaSetup)
                          .catch(err =>
                            ctx.showToast(
                              err instanceof Error
                                ? err.message
                                : 'Unable to start two-factor setup',
                            ),
                          )
                      }
                    }}
                  />
                </Row>
                {mfaEnabled && (
                  <>
                    <Row
                      icon='phone'
                      label='Verification method'
                      sub='Authenticator app (TOTP)'
                    />
                    <Row
                      icon='clipboard'
                      label='Recovery codes'
                      sub='Generate a replacement set after verifying your authenticator code'
                    >
                      <button
                        className='btn btn-secondary btn-sm'
                        onClick={() => setCredentialAction('recovery-codes')}
                      >
                        Regenerate
                      </button>
                    </Row>
                  </>
                )}
              </Section>
              <Section title='Active sessions'>
                <div className='px-5 py-4'>
                  <div className='flex flex-col gap-3'>
                    {sessionsLoading && (
                      <div className='text-muted' style={{ fontSize: 13 }}>
                        Loading active sessions…
                      </div>
                    )}
                    {!sessionsLoading && sessions.length === 0 && (
                      <div className='text-muted' style={{ fontSize: 13 }}>
                        No active sessions were returned by the server.
                      </div>
                    )}
                    {sessions.map(s => (
                      <div key={s.id} className='flex items-center gap-3'>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--r-sm)',
                            background: 'var(--surface-2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon
                            name={
                              /phone|ios|android/i.test(s.device ?? '')
                                ? 'phone'
                                : 'monitor'
                            }
                            size={16}
                            style={{ color: 'var(--t-muted)' }}
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div
                            className='font-medium text-primary truncate'
                            style={{ fontSize: 13 }}
                          >
                            {s.device || 'Signed-in device'}
                          </div>
                          <div className='text-faint' style={{ fontSize: 11 }}>
                            {s.location ? `${s.location} · ` : ''}Last active{' '}
                            {new Date(s.lastActiveAt).toLocaleString()}
                          </div>
                        </div>
                        {s.current ? (
                          <span
                            className='badge bg-sig-done-bg text-sig-done'
                            style={{ fontSize: 10 }}
                          >
                            Current
                          </span>
                        ) : (
                          <button
                            className='btn btn-ghost btn-sm text-sig-over'
                            style={{ fontSize: 11 }}
                            onClick={() =>
                              ctx.showConfirm({
                                title: 'Sign out this device?',
                                message: `This will end the session on ${s.device || 'this device'}.`,
                                confirmLabel: 'Sign out',
                                danger: true,
                                onConfirm: () =>
                                  void account.revokeSession
                                    .mutateAsync(s.id)
                                    .then(() =>
                                      ctx.showToast('Device signed out'),
                                    )
                                    .catch(err =>
                                      ctx.showToast(
                                        err instanceof Error
                                          ? err.message
                                          : 'Could not sign out this device',
                                      ),
                                    ),
                              })
                            }
                          >
                            Sign out
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    className='btn btn-secondary btn-sm mt-4'
                    style={{ fontSize: 12 }}
                    onClick={() =>
                      ctx.showConfirm({
                        title: 'Sign out all other devices?',
                        message:
                          "All other sessions will be ended. You'll stay signed in on this device.",
                        confirmLabel: 'Sign out all',
                        danger: true,
                        onConfirm: () =>
                          void account.revokeOtherSessions
                            .mutateAsync()
                            .then(() =>
                              ctx.showToast('All other devices signed out'),
                            )
                            .catch(err =>
                              ctx.showToast(
                                err instanceof Error
                                  ? err.message
                                  : 'Could not sign out other devices',
                              ),
                            ),
                      })
                    }
                  >
                    Sign out all other devices
                  </button>
                </div>
              </Section>
            </TabPanel>

            {/* ── Team accounts ── */}
            <TabPanel value='team' sx={{ p: 0 }}>
              <TabHeader
                title='Team'
                desc='Your team members and what they can access.'
                action={
                  !isSolo ? (
                    <button
                      className='btn btn-primary btn-sm'
                      onClick={() => setShowInvite(true)}
                    >
                      <Icon name='plus' size={14} />
                      Invite
                    </button>
                  ) : undefined
                }
              />
              <Section title='Team settings'>
                {pendingJoinCode && (
                  <Row
                    icon='users'
                    label='Join shared team'
                    sub={`Invite code: ${pendingJoinCode}`}
                  >
                    <button
                      className='btn btn-primary btn-sm'
                      onClick={() =>
                        void account.joinCircle
                          .mutateAsync(pendingJoinCode)
                          .then(() => ctx.showToast('Join request sent'))
                          .catch(err =>
                            ctx.showToast(
                              err instanceof Error
                                ? err.message
                                : 'Could not join this team',
                            ),
                          )
                      }
                    >
                      Request to join
                    </button>
                  </Row>
                )}
                <Row
                  icon='home'
                  label='Team name'
                  sub={circle?.name ?? 'Loading team details…'}
                >
                  <button
                    className='btn btn-ghost btn-sm text-brand'
                    onClick={() => setShowRenameTeam(true)}
                    disabled={!circle}
                  >
                    Rename
                  </button>
                </Row>
                <Row
                  icon='clipboard'
                  label='Join code'
                  sub='Share to let someone join instantly'
                >
                  <span
                    className='font-mono'
                    style={{
                      fontSize: 13,
                      color: 'var(--t-primary)',
                      background: 'var(--surface-2)',
                      padding: '4px 8px',
                      borderRadius: 'var(--r-sm)',
                    }}
                  >
                    {inviteCode}
                  </span>
                </Row>
                <Row
                  icon='repeat'
                  label='Regenerate join code'
                  sub='Invalidates the current code'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() =>
                      void account.regenerateInviteCode
                        .mutateAsync()
                        .then(result => {
                          const nextCode =
                            result.inviteCode ?? result.invite_code
                          ctx.showToast(
                            nextCode
                              ? `New join code: ${nextCode}`
                              : 'New join code generated',
                          )
                        })
                        .catch(err =>
                          ctx.showToast(
                            err instanceof Error
                              ? err.message
                              : 'Could not regenerate join code',
                          ),
                        )
                    }
                  >
                    Regenerate
                  </button>
                </Row>
                {!isSolo && (
                  <Row
                    icon='log_out'
                    label='Leave team'
                    sub='Remove yourself from this team'
                  >
                    <button
                      className='btn btn-ghost btn-sm text-sig-over'
                      onClick={() =>
                        ctx.showConfirm({
                          title: 'Leave the team?',
                          message:
                            "You'll lose access to shared lists, goals, and team activity.",
                          confirmLabel: 'Leave',
                          danger: true,
                          onConfirm: () =>
                            circle &&
                            void account.leaveCircle
                              .mutateAsync(circle.id)
                              .then(() => ctx.showToast('You left the team'))
                              .catch(err =>
                                ctx.showToast(
                                  err instanceof Error
                                    ? err.message
                                    : 'Could not leave this team',
                                ),
                              ),
                        })
                      }
                    >
                      Leave
                    </button>
                  </Row>
                )}
              </Section>
              {!isSolo ? (
                <Section>
                  <div className='px-5 py-4'>
                    <div className='flex flex-col gap-3'>
                      {members.map(m => (
                        <div key={m.id} className='flex items-center gap-3'>
                          <div
                            className='avatar'
                            style={{
                              width: 34,
                              height: 34,
                              background: m.avatarColor,
                              fontSize: 12,
                            }}
                          >
                            {m.initials}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div
                              className='font-medium text-primary'
                              style={{ fontSize: 13 }}
                            >
                              {m.name}
                            </div>
                            <div
                              className='text-faint'
                              style={{
                                fontSize: 11,
                                textTransform: 'capitalize',
                              }}
                            >
                              {m.role} · {m.email}
                            </div>
                          </div>
                          {m.isCurrentUser ? (
                            <span
                              className='badge bg-brand-faint text-brand'
                              style={{ fontSize: 10 }}
                            >
                              You
                            </span>
                          ) : (
                            <button
                              className='btn btn-ghost btn-sm text-sig-over'
                              style={{ fontSize: 11 }}
                              onClick={() =>
                                ctx.showConfirm({
                                  title: `Remove ${m.name}?`,
                                  message: `${m.name} will lose access to the team. Their tasks will remain.`,
                                  confirmLabel: 'Remove',
                                  danger: true,
                                  onConfirm: () =>
                                    circle &&
                                    void account.removeMember
                                      .mutateAsync({
                                        circleID: circle.id,
                                        memberID: Number(m.id),
                                      })
                                      .then(() =>
                                        ctx.showToast(`${m.name} removed`),
                                      )
                                      .catch(err =>
                                        ctx.showToast(
                                          err instanceof Error
                                            ? err.message
                                            : 'Could not remove this member',
                                        ),
                                      ),
                                })
                              }
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>
              ) : (
                <Section>
                  <div className='px-5 py-5'>
                    <div className='flex items-center gap-4 mb-4'>
                      <div style={{ fontSize: 40, lineHeight: 1 }}>🏠</div>
                      <div>
                        <div
                          className='font-bold text-primary'
                          style={{ fontSize: 15 }}
                        >
                          Currently solo
                        </div>
                        <div
                          className='text-muted'
                          style={{
                            fontSize: 13,
                            marginTop: 2,
                            lineHeight: 1.5,
                          }}
                        >
                          Invite someone to unlock shared lists, family goals,
                          team workload, and more.
                        </div>
                      </div>
                    </div>
                    <button
                      className='btn btn-primary btn-sm'
                      onClick={() => setShowInvite(true)}
                    >
                      <Icon name='plus' size={14} />
                      Invite someone
                    </button>
                  </div>
                </Section>
              )}
            </TabPanel>

            {/* ── Theme ── */}
            <TabPanel value='theme' sx={{ p: 0 }}>
              <TabHeader
                title='Theme'
                desc='Choose your visual identity and default lens.'
              />
              <Section title='Visual theme'>
                <div className='px-5 py-4'>
                  <div className='settings-choice-grid'>
                    {(['dydan', 'sovereign'] as Theme[]).map(t => (
                      <button
                        key={t}
                        onClick={() => ctx.setTheme(t)}
                        className='settings-choice-card'
                        aria-pressed={ctx.theme === t}
                      >
                        <div className='flex items-center gap-2 mb-2'>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background:
                                t === 'dydan'
                                  ? 'var(--pr-violet)'
                                  : 'var(--sv-navy)',
                              border: '2px solid var(--line)',
                            }}
                          />
                          <span
                            className='font-semibold'
                            style={{
                              fontSize: 13,
                              color:
                                ctx.theme === t
                                  ? 'var(--selected-text)'
                                  : 'var(--t-primary)',
                            }}
                          >
                            {t === 'dydan' ? 'dydan' : 'Sovereign'}
                          </span>
                          {ctx.theme === t && (
                            <Icon
                              name='check'
                              size={13}
                              style={{ color: 'var(--selected-text)' }}
                            />
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color:
                              ctx.theme === t
                                ? 'var(--selected-text)'
                                : 'var(--t-muted)',
                          }}
                        >
                          {t === 'dydan'
                            ? 'Rhythm Violet + Gold'
                            : 'Navy & Brass'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </Section>
              <Section title='Appearance'>
                <div className='px-5 py-4'>
                  <div
                    className='view-toggle'
                    style={{ display: 'inline-flex' }}
                  >
                    {(['light', 'dark'] as const).map(m => (
                      <button
                        key={m}
                        className={`view-toggle-btn ${mode === m ? 'active' : ''}`}
                        onClick={() => setMode(m)}
                      >
                        {m === 'light' ? 'Light' : 'Dark'}
                      </button>
                    ))}
                  </div>
                </div>
              </Section>
              <Section title='Default view'>
                <div className='px-5 py-4'>
                  <div
                    className='view-toggle'
                    style={{ display: 'inline-flex' }}
                  >
                    {(['focus', 'quest'] as View[]).map(v => (
                      <button
                        key={v}
                        className={`view-toggle-btn ${ctx.view === v ? 'active' : ''}`}
                        onClick={() => ctx.setView(v)}
                      >
                        {v === 'focus' ? '⚡ Focus' : '✨ Quest'}
                      </button>
                    ))}
                  </div>
                </div>
                <Row
                  icon='bars'
                  label='Compact mode'
                  sub='Reduce spacing for more content density'
                >
                  <span className='text-faint' style={{ fontSize: 12 }}>
                    Not available
                  </span>
                </Row>
              </Section>
            </TabPanel>

            {/* ── Language & region ── */}
            <TabPanel value='language' sx={{ p: 0 }}>
              <TabHeader
                title='Language & region'
                desc='Language, direction, and regional formats.'
              />
              <Section>
                <Row
                  icon='globe'
                  label='Language'
                  sub='App language and text direction'
                >
                  <SelectField
                    value={locale.language}
                    onChange={v => {
                      setLanguage(v as typeof language)
                      ctx.showToast('Language updated')
                    }}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'ar-SA', label: 'العربية' },
                      { value: 'fr', label: 'Français' },
                      { value: 'de', label: 'Deutsch' },
                      { value: 'es', label: 'Español' },
                    ]}
                  />
                </Row>
                <Row
                  icon='rtl'
                  label='Right-to-left layout'
                  sub='Mirror the entire interface for RTL languages'
                >
                  <JoyToggle on={isRTL} onChange={ctx.toggleRTL} />
                </Row>
                <Row icon='calendar' label='Date format'>
                  <SelectField
                    value={locale.dateFormat}
                    onChange={v => {
                      setDateFormat(v as typeof dateFormat)
                      ctx.showToast('Date format updated')
                    }}
                    options={[
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                    ]}
                  />
                </Row>
                <Row icon='clock' label='Time format'>
                  <SelectField
                    value={locale.timeFormat}
                    onChange={v => {
                      setTimeFormat(v === '12h' ? 'h:mm A' : 'HH:mm')
                      ctx.showToast('Time format updated')
                    }}
                    options={[
                      { value: 'HH:mm', label: '24-hour' },
                      { value: 'h:mm A', label: '12-hour (AM/PM)' },
                    ]}
                  />
                </Row>
                <Row icon='today' label='First day of week'>
                  <SelectField
                    value={locale.firstDay}
                    onChange={v => {
                      setFirstDayOfWeek(Number(v))
                      ctx.showToast('Week start updated')
                    }}
                    options={[
                      { value: '1', label: 'Monday' },
                      { value: '0', label: 'Sunday' },
                      { value: '6', label: 'Saturday' },
                    ]}
                  />
                </Row>
                <Row
                  icon='tag'
                  label='Currency'
                  sub='Currency preference is not stored by this server.'
                >
                  <span className='text-faint' style={{ fontSize: 12 }}>
                    Not available
                  </span>
                </Row>
                <Row icon='map' label='Timezone' sub={locale.timezone}>
                  <SelectField
                    value={locale.timezone}
                    onChange={v => {
                      void account.updateProfile
                        .mutateAsync({ timezone: v })
                        .then(() => ctx.showToast('Timezone updated'))
                        .catch(err =>
                          ctx.showToast(
                            err instanceof Error
                              ? err.message
                              : 'Timezone update failed',
                          ),
                        )
                    }}
                    options={[
                      { value: 'Asia/Riyadh', label: 'Riyadh (UTC+3)' },
                      { value: 'Europe/London', label: 'London (UTC+0)' },
                      { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
                      { value: 'America/New_York', label: 'New York (UTC−5)' },
                      {
                        value: 'America/Los_Angeles',
                        label: 'Los Angeles (UTC−8)',
                      },
                      { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
                    ]}
                  />
                </Row>
              </Section>
            </TabPanel>

            {/* ── Side panel ── */}
            <TabPanel value='sidepanel' sx={{ p: 0 }}>
              <TabHeader
                title='Side panel'
                desc='Control how the navigation side panel behaves.'
              />
              <Section>
                <Row
                  icon='bars'
                  label='Collapse side panel'
                  sub='Show icons only to give screens more room'
                >
                  <JoyToggle
                    on={ctx.sidebarCollapsed}
                    onChange={ctx.toggleSidebar}
                  />
                </Row>
                <Row
                  icon='star'
                  label='Show item badges'
                  sub='Display counts (e.g. Today) on nav items'
                >
                  <JoyToggle
                    on={panelPrefs.showBadges}
                    onChange={() =>
                      setPanelPrefs(p => ({ ...p, showBadges: !p.showBadges }))
                    }
                  />
                </Row>
                <Row
                  icon='repeat'
                  label='Remember collapsed state'
                  sub='Keep the panel collapsed between sessions'
                >
                  <JoyToggle
                    on={panelPrefs.rememberState}
                    onChange={() =>
                      setPanelPrefs(p => ({
                        ...p,
                        rememberState: !p.rememberState,
                      }))
                    }
                  />
                </Row>
              </Section>
            </TabPanel>

            {/* ── Notifications ── */}
            <TabPanel value='notifications' sx={{ p: 0 }}>
              <TabHeader
                title='Notifications'
                desc="Choose what you're notified about and how."
              />
              <Section title='What to notify me about'>
                {[
                  {
                    key: 'taskReminders' as const,
                    label: 'Task reminders',
                    sub: 'Alerts for upcoming and overdue tasks',
                  },
                  {
                    key: 'routineNudges' as const,
                    label: 'Routine nudges',
                    sub: 'Remind me when a routine is due',
                  },
                  {
                    key: 'familyActivity' as const,
                    label: 'Family activity',
                    sub: 'When a team member completes something',
                  },
                  {
                    key: 'rewards' as const,
                    label: 'Rewards available',
                    sub: 'When there are enough points to redeem',
                  },
                  {
                    key: 'weeklySummary' as const,
                    label: 'Weekly summary',
                    sub: "Friday digest of the week's progress",
                  },
                  {
                    key: 'quietHours' as const,
                    label: 'Quiet hours (10 pm – 8 am)',
                    sub: 'Suppress notifications during this window',
                  },
                ].map(n => (
                  <Row key={n.key} label={n.label} sub={n.sub}>
                    <JoyToggle
                      on={notifToggles[n.key]}
                      onChange={() => toggleNotif(n.key)}
                    />
                  </Row>
                ))}
              </Section>
              <Section title='Channels'>
                <Row
                  icon='phone'
                  label='Push notifications'
                  sub='On this device'
                >
                  <JoyToggle
                    on={notifToggles.pushChannel}
                    onChange={() => toggleNotif('pushChannel')}
                  />
                </Row>
                <Row
                  icon='mail'
                  label='Email notifications'
                  sub={currentUser.email}
                >
                  <JoyToggle
                    on={notifToggles.emailChannel}
                    onChange={() => toggleNotif('emailChannel')}
                  />
                </Row>
              </Section>
            </TabPanel>

            {/* ── Privacy ── */}
            <TabPanel value='privacy' sx={{ p: 0 }}>
              <TabHeader
                title='Privacy'
                desc='Control what you share and how your data is used.'
              />
              <Section>
                <Row
                  icon='eye'
                  label='Activity visible to team'
                  sub='Other members can see your completed tasks'
                >
                  <JoyToggle
                    on={activityVisible}
                    onChange={() => setActivityVisible(v => !v)}
                  />
                </Row>
                <Row
                  icon='activity'
                  label='Usage analytics'
                  sub='Share anonymous usage to help improve dydan'
                >
                  <JoyToggle
                    on={analytics}
                    onChange={() => setAnalytics(v => !v)}
                  />
                </Row>
                <Row
                  icon='sparkle'
                  label='Personalized suggestions'
                  sub='Use your patterns to suggest tasks and routines'
                >
                  <JoyToggle
                    on={personalization}
                    onChange={() => setPersonalization(v => !v)}
                  />
                </Row>
                <Row
                  icon='eye'
                  label='Privacy policy'
                  sub='How we handle your data'
                >
                  <Icon
                    name='external'
                    size={14}
                    style={{ color: 'var(--t-faint)' }}
                  />
                </Row>
              </Section>
            </TabPanel>

            {/* ── Billing & plan ── */}
            <TabPanel value='billing' sx={{ p: 0 }}>
              <TabHeader
                title='Billing & plan'
                desc='Your subscription, payment method, and invoices.'
              />
              <Section title='Current plan'>
                <div className='px-5 py-5 flex items-center gap-4 flex-wrap'>
                  <div
                    className='flex items-center justify-center'
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 'var(--r-lg)',
                      background: 'var(--brand-faint)',
                      color: 'var(--brand)',
                    }}
                  >
                    <Icon name='star' size={22} />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div
                      className='font-bold text-primary'
                      style={{ fontSize: 16 }}
                    >
                      {profile?.subscription
                        ? `dydan · ${profile.subscription}`
                        : 'dydan Free'}
                    </div>
                    <div className='text-muted' style={{ fontSize: 13 }}>
                      {profile?.expiration
                        ? `Access through ${new Date(profile.expiration).toLocaleDateString()}`
                        : 'No paid subscription is reported by the server'}
                    </div>
                  </div>
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() =>
                      void account.startSubscriptionCheckout
                        .mutateAsync()
                        .then(({ sessionURL }) => {
                          if (!sessionURL)
                            throw new Error(
                              'The server did not provide a checkout link',
                            )
                          window.location.assign(sessionURL)
                        })
                        .catch(err =>
                          ctx.showToast(
                            err instanceof Error
                              ? err.message
                              : 'Could not open subscription checkout',
                          ),
                        )
                    }
                  >
                    Change plan
                  </button>
                </div>
              </Section>
              <Section title='Payment'>
                <Row
                  icon='tag'
                  label='Payment method'
                  sub='Payment methods are managed in the secure checkout portal.'
                />
                <Row
                  icon='clipboard'
                  label='Billing history'
                  sub='Invoice history is not exposed by this server yet.'
                />
                <Row
                  icon='x'
                  label='Cancel subscription'
                  sub='Keep Premium until the end of the period'
                >
                  <button
                    className='btn btn-ghost btn-sm text-sig-over'
                    onClick={() =>
                      ctx.showConfirm({
                        title: 'Cancel Premium?',
                        message:
                          'The server will cancel the active subscription at the end of its current billing period.',
                        confirmLabel: 'Cancel plan',
                        danger: true,
                        onConfirm: () =>
                          void account.cancelSubscription
                            .mutateAsync()
                            .then(() =>
                              ctx.showToast(
                                'Subscription cancellation recorded',
                              ),
                            )
                            .catch(err =>
                              ctx.showToast(
                                err instanceof Error
                                  ? err.message
                                  : 'Could not cancel subscription',
                              ),
                            ),
                      })
                    }
                  >
                    Cancel
                  </button>
                </Row>
              </Section>
            </TabPanel>

            {/* ── Integrations ── */}
            <TabPanel value='integrations' sx={{ p: 0 }}>
              <TabHeader
                title='Integrations'
                desc='Connect dydan to the tools your team uses.'
              />
              <Section>
                <Row
                  icon='calendar'
                  label='Google Calendar'
                  sub='Two-way sync of tasks and events'
                >
                  <JoyToggle
                    on={integrations.gcal}
                    onChange={() =>
                      setIntegrations(i => ({ ...i, gcal: !i.gcal }))
                    }
                  />
                </Row>
                <Row
                  icon='calendar'
                  label='Apple Calendar'
                  sub='Sync via CalDAV'
                >
                  <JoyToggle
                    on={integrations.apple}
                    onChange={() =>
                      setIntegrations(i => ({ ...i, apple: !i.apple }))
                    }
                  />
                </Row>
                <Row
                  icon='bell'
                  label='Amazon Alexa'
                  sub='Add tasks and hear reminders by voice'
                >
                  <JoyToggle
                    on={integrations.alexa}
                    onChange={() =>
                      setIntegrations(i => ({ ...i, alexa: !i.alexa }))
                    }
                  />
                </Row>
                <Row
                  icon='external'
                  label='Webhooks'
                  sub='Send events to your own endpoint'
                >
                  <JoyToggle
                    on={integrations.webhooks}
                    onChange={() =>
                      setIntegrations(i => ({ ...i, webhooks: !i.webhooks }))
                    }
                  />
                </Row>
              </Section>
              <Section title='API access'>
                <Row
                  icon='lock'
                  label='Personal access token'
                  sub='Token creation requires a named token flow, which is not exposed in this approved UI yet.'
                >
                  <span className='text-faint' style={{ fontSize: 12 }}>
                    Not available
                  </span>
                </Row>
                <Row
                  icon='external'
                  label='API documentation'
                  sub='REST reference and guides'
                >
                  <Icon
                    name='external'
                    size={14}
                    style={{ color: 'var(--t-faint)' }}
                  />
                </Row>
              </Section>
            </TabPanel>

            {/* ── Advanced ── */}
            <TabPanel value='advanced' sx={{ p: 0 }}>
              <TabHeader
                title='Advanced'
                desc='Advanced account settings, data controls, and experimental features.'
              />
              <Section title='Data & storage'>
                <Row
                  icon='download'
                  label='Export my data'
                  sub='The encrypted backup flow requires a passphrase UI and is not available from this screen yet.'
                >
                  <span className='text-faint' style={{ fontSize: 12 }}>
                    Not available
                  </span>
                </Row>
                <Row
                  icon='upload'
                  label='Import data'
                  sub='Restore from a previous export'
                >
                  <span className='text-faint' style={{ fontSize: 12 }}>
                    Not available
                  </span>
                </Row>
                <Row
                  icon='database'
                  label='Storage used'
                  sub='Approximately 1.2 MB of data'
                >
                  <span
                    className='text-faint font-mono'
                    style={{ fontSize: 12 }}
                  >
                    1.2 MB
                  </span>
                </Row>
                <Row
                  icon='refresh'
                  label='Clear local cache'
                  sub='Free up space — re-syncs on next launch'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() =>
                      void offlineDB
                        .clearAll()
                        .then(() => ctx.showToast('Local cache cleared'))
                        .catch(() =>
                          ctx.showToast('Could not clear the local cache'),
                        )
                    }
                  >
                    Clear
                  </button>
                </Row>
                <Row
                  icon='trash'
                  label='Delete my account'
                  sub='Permanently remove your account and all data'
                >
                  <button
                    className='btn btn-ghost btn-sm text-sig-over'
                    onClick={() => setShowDeleteAccount(true)}
                  >
                    Delete
                  </button>
                </Row>
              </Section>

              <Section title='Experimental'>
                <Row
                  icon='zap'
                  label='Beta features'
                  sub="Try features before they're released"
                >
                  <JoyToggle
                    on={devFlags.betaFeatures}
                    onChange={() =>
                      setDevFlags(f => ({
                        ...f,
                        betaFeatures: !f.betaFeatures,
                      }))
                    }
                  />
                </Row>
                <Row
                  icon='clipboard'
                  label='Verbose logging'
                  sub='Emit detailed logs to the console'
                >
                  <JoyToggle
                    on={devFlags.verboseLogs}
                    onChange={() =>
                      setDevFlags(f => ({ ...f, verboseLogs: !f.verboseLogs }))
                    }
                  />
                </Row>
                <Row
                  icon='refresh'
                  label='Reset all settings'
                  sub='A complete server-backed preference reset is not available.'
                >
                  <span className='text-faint' style={{ fontSize: 12 }}>
                    Not available
                  </span>
                </Row>
              </Section>
            </TabPanel>

            {/* ── About ── */}
            <TabPanel value='about' sx={{ p: 0 }}>
              <TabHeader
                title='About'
                desc='dydan version, build information, and environment.'
              />
              <Section title='Build information'>
                <Row
                  icon='info'
                  label='Version'
                  sub={`dydan ${appVersion} · UI prototype`}
                >
                  <span
                    className='badge bg-brand-faint text-brand'
                    style={{ fontSize: 10 }}
                  >
                    Preview
                  </span>
                </Row>
                <Row
                  icon='database'
                  label='Environment'
                  sub={`Build mode: ${import.meta.env.MODE}`}
                >
                  <span
                    className='font-mono text-faint'
                    style={{ fontSize: 12 }}
                  >
                    {import.meta.env.MODE}
                  </span>
                </Row>
                <Row
                  icon='copy'
                  label='Copy device diagnostics'
                  sub='Useful when contacting support'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(
                          `dydan ${appVersion}; mode: ${import.meta.env.MODE}; browser: ${navigator.userAgent}`,
                        )
                        .then(() => ctx.showToast('Diagnostics copied'))
                        .catch(() => ctx.showToast('Copy failed'))
                    }}
                  >
                    Copy
                  </button>
                </Row>
              </Section>
            </TabPanel>
          </div>
        </Tabs>
      </div>

      {showInvite && (
        <InviteModal
          inviteCode={inviteCode}
          onClose={() => setShowInvite(false)}
        />
      )}
      {showEditProfile && (
        <EditProfileModal
          onClose={() => setShowEditProfile(false)}
          onSave={async name => {
            try {
              await account.updateProfile.mutateAsync({ displayName: name })
              ctx.showToast('Profile updated')
              setShowEditProfile(false)
            } catch (err) {
              ctx.showToast(
                err instanceof Error ? err.message : 'Profile update failed',
              )
            }
          }}
          photoUrl={profileImage}
          onPhotoChange={handlePhotoChange}
        />
      )}
      {showPassword && (
        <PasswordModal
          onClose={() => setShowPassword(false)}
          onSubmit={async (currentPassword, newPassword) => {
            await account.changePassword.mutateAsync({
              currentPassword,
              newPassword,
            })
            ctx.showToast('Password updated; other sessions were signed out')
          }}
        />
      )}
      {mfaSetup && (
        <MFASetupModal
          onClose={() => setMfaSetup(null)}
          onConfirm={async code => {
            await account.confirmMFA.mutateAsync({ ...mfaSetup, code })
            ctx.showToast(
              'Two-factor authentication enabled. Please sign in again.',
            )
            await ctx.signOut()
          }}
          setup={mfaSetup}
        />
      )}
      {credentialAction && (
        <CredentialModal
          actionLabel={
            credentialAction === 'disable-mfa'
              ? 'Disable two-factor authentication'
              : 'Regenerate recovery codes'
          }
          body={
            credentialAction === 'disable-mfa'
              ? 'Enter a current authenticator or recovery code to disable two-factor authentication.'
              : 'Enter a current authenticator code to replace all recovery codes.'
          }
          onClose={() => setCredentialAction(null)}
          onSubmit={async code => {
            if (credentialAction === 'disable-mfa') {
              await account.disableMFA.mutateAsync(code)
              ctx.showToast(
                'Two-factor authentication disabled. Please sign in again.',
              )
              await ctx.signOut()
              return
            }
            const result = await account.regenerateBackupCodes.mutateAsync(code)
            setRecoveryCodes(result.backupCodes)
            ctx.showToast('New recovery codes generated')
          }}
          title={
            credentialAction === 'disable-mfa'
              ? 'Disable two-factor authentication'
              : 'Regenerate recovery codes'
          }
        />
      )}
      {showRenameTeam && circle && (
        <TextInputModal
          initialValue={circle.name}
          label='Team name'
          onClose={() => setShowRenameTeam(false)}
          onSubmit={async name => {
            await account.updateCircle.mutateAsync(name)
            ctx.showToast('Team name updated')
          }}
          title='Rename team'
        />
      )}
      {recoveryCodes && (
        <RecoveryCodesModal
          codes={recoveryCodes}
          onClose={() => setRecoveryCodes(null)}
        />
      )}
      {showDeleteAccount && (
        <DeleteAccountModal
          onClose={() => setShowDeleteAccount(false)}
          onDelete={async password => {
            const result =
              await account.checkAccountDeletion.mutateAsync(password)
            if (
              result &&
              typeof result === 'object' &&
              'requiresTransfer' in result &&
              result.requiresTransfer
            ) {
              throw new Error(
                'Transfer ownership of your team before deleting this account.',
              )
            }
            await account.deleteAccount.mutateAsync({ password })
            await clearAllTokens()
            ctx.showToast('Account deleted')
            await ctx.signOut()
          }}
        />
      )}
    </>
  )
}

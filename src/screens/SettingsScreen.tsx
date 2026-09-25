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
import {
  DEFAULT_SETTINGS_PREFERENCES,
  type SettingsPreferences,
  useSettingsPreferences,
  useSettingsPreferencesMutation,
} from '../hooks/useSettingsPreferences'
import {
  type CreatedApiToken,
  type EmailDeliveryInput,
  type Invoice,
  useApiTokenMutations,
  useApiTokens,
  useEmailDelivery,
  useEmailDeliveryMutations,
  useImportData,
  useIntegrationStatus,
  useInvoices,
  useStorageUsage,
  useWebhookMutation,
} from '../hooks/useSettingsResources'
import { useLiveData } from '../model/liveData'
import * as Fetcher from '../utils/Fetcher'
import { offlineDB } from '../utils/OfflineDB'
import { clearAllTokens } from '../utils/TokenStorage'

type Props = {
  ctx: AppCtx
  isSolo: boolean
}

/**
 * External providers the server may be configured for. Capability comes from
 * `GET /users/integrations`; the copy for each state is fixed here so a
 * provider can never be presented as connectable when the server has no
 * authorization endpoint for it.
 */
const INTEGRATION_ROWS = [
  {
    key: 'googleCalendar' as const,
    icon: 'calendar',
    label: 'Google Calendar',
    availableCopy: 'Google Calendar sync is available on this server.',
    unavailableCopy: 'Google Calendar sync is not configured on this server',
  },
  {
    key: 'caldav' as const,
    icon: 'calendar',
    label: 'Apple Calendar',
    availableCopy: 'CalDAV account authorization is available on this server.',
    unavailableCopy:
      'CalDAV account authorization is not configured on this server',
  },
  {
    key: 'alexa' as const,
    icon: 'bell',
    label: 'Amazon Alexa',
    availableCopy: 'The Alexa skill is available on this server.',
    unavailableCopy:
      'Alexa skill credentials are not configured on this server',
  },
]

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

function JoyToggle({
  disabled = false,
  on,
  onChange,
}: {
  disabled?: boolean
  on: boolean
  onChange?: () => void
}) {
  return (
    <Switch
      checked={on}
      onChange={onChange}
      disabled={disabled}
      color={on ? 'primary' : 'neutral'}
      variant='solid'
    />
  )
}

function SelectField({
  disabled = false,
  onChange,
  options,
  value,
}: {
  disabled?: boolean
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select
      value={value}
      onChange={(_, v) => v && onChange(v)}
      disabled={disabled}
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

function EmailDeliverySettings({ ctx }: { ctx: AppCtx }) {
  const delivery = useEmailDelivery()
  const mutations = useEmailDeliveryMutations()
  const [form, setForm] = useState<EmailDeliveryInput>({
    provider: 'smtp',
    fromEmail: '',
    host: '',
    port: 587,
    username: '',
    secret: '',
    appHost: window.location.origin,
    verificationTemplateId: '',
    resetPasswordTemplateId: '',
  })
  const [testRecipient, setTestRecipient] = useState('')
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    const status = delivery.data
    if (!status) return
    setForm(previous => ({
      ...previous,
      provider: status.provider || 'smtp',
      fromEmail: status.fromEmail ?? '',
      host: status.host ?? '',
      port: status.port ?? (status.provider === 'smtp' ? 587 : 0),
      username: status.username ?? '',
      // GET deliberately contains no secret. Keeping it blank preserves the
      // saved secret unless an administrator explicitly supplies a replacement.
      secret: '',
      appHost: status.appHost ?? window.location.origin,
      verificationTemplateId: status.verificationTemplateId ?? '',
      resetPasswordTemplateId: status.resetPasswordTemplateId ?? '',
    }))
    setTestRecipient(current => current || status.fromEmail || '')
  }, [delivery.data])

  if (delivery.isLoading) {
    return <div className='px-5 py-4 text-muted'>Loading delivery status…</div>
  }
  if (delivery.isError) {
    return (
      <div className='px-5 py-4 text-muted' style={{ fontSize: 13 }}>
        Email delivery can only be configured by a DyDan administrator.
      </div>
    )
  }

  const status = delivery.data
  const update = <K extends keyof EmailDeliveryInput>(
    key: K,
    value: EmailDeliveryInput[K],
  ) => setForm(previous => ({ ...previous, [key]: value }))
  const save = async () => {
    setResult(null)
    try {
      const saved = await mutations.save.mutateAsync(form)
      setForm(previous => ({ ...previous, secret: '' }))
      setResult(
        saved.source === 'runtime'
          ? 'Email delivery configuration saved.'
          : 'Email delivery configuration updated.',
      )
      ctx.showToast('Email delivery configuration saved')
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : 'Could not save email delivery configuration',
      )
    }
  }
  const sendTest = async () => {
    setResult(null)
    try {
      const response = await mutations.test.mutateAsync(testRecipient)
      setResult(response.message)
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : 'The test email could not be delivered',
      )
    }
  }

  return (
    <div className='p-5 flex flex-col gap-4'>
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div>
          <div className='font-medium text-primary'>Email Delivery</div>
          <div className='text-muted' style={{ fontSize: 12, marginTop: 2 }}>
            {status?.configured
              ? `Configured via ${status.source === 'runtime' ? 'saved runtime settings' : 'environment fallback'}.`
              : 'Not configured. Save a provider configuration to enable verified delivery.'}
          </div>
        </div>
        <span
          className='badge'
          style={{
            background: status?.configured
              ? 'var(--sig-done-bg)'
              : 'var(--surface-2)',
            color: status?.configured ? 'var(--sig-done)' : 'var(--t-muted)',
          }}
        >
          {status?.configured ? 'Configured' : 'Not configured'}
        </span>
      </div>
      <label className='flex flex-col gap-1.5'>
        <span className='section-label' style={{ padding: 0 }}>
          PROVIDER
        </span>
        <select
          className='input'
          value={form.provider}
          onChange={event =>
            update(
              'provider',
              event.target.value as EmailDeliveryInput['provider'],
            )
          }
        >
          <option value='smtp'>SMTP</option>
          <option value='smtp2go'>SMTP2GO</option>
        </select>
      </label>
      <div
        className='grid gap-3'
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}
      >
        <label className='flex flex-col gap-1.5'>
          <span className='section-label' style={{ padding: 0 }}>
            FROM EMAIL
          </span>
          <input
            className='input'
            type='email'
            value={form.fromEmail}
            onChange={event => update('fromEmail', event.target.value)}
            autoComplete='email'
          />
        </label>
        <label className='flex flex-col gap-1.5'>
          <span className='section-label' style={{ padding: 0 }}>
            APP HOST
          </span>
          <input
            className='input'
            type='url'
            value={form.appHost}
            onChange={event => update('appHost', event.target.value)}
            placeholder='https://dydan.example'
          />
        </label>
        {form.provider === 'smtp' ? (
          <>
            <label className='flex flex-col gap-1.5'>
              <span className='section-label' style={{ padding: 0 }}>
                SMTP HOST
              </span>
              <input
                className='input'
                value={form.host}
                onChange={event => update('host', event.target.value)}
                autoComplete='off'
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className='section-label' style={{ padding: 0 }}>
                SMTP PORT
              </span>
              <input
                className='input'
                type='number'
                min='1'
                max='65535'
                value={form.port || ''}
                onChange={event => update('port', Number(event.target.value))}
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className='section-label' style={{ padding: 0 }}>
                USERNAME
              </span>
              <input
                className='input'
                value={form.username}
                onChange={event => update('username', event.target.value)}
                autoComplete='username'
              />
            </label>
          </>
        ) : (
          <>
            <label className='flex flex-col gap-1.5'>
              <span className='section-label' style={{ padding: 0 }}>
                VERIFICATION TEMPLATE ID
              </span>
              <input
                className='input'
                value={form.verificationTemplateId}
                onChange={event =>
                  update('verificationTemplateId', event.target.value)
                }
                autoComplete='off'
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className='section-label' style={{ padding: 0 }}>
                RESET-PASSWORD TEMPLATE ID
              </span>
              <input
                className='input'
                value={form.resetPasswordTemplateId}
                onChange={event =>
                  update('resetPasswordTemplateId', event.target.value)
                }
                autoComplete='off'
              />
            </label>
          </>
        )}
        <label className='flex flex-col gap-1.5'>
          <span className='section-label' style={{ padding: 0 }}>
            {form.provider === 'smtp' ? 'PASSWORD / KEY' : 'API KEY'}
          </span>
          <input
            className='input'
            type='password'
            value={form.secret}
            onChange={event => update('secret', event.target.value)}
            placeholder={
              status?.secretConfigured
                ? 'Stored securely — leave blank to keep'
                : 'Required'
            }
            autoComplete='new-password'
          />
          {status?.secretConfigured && (
            <span className='text-faint' style={{ fontSize: 11 }}>
              A secret is stored securely. Leave this blank to preserve it.
            </span>
          )}
        </label>
      </div>
      <div className='flex gap-2 flex-wrap'>
        <button
          className='btn btn-primary'
          onClick={() => void save()}
          disabled={mutations.save.isPending}
        >
          {mutations.save.isPending ? 'Saving…' : 'Save configuration'}
        </button>
        <input
          className='input'
          style={{ maxWidth: 280 }}
          type='email'
          value={testRecipient}
          onChange={event => setTestRecipient(event.target.value)}
          placeholder='Test recipient email'
        />
        <button
          className='btn btn-secondary'
          onClick={() => void sendTest()}
          disabled={
            !status?.configured ||
            !testRecipient.trim() ||
            mutations.test.isPending
          }
        >
          {mutations.test.isPending ? 'Sending…' : 'Test email'}
        </button>
      </div>
      {result && (
        <div className='text-muted' role='status' style={{ fontSize: 13 }}>
          {result}
        </div>
      )}
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

function EmailChangeModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (email: string, currentPassword: string) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        style={{ maxWidth: 440 }}
        onClick={event => event.stopPropagation()}
      >
        <div
          className='flex items-center justify-between px-6 pt-6 pb-4'
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <div className='font-bold text-primary' style={{ fontSize: 17 }}>
            Change email address
          </div>
          <button
            className='btn btn-ghost btn-icon'
            onClick={onClose}
            aria-label='Close'
          >
            <Icon name='x' size={18} />
          </button>
        </div>
        <form
          className='p-6 flex flex-col gap-4'
          onSubmit={event => {
            event.preventDefault()
            setSubmitting(true)
            void onSubmit(email, currentPassword).finally(() =>
              setSubmitting(false),
            )
          }}
        >
          <p className='text-muted' style={{ fontSize: 13 }}>
            We’ll email a one-time verification link to the new address. Your
            current email will not change until it is confirmed.
          </p>
          <label
            className='font-semibold text-primary'
            style={{ fontSize: 13 }}
          >
            New email address
            <input
              className='input mt-1.5 w-full'
              type='email'
              autoComplete='email'
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </label>
          <label
            className='font-semibold text-primary'
            style={{ fontSize: 13 }}
          >
            Current password
            <input
              className='input mt-1.5 w-full'
              type='password'
              autoComplete='current-password'
              required
              value={currentPassword}
              onChange={event => setCurrentPassword(event.target.value)}
            />
          </label>
          <div className='flex gap-3'>
            <button
              className='btn btn-secondary flex-1'
              type='button'
              onClick={onClose}
            >
              Cancel
            </button>
            <button className='btn btn-primary flex-1' disabled={submitting}>
              {submitting ? 'Sending…' : 'Send verification'}
            </button>
          </div>
        </form>
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

function InvoiceHistoryModal({
  error,
  invoices,
  isLoading,
  onClose,
  onRetry,
}: {
  invoices: Invoice[]
  isLoading: boolean
  error: unknown
  onClose: () => void
  onRetry: () => void
}) {
  const money = (amount: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        style={{ maxWidth: 560 }}
        onClick={event => event.stopPropagation()}
      >
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-line'>
          <h2
            className='text-primary font-semibold'
            style={{ fontSize: 18, margin: 0 }}
          >
            Billing history
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
          {isLoading && (
            <div className='text-muted' style={{ fontSize: 13 }} role='status'>
              Loading invoices…
            </div>
          )}
          {!isLoading && error != null && (
            <div
              className='text-sm'
              role='alert'
              style={{ color: 'var(--sig-over)' }}
            >
              {error instanceof Error
                ? error.message
                : 'The server could not return your billing history.'}
            </div>
          )}
          {!isLoading && error == null && invoices.length === 0 && (
            <div className='text-muted' style={{ fontSize: 13 }}>
              No invoices have been recorded for this account.
            </div>
          )}
          {invoices.length > 0 && (
            <div
              className='rounded-lg overflow-hidden'
              style={{ border: '1px solid var(--line)' }}
            >
              {invoices.map(invoice => (
                <div
                  key={invoice.invoice_id}
                  className='flex items-center justify-between gap-3 px-4 py-3'
                  style={{ borderBottom: '1px solid var(--line)' }}
                >
                  <div className='min-w-0'>
                    <div
                      className='text-primary font-medium'
                      style={{ fontSize: 13 }}
                    >
                      {invoice.invoice_id}
                    </div>
                    <div className='text-faint' style={{ fontSize: 11 }}>
                      {new Date(invoice.received_at).toLocaleDateString()} ·{' '}
                      {invoice.status}
                    </div>
                  </div>
                  <div
                    className='text-primary font-semibold'
                    style={{ fontSize: 13, whiteSpace: 'nowrap' }}
                  >
                    {money(invoice.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className='flex gap-3'>
            <button
              className='btn btn-secondary flex-1'
              onClick={() => onRetry()}
              disabled={isLoading}
            >
              Refresh
            </button>
            <button className='btn btn-primary flex-1' onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApiTokenModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, mfaCode: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async () => {
    if (!name.trim()) {
      setError('Give this token a name so you can identify it later.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onCreate(name.trim(), mfaCode.trim())
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create API token.',
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
            Create personal access token
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
            The secret is shown once. Store it securely and revoke it when no
            longer needed.
          </p>
          <input
            autoFocus
            className='input'
            onChange={e => setName(e.target.value)}
            placeholder='Token name (for example, Home dashboard)'
            value={name}
          />
          <input
            autoComplete='one-time-code'
            className='input'
            inputMode='numeric'
            onChange={e => setMfaCode(e.target.value)}
            placeholder='Authenticator code (required if 2FA is enabled)'
            value={mfaCode}
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
              {submitting ? 'Creating…' : 'Create token'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TokenSecretModal({
  onClose,
  token,
}: {
  onClose: () => void
  token: CreatedApiToken
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(token.token)
    setCopied(true)
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
            Copy your new token
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
          <p className='text-sig-over' style={{ fontSize: 13, margin: 0 }}>
            This secret is shown only once.
          </p>
          <code
            className='p-3 rounded-lg text-primary'
            style={{ background: 'var(--surface-2)', wordBreak: 'break-all' }}
          >
            {token.token}
          </code>
          <div className='flex gap-3'>
            <button className='btn btn-secondary flex-1' onClick={onClose}>
              I saved it
            </button>
            <button
              className='btn btn-primary flex-1'
              onClick={() => void copy()}
            >
              {copied ? 'Copied' : 'Copy token'}
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
  const { data: savedPreferences } = useSettingsPreferences()
  const preferenceMutations = useSettingsPreferencesMutation()
  const { data: apiTokens = [] } = useApiTokens()
  const { data: storageUsage } = useStorageUsage()
  const { data: integrationStatus } = useIntegrationStatus()
  const [showInvoices, setShowInvoices] = useState(false)
  // Invoices are fetched only when the server advertises a payment provider
  // and the user actually asks for them, so the billing tab never calls an
  // endpoint this deployment does not serve.
  const invoiceQuery = useInvoices(
    Boolean(integrationStatus?.billing.invoiceHistory) && showInvoices,
  )
  const webhookMutations = useWebhookMutation()
  const importData = useImportData()
  const [webhookDraft, setWebhookDraft] = useState('')
  const importFileRef = useRef<HTMLInputElement>(null)
  const apiTokenMutations = useApiTokenMutations()
  const preferences = savedPreferences ?? DEFAULT_SETTINGS_PREFERENCES
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
  const [showEmailChange, setShowEmailChange] = useState(false)
  const exportMyData = async () => {
    try {
      const response = await Fetcher.ExportMyData()
      if (!response.ok) throw new Error('Could not export your data')
      const blob = await response.blob()
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = 'dydan-my-data.json'
      link.click()
      URL.revokeObjectURL(href)
      ctx.showToast('Your data export has downloaded')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not export your data',
      )
    }
  }
  const handleImportFile = async (file: File | undefined | null) => {
    if (!file) return
    try {
      if (file.size > 2 * 1024 * 1024) {
        ctx.showToast('Export files must be smaller than 2 MB.')
        return
      }
      const text = await file.text()
      const document = JSON.parse(text)
      await importData.mutateAsync(document)
      ctx.showToast('Your settings were restored from the export file')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not restore your data',
      )
    }
  }
  const saveWebhook = async () => {
    const url = webhookDraft.trim()
    try {
      await webhookMutations.set.mutateAsync(url)
      setWebhookDraft('')
      ctx.showToast(
        url ? 'Webhook endpoint configured' : 'Webhook endpoint cleared',
      )
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not update webhook',
      )
    }
  }
  const [profilePhoto, setProfilePhoto] = useState('')
  const [mfaSetup, setMfaSetup] = useState<MFASetup | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [credentialAction, setCredentialAction] = useState<
    'disable-mfa' | 'recovery-codes' | null
  >(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showRenameTeam, setShowRenameTeam] = useState(false)
  const [showCreateApiToken, setShowCreateApiToken] = useState(false)
  const [createdApiToken, setCreatedApiToken] =
    useState<CreatedApiToken | null>(null)
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

  const mfaEnabled = Boolean(mfaStatus?.mfaEnabled)
  const savePreferences = (next: SettingsPreferences, message?: string) =>
    void preferenceMutations.update
      .mutateAsync(next)
      .then(() => message && ctx.showToast(message))
      .catch(err =>
        ctx.showToast(
          err instanceof Error ? err.message : 'Could not save this setting',
        ),
      )

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
                <div className='flex items-center gap-5 px-5 py-5 settings-profile-row'>
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
                  <div className='flex-1 settings-profile-main'>
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
                <Row
                  icon='mail'
                  label='Email'
                  sub={`${currentUser.email} — verification required before changing`}
                >
                  <button
                    className='btn btn-ghost btn-sm text-brand'
                    onClick={() => setShowEmailChange(true)}
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
                        onClick={() => {
                          ctx.setTheme(t)
                          savePreferences({
                            ...preferences,
                            theme: t,
                            appearance:
                              t === 'sovereign'
                                ? 'dark'
                                : preferences.appearance,
                          })
                        }}
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
                    {(['light', 'dark', 'system'] as const).map(m => (
                      <button
                        key={m}
                        className={`view-toggle-btn ${mode === m ? 'active' : ''}`}
                        onClick={() => {
                          setMode(m)
                          savePreferences({ ...preferences, appearance: m })
                        }}
                      >
                        {m === 'light'
                          ? 'Light'
                          : m === 'dark'
                            ? 'Dark'
                            : 'Automatic'}
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
                        onClick={() => {
                          ctx.setView(v)
                          savePreferences({ ...preferences, defaultView: v })
                        }}
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
                  <JoyToggle
                    on={preferences.compactMode}
                    onChange={() =>
                      savePreferences({
                        ...preferences,
                        compactMode: !preferences.compactMode,
                      })
                    }
                  />
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
                      // The confirmation is emitted by savePreferences only
                      // after the server has accepted the write, so a failed
                      // save never reports "Language updated".
                      savePreferences(
                        {
                          ...preferences,
                          language: v as SettingsPreferences['language'],
                        },
                        'Language updated',
                      )
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
                  <JoyToggle
                    on={isRTL}
                    onChange={() => {
                      const nextLanguage = isRTL ? 'en' : 'ar-SA'
                      setLanguage(nextLanguage)
                      savePreferences({
                        ...preferences,
                        language: nextLanguage,
                      })
                    }}
                  />
                </Row>
                <Row icon='calendar' label='Date format'>
                  <SelectField
                    value={locale.dateFormat}
                    onChange={v => {
                      setDateFormat(v as typeof dateFormat)
                      savePreferences(
                        {
                          ...preferences,
                          dateFormat: v as SettingsPreferences['dateFormat'],
                        },
                        'Date format updated',
                      )
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
                      setTimeFormat(v as typeof timeFormat)
                      savePreferences(
                        {
                          ...preferences,
                          timeFormat: v as SettingsPreferences['timeFormat'],
                        },
                        'Time format updated',
                      )
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
                      savePreferences(
                        {
                          ...preferences,
                          firstDayOfWeek: Number(v),
                        },
                        'Week start updated',
                      )
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
                  sub='Used to format shopping and budget totals'
                >
                  <SelectField
                    value={preferences.currency}
                    onChange={v => {
                      savePreferences(
                        {
                          ...preferences,
                          currency: v as SettingsPreferences['currency'],
                        },
                        'Currency updated',
                      )
                    }}
                    options={[
                      { value: 'GBP', label: '£ GBP' },
                      { value: 'USD', label: '$ USD' },
                      { value: 'EUR', label: '€ EUR' },
                      { value: 'AED', label: 'AED' },
                      { value: 'SAR', label: 'SAR' },
                    ]}
                  />
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
                    onChange={() => {
                      ctx.toggleSidebar()
                      savePreferences({
                        ...preferences,
                        sidebarCollapsed: !ctx.sidebarCollapsed,
                      })
                    }}
                  />
                </Row>
                <Row
                  icon='star'
                  label='Show item badges'
                  sub='Display counts (e.g. Today) on nav items'
                >
                  <JoyToggle
                    on={preferences.showItemBadges}
                    onChange={() =>
                      savePreferences({
                        ...preferences,
                        showItemBadges: !preferences.showItemBadges,
                      })
                    }
                  />
                </Row>
                <Row
                  icon='repeat'
                  label='Remember collapsed state'
                  sub='Keep the panel collapsed between sessions'
                >
                  <JoyToggle
                    on={preferences.rememberSidebar}
                    onChange={() =>
                      savePreferences({
                        ...preferences,
                        rememberSidebar: !preferences.rememberSidebar,
                      })
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
                      on={preferences.notifications[n.key]}
                      onChange={() =>
                        savePreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            [n.key]: !preferences.notifications[n.key],
                          },
                        })
                      }
                    />
                  </Row>
                ))}
              </Section>
              <Section title='Channels'>
                <Row
                  icon='phone'
                  label='Push notifications'
                  sub='Allow delivery to your registered devices'
                >
                  <JoyToggle
                    on={preferences.notifications.pushChannel}
                    onChange={() =>
                      savePreferences({
                        ...preferences,
                        notifications: {
                          ...preferences.notifications,
                          pushChannel: !preferences.notifications.pushChannel,
                        },
                      })
                    }
                  />
                </Row>
                <Row
                  icon='mail'
                  label='Email notifications'
                  sub={
                    integrationStatus === undefined
                      ? 'Loading server email-delivery status…'
                      : integrationStatus.settings.notificationEmail.available
                        ? 'Allow delivery to your account email address'
                        : integrationStatus.settings.notificationEmail
                              .emailDeliveryConfigured
                          ? 'Add an email address to enable this channel'
                          : 'Email Delivery is unavailable on this server'
                  }
                >
                  <JoyToggle
                    on={preferences.notifications.emailChannel}
                    disabled={
                      !integrationStatus?.settings.notificationEmail.available
                    }
                    onChange={() =>
                      savePreferences({
                        ...preferences,
                        notifications: {
                          ...preferences.notifications,
                          emailChannel: !preferences.notifications.emailChannel,
                        },
                      })
                    }
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
                  sub='Allow team activity views to include your completed work'
                >
                  <JoyToggle
                    on={preferences.privacy.activityVisible}
                    onChange={() =>
                      savePreferences({
                        ...preferences,
                        privacy: {
                          ...preferences.privacy,
                          activityVisible: !preferences.privacy.activityVisible,
                        },
                      })
                    }
                  />
                </Row>
                <Row
                  icon='activity'
                  label='Usage analytics'
                  sub='Allow anonymized usage analytics for this account'
                >
                  <JoyToggle
                    on={preferences.privacy.analytics}
                    disabled={!integrationStatus?.settings.analytics.available}
                    onChange={() =>
                      savePreferences({
                        ...preferences,
                        privacy: {
                          ...preferences.privacy,
                          analytics: !preferences.privacy.analytics,
                        },
                      })
                    }
                  />
                </Row>
                <Row
                  icon='sparkle'
                  label='Personalized suggestions'
                  sub='Allow suggestions to use your account activity'
                >
                  <JoyToggle
                    on={preferences.privacy.personalization}
                    disabled={
                      !integrationStatus?.settings.personalization.available
                    }
                    onChange={() =>
                      savePreferences({
                        ...preferences,
                        privacy: {
                          ...preferences.privacy,
                          personalization: !preferences.privacy.personalization,
                        },
                      })
                    }
                  />
                </Row>
                <Row
                  icon='eye'
                  label='Privacy policy'
                  sub={
                    integrationStatus === undefined
                      ? 'Loading server integration status…'
                      : integrationStatus.legal.privacyPolicyUrl
                        ? 'Read how dydan handles your data'
                        : 'This deployment has not published a privacy policy URL'
                  }
                >
                  {integrationStatus?.legal.privacyPolicyUrl ? (
                    <a
                      className='btn btn-ghost btn-sm'
                      href={integrationStatus.legal.privacyPolicyUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <Icon name='external' size={14} />
                      Open
                    </a>
                  ) : (
                    <span className='text-faint' style={{ fontSize: 12 }}>
                      Not configured
                    </span>
                  )}
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
                  sub={
                    integrationStatus === undefined
                      ? 'Loading server integration status…'
                      : integrationStatus.billing.invoiceHistory
                        ? invoiceQuery.data?.length
                          ? `${invoiceQuery.data.length} invoice${invoiceQuery.data.length === 1 ? '' : 's'} on record`
                          : 'No invoices have been recorded for this account'
                        : 'This deployment has no payment provider configured'
                  }
                >
                  {integrationStatus?.billing.invoiceHistory ? (
                    <button
                      className='btn btn-secondary btn-sm'
                      onClick={() => setShowInvoices(true)}
                    >
                      View
                    </button>
                  ) : (
                    <span className='text-faint' style={{ fontSize: 12 }}>
                      Not configured
                    </span>
                  )}
                </Row>
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
                {/*
                  The server advertises each provider through
                  `GET /users/integrations`. When it reports a provider as
                  unavailable there is no authorization endpoint to call, so
                  these rows render the same read-only status the webhook row
                  uses for non-editable circles — never a switch that cannot be
                  turned on. Adding a provider means teaching the server its
                  connect flow, after which this row can offer a real action.
                */}
                {INTEGRATION_ROWS.map(row => {
                  const capability = integrationStatus
                    ? integrationStatus[row.key]
                    : undefined
                  return (
                    <Row
                      key={row.key}
                      icon={row.icon}
                      label={row.label}
                      sub={
                        capability === undefined
                          ? 'Loading server integration status…'
                          : capability.available
                            ? row.availableCopy
                            : row.unavailableCopy
                      }
                    >
                      <span className='text-faint' style={{ fontSize: 12 }}>
                        {capability === undefined
                          ? '…'
                          : capability.available
                            ? 'Available'
                            : 'Not configured'}
                      </span>
                    </Row>
                  )
                })}
                <Row
                  icon='external'
                  label='Webhooks'
                  sub={
                    integrationStatus === undefined
                      ? 'Loading server integration status…'
                      : integrationStatus.webhooks.url
                        ? `Delivering events to ${integrationStatus.webhooks.url}`
                        : integrationStatus.webhooks.plusOnly
                          ? 'Webhook delivery requires a Plus plan'
                          : integrationStatus.webhooks.editable
                            ? 'Configure an endpoint to receive chore and maintenance events'
                            : 'Only circle admins can configure webhooks'
                  }
                >
                  {integrationStatus?.webhooks.editable ? (
                    <div
                      className='flex items-center gap-2'
                      style={{ maxWidth: 420 }}
                    >
                      <input
                        className='input'
                        aria-label='Webhook endpoint URL'
                        value={webhookDraft}
                        onChange={event => setWebhookDraft(event.target.value)}
                        placeholder='https://example.com/hooks/dydan'
                      />
                      <button
                        className='btn btn-secondary btn-sm'
                        disabled={webhookMutations.set.isPending}
                        onClick={() => void saveWebhook()}
                      >
                        Save
                      </button>
                      {integrationStatus.webhooks.url && (
                        <button
                          className='btn btn-ghost btn-sm text-sig-over'
                          disabled={webhookMutations.set.isPending}
                          onClick={() => {
                            setWebhookDraft('')
                            void saveWebhook()
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className='text-faint' style={{ fontSize: 12 }}>
                      {integrationStatus?.webhooks.plusOnly
                        ? 'Plus plan required'
                        : 'Admin only'}
                    </span>
                  )}
                </Row>
              </Section>
              <Section title='API access'>
                <Row
                  icon='lock'
                  label='Personal access token'
                  sub={
                    apiTokens.length
                      ? `${apiTokens.length} active token${apiTokens.length === 1 ? '' : 's'}`
                      : 'Use for API requests on your behalf'
                  }
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => setShowCreateApiToken(true)}
                  >
                    Generate
                  </button>
                </Row>
                <Row
                  icon='external'
                  label='API documentation'
                  sub={
                    integrationStatus?.apiDocs.enabled
                      ? 'Open the interactive OpenAPI documentation'
                      : 'Interactive API documentation is disabled on this server'
                  }
                >
                  <button
                    className='btn btn-ghost btn-icon'
                    disabled={!integrationStatus?.apiDocs.enabled}
                    title={
                      integrationStatus?.apiDocs.enabled
                        ? 'Open API documentation'
                        : 'API documentation is disabled on this server'
                    }
                    onClick={() =>
                      integrationStatus?.apiDocs.url &&
                      window.open(
                        integrationStatus.apiDocs.url,
                        '_blank',
                        'noopener,noreferrer',
                      )
                    }
                  >
                    <Icon name='external' size={14} />
                  </button>
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
                  sub='Download a portable copy of your account data'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => void exportMyData()}
                  >
                    Export
                  </button>
                </Row>
                <Row
                  icon='upload'
                  label='Restore settings'
                  sub='Restore your settings from an export file'
                >
                  <input
                    ref={importFileRef}
                    type='file'
                    accept='application/json,.json'
                    hidden
                    aria-label='Import data file'
                    onChange={event => {
                      void handleImportFile(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                  <button
                    className='btn btn-secondary btn-sm'
                    disabled={importData.isPending}
                    onClick={() => importFileRef.current?.click()}
                  >
                    Import
                  </button>
                </Row>
                <Row
                  icon='database'
                  label='Storage used'
                  sub='Server-reported account storage'
                >
                  <span
                    className='text-faint font-mono'
                    style={{ fontSize: 12 }}
                  >
                    {storageUsage
                      ? `${(storageUsage.used / (1024 * 1024)).toFixed(1)} MB`
                      : 'Loading…'}
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

              <Section title='Email delivery'>
                <EmailDeliverySettings ctx={ctx} />
              </Section>

              <Section title='Experimental'>
                <Row
                  icon='zap'
                  label='Beta features'
                  sub='Enables pre-release features when the server ships them'
                >
                  <JoyToggle
                    on={preferences.betaFeatures}
                    disabled={
                      !integrationStatus?.settings.betaFeatures.available
                    }
                    onChange={() => {
                      const next = !preferences.betaFeatures
                      savePreferences(
                        { ...preferences, betaFeatures: next },
                        next
                          ? 'Beta features enabled'
                          : 'Beta features disabled',
                      )
                    }}
                  />
                </Row>
                <Row
                  icon='clipboard'
                  label='Verbose logging'
                  sub='Adds account details to server diagnostics for this user'
                >
                  <JoyToggle
                    on={preferences.verboseLogging}
                    onChange={() => {
                      const next = !preferences.verboseLogging
                      savePreferences(
                        { ...preferences, verboseLogging: next },
                        next
                          ? 'Verbose logging enabled'
                          : 'Verbose logging disabled',
                      )
                    }}
                  />
                </Row>
                <Row
                  icon='refresh'
                  label='Reset all settings'
                  sub='Restore every preference to its default'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() =>
                      ctx.showConfirm({
                        title: 'Reset all settings?',
                        message:
                          'Your preferences will return to defaults. Your data is not affected.',
                        confirmLabel: 'Reset',
                        danger: true,
                        onConfirm: () =>
                          void preferenceMutations.reset
                            .mutateAsync()
                            .then(() => ctx.showToast('Settings reset'))
                            .catch(err =>
                              ctx.showToast(
                                err instanceof Error
                                  ? err.message
                                  : 'Could not reset settings',
                              ),
                            ),
                      })
                    }
                  >
                    Reset
                  </button>
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
      {showInvoices && (
        <InvoiceHistoryModal
          invoices={invoiceQuery.data ?? []}
          isLoading={invoiceQuery.isLoading}
          error={invoiceQuery.error}
          onClose={() => setShowInvoices(false)}
          onRetry={() => void invoiceQuery.refetch()}
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
      {showEmailChange && (
        <EmailChangeModal
          onClose={() => setShowEmailChange(false)}
          onSubmit={async (email, currentPassword) => {
            try {
              await account.startEmailChange.mutateAsync({
                email,
                currentPassword,
              })
              ctx.showToast(
                'Verification email sent. Your current email remains active until you confirm it.',
              )
              setShowEmailChange(false)
            } catch (error) {
              ctx.showToast(
                error instanceof Error
                  ? error.message
                  : 'Could not start email change',
              )
            }
          }}
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
      {showCreateApiToken && (
        <ApiTokenModal
          onClose={() => setShowCreateApiToken(false)}
          onCreate={async (name, mfaCode) => {
            const token = await apiTokenMutations.create.mutateAsync({
              name,
              mfaCode,
            })
            setCreatedApiToken(token)
            ctx.showToast('Personal access token created')
          }}
        />
      )}
      {createdApiToken && (
        <TokenSecretModal
          token={createdApiToken}
          onClose={() => setCreatedApiToken(null)}
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

/* eslint-disable max-lines -- the settings screen is a single long screen file */
import Option from '@mui/joy/Option'
import Select from '@mui/joy/Select'
import Switch from '@mui/joy/Switch'
import Tab from '@mui/joy/Tab'
import TabList from '@mui/joy/TabList'
import TabPanel from '@mui/joy/TabPanel'
import Tabs from '@mui/joy/Tabs'
import { useRef, useState } from 'react'

import { version as appVersion } from '../../package.json'
import { AppCtx, Icon, Theme, View } from '../App'
import { useProductTheme } from '../contexts/ThemeContext'
import { useLiveData } from '../model/liveData'

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
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (email: string) => void
}) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = () => {
    if (!inviteEmail.includes('@')) {
      setError('Please enter a valid email.')
      return
    }
    setError('')
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setSent(true)
      onSuccess(inviteEmail)
    }, 900)
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
          {!sent ? (
            <>
              <div
                className='text-muted mb-5'
                style={{ fontSize: 14, lineHeight: 1.6 }}
              >
                Invite a family member or partner. They'll get an email to join
                your team. Family features become active once they accept.
              </div>
              <div className='flex flex-col gap-4'>
                <div>
                  <label
                    className='block font-semibold text-primary mb-1.5'
                    style={{ fontSize: 13 }}
                  >
                    Their email address
                  </label>
                  <input
                    className='input'
                    type='email'
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder='name@example.com'
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    autoFocus
                  />
                </div>
                {error && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--sig-over)',
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </div>
                )}
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
                    style={{
                      color: 'var(--brand)',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  />
                  <div style={{ fontSize: 12, color: 'var(--t-muted)' }}>
                    A pending invitation does not enable Family mode — that only
                    activates when they accept and become an active member.
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
                    onClick={handleSend}
                    disabled={sending}
                  >
                    {sending ? 'Sending…' : 'Send invitation'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className='text-center py-4'>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📧</div>
              <div
                className='font-bold text-primary mb-2'
                style={{ fontSize: 17 }}
              >
                Invitation sent!
              </div>
              <div
                className='text-muted mb-2'
                style={{ fontSize: 14, lineHeight: 1.6 }}
              >
                An invitation was sent to <strong>{inviteEmail}</strong>. Family
                features will activate once they join.
              </div>
              <div
                className='badge mb-6'
                style={{
                  background: 'var(--sig-due-bg)',
                  color: 'var(--sig-due)',
                  fontSize: 11,
                }}
              >
                Pending invitation
              </div>
              <button
                className='btn btn-primary'
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={onClose}
              >
                Done
              </button>
            </div>
          )}
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
  onSave: (name: string, email: string) => void
  photoUrl: string
  onPhotoChange: (file: File) => void
}) {
  const { currentUser, members } = useLiveData()
  const live = currentUser ?? members[0]
  const [name, setName] = useState(live?.name ?? '')
  const [email, setEmail] = useState(live?.email ?? '')
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
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                onClick={() => {
                  onSave(name, email)
                  onClose()
                }}
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

const SESSIONS = [
  {
    id: 's1',
    device: 'Chrome on macOS',
    location: 'London, UK',
    lastActive: 'Now',
    current: true,
    icon: 'monitor',
  },
  {
    id: 's2',
    device: 'Safari on iPhone 15',
    location: 'London, UK',
    lastActive: '2h ago',
    current: false,
    icon: 'phone',
  },
  {
    id: 's3',
    device: 'Chrome on Windows',
    location: 'Manchester, UK',
    lastActive: '3 days ago',
    current: false,
    icon: 'monitor',
  },
]

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
  const { currentUser: liveUser, members } = useLiveData()
  const currentUser = liveUser ?? members[0]
  const { mode, setMode } = useProductTheme()
  const isRTL = document.documentElement.dir === 'rtl'

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
  const [gender, setGender] = useState('male')
  const profilePhotoInputRef = useRef<HTMLInputElement>(null)
  const handlePhotoChange = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setProfilePhoto(URL.createObjectURL(file))
    ctx.showToast('Profile photo updated')
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

  const [mfaEnabled, setMfaEnabled] = useState(true)
  const [mfaMethod, setMfaMethod] = useState('sms')
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

  const [locale, setLocale] = useState({
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    firstDay: 'monday',
    currency: 'GBP',
    timezone: 'Europe/London',
  })
  const setLocaleField = (field: keyof typeof locale, value: string) =>
    setLocale(prev => ({ ...prev, [field]: value }))

  const go = (id: string) => setTabPersisted(id)

  // Member data may not have loaded yet on a cold start / fresh sign-in.
  if (!currentUser) return null

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
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
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
                        Family · Premium
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
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
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
                <Row icon='user' label='Gender' sub='Shown on your profile'>
                  <SelectField
                    value={gender}
                    onChange={v => {
                      setGender(v)
                      ctx.showToast('Gender updated')
                    }}
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                    ]}
                  />
                </Row>
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
                  sub='Last changed 90 days ago'
                >
                  <button className='btn btn-secondary btn-sm'>
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
                      if (mfaEnabled) {
                        ctx.showConfirm({
                          title: 'Disable two-factor authentication?',
                          message:
                            'This makes your account less secure. Are you sure?',
                          confirmLabel: 'Disable',
                          danger: true,
                          onConfirm: () => {
                            setMfaEnabled(false)
                            ctx.showToast('2FA disabled')
                          },
                        })
                      } else {
                        setMfaEnabled(true)
                        ctx.showToast('2FA enabled')
                      }
                    }}
                  />
                </Row>
                {mfaEnabled && (
                  <>
                    <Row
                      icon='phone'
                      label='Verification method'
                      sub='How we send your second-step code'
                    >
                      <SelectField
                        value={mfaMethod}
                        onChange={v => {
                          setMfaMethod(v)
                          ctx.showToast('Method updated')
                        }}
                        options={[
                          { value: 'sms', label: 'SMS text message' },
                          { value: 'app', label: 'Authenticator app' },
                          { value: 'email', label: 'Email' },
                        ]}
                      />
                    </Row>
                    <Row
                      icon='clipboard'
                      label='Recovery codes'
                      sub='10 single-use codes for account recovery'
                    >
                      <button
                        className='btn btn-secondary btn-sm'
                        onClick={() =>
                          ctx.showToast('Recovery codes regenerated')
                        }
                      >
                        View codes
                      </button>
                    </Row>
                    <Row
                      icon='monitor'
                      label='Trusted devices'
                      sub='Skip 2FA on devices you use often'
                    >
                      <span className='text-faint' style={{ fontSize: 12 }}>
                        2 devices
                      </span>
                    </Row>
                  </>
                )}
              </Section>
              <Section title='Active sessions'>
                <div className='px-5 py-4'>
                  <div className='flex flex-col gap-3'>
                    {SESSIONS.map(s => (
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
                            name={s.icon}
                            size={16}
                            style={{ color: 'var(--t-muted)' }}
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div
                            className='font-medium text-primary truncate'
                            style={{ fontSize: 13 }}
                          >
                            {s.device}
                          </div>
                          <div className='text-faint' style={{ fontSize: 11 }}>
                            {s.location} · {s.lastActive}
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
                                message: `This will end the session on ${s.device}.`,
                                confirmLabel: 'Sign out',
                                danger: true,
                                onConfirm: () =>
                                  ctx.showToast('Device signed out'),
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
                          ctx.showToast('All other devices signed out'),
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
                <Row icon='home' label='Team name' sub='The Mitchell Team'>
                  <button className='btn btn-ghost btn-sm text-brand'>
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
                    MITCH-42
                  </span>
                </Row>
                <Row
                  icon='repeat'
                  label='Regenerate join code'
                  sub='Invalidates the current code'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => ctx.showToast('New join code generated')}
                  >
                    Regenerate
                  </button>
                </Row>
                <Row
                  icon='user'
                  label='Default role for new members'
                  sub='Applied when someone joins'
                >
                  <SelectField
                    value='adult'
                    onChange={() => ctx.showToast('Default role updated')}
                    options={[
                      { value: 'adult', label: 'Adult' },
                      { value: 'child', label: 'Child' },
                    ]}
                  />
                </Row>
                <Row
                  icon='shopping'
                  label='New lists shared by default'
                  sub='Members can still make personal lists'
                >
                  <JoyToggle
                    on={true}
                    onChange={() => ctx.showToast('Updated')}
                  />
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
                          onConfirm: () => ctx.showToast('You left the team'),
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
                                    ctx.showToast(`${m.name} removed`),
                                })
                              }
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      {ctx.pendingInvite && (
                        <div className='flex items-center gap-3'>
                          <div
                            className='avatar'
                            style={{
                              width: 34,
                              height: 34,
                              background: 'var(--line-strong)',
                              fontSize: 12,
                            }}
                          >
                            ?
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div
                              className='font-medium text-primary'
                              style={{ fontSize: 13 }}
                            >
                              {ctx.pendingInvite}
                            </div>
                            <div
                              className='text-faint'
                              style={{ fontSize: 11 }}
                            >
                              Invitation pending · not yet active
                            </div>
                          </div>
                          <button
                            className='btn btn-secondary btn-sm'
                            onClick={ctx.acceptInvite}
                          >
                            Demo: Accept
                          </button>
                        </div>
                      )}
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
                    {ctx.pendingInvite && (
                      <div
                        className='mt-4 p-3 flex items-center gap-3 rounded-lg'
                        style={{
                          background: 'var(--sig-due-bg)',
                          borderRadius: 'var(--r-md)',
                        }}
                      >
                        <Icon
                          name='clock'
                          size={15}
                          style={{ color: 'var(--sig-due)', flexShrink: 0 }}
                        />
                        <div className='flex-1 min-w-0'>
                          <div
                            className='font-semibold'
                            style={{ fontSize: 13, color: 'var(--sig-due)' }}
                          >
                            Invitation pending
                          </div>
                          <div
                            style={{ fontSize: 12, color: 'var(--t-muted)' }}
                          >
                            {ctx.pendingInvite} has been invited but has not yet
                            joined.
                          </div>
                        </div>
                        <button
                          className='btn btn-secondary btn-sm'
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--line)',
                          }}
                          onClick={ctx.acceptInvite}
                        >
                          Demo: Accept
                        </button>
                      </div>
                    )}
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
                  <JoyToggle
                    on={false}
                    onChange={() => ctx.showToast('Coming in v2.5')}
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
                      setLocaleField('language', v)
                      if (v === 'ar' && !isRTL) ctx.toggleRTL()
                      if (v !== 'ar' && isRTL) ctx.toggleRTL()
                      ctx.showToast('Language updated')
                    }}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'ar', label: 'العربية' },
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
                      setLocaleField('dateFormat', v)
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
                      setLocaleField('timeFormat', v)
                      ctx.showToast('Time format updated')
                    }}
                    options={[
                      { value: '24h', label: '24-hour' },
                      { value: '12h', label: '12-hour (AM/PM)' },
                    ]}
                  />
                </Row>
                <Row icon='today' label='First day of week'>
                  <SelectField
                    value={locale.firstDay}
                    onChange={v => {
                      setLocaleField('firstDay', v)
                      ctx.showToast('Week start updated')
                    }}
                    options={[
                      { value: 'monday', label: 'Monday' },
                      { value: 'sunday', label: 'Sunday' },
                      { value: 'saturday', label: 'Saturday' },
                    ]}
                  />
                </Row>
                <Row
                  icon='tag'
                  label='Currency'
                  sub='For shopping and budget estimates'
                >
                  <SelectField
                    value={locale.currency}
                    onChange={v => {
                      setLocaleField('currency', v)
                      ctx.showToast('Currency updated')
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
                      setLocaleField('timezone', v)
                      ctx.showToast('Timezone updated')
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
                      dydan Family · Premium
                    </div>
                    <div className='text-muted' style={{ fontSize: 13 }}>
                      £4.99 / month · renews 1 September 2026
                    </div>
                  </div>
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => ctx.showToast('Opening plan options')}
                  >
                    Change plan
                  </button>
                </div>
              </Section>
              <Section title='Payment'>
                <Row
                  icon='tag'
                  label='Payment method'
                  sub='Visa ending 4242 · expires 08/28'
                >
                  <button className='btn btn-ghost btn-sm text-brand'>
                    Update
                  </button>
                </Row>
                <Row
                  icon='clipboard'
                  label='Billing history'
                  sub='Download past invoices'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => ctx.showToast('Fetching invoices')}
                  >
                    View invoices
                  </button>
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
                          "You'll keep Premium features until 1 September 2026, then move to the free plan.",
                        confirmLabel: 'Cancel plan',
                        danger: true,
                        onConfirm: () =>
                          ctx.showToast('Subscription will not renew'),
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
                  sub='Use for API requests on your behalf'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() =>
                      ctx.showToast('Demo: token generation is not connected')
                    }
                  >
                    Generate
                  </button>
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
                  sub='Download a full copy of your dydan data (JSON)'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() =>
                      ctx.showToast('Export started — check your email')
                    }
                  >
                    Export
                  </button>
                </Row>
                <Row
                  icon='upload'
                  label='Import data'
                  sub='Restore from a previous export'
                >
                  <button className='btn btn-secondary btn-sm'>Import</button>
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
                    onClick={() => ctx.showToast('Cache cleared')}
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
                    onClick={() =>
                      ctx.showConfirm({
                        title: 'Delete your account?',
                        message:
                          'This is permanent. All your tasks, goals, and team data will be deleted. This cannot be undone.',
                        confirmLabel: 'Delete account',
                        danger: true,
                        onConfirm: () =>
                          ctx.showToast('Account deletion requested'),
                      })
                    }
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
                        onConfirm: () => ctx.showToast('Settings reset'),
                      })
                    }
                  >
                    Reset
                  </button>
                </Row>
              </Section>
              <Section title='Prototype demo flows'>
                <Row
                  icon='zap'
                  label='New user onboarding'
                  sub='Walk through the first-use setup flow'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={ctx.goToOnboarding}
                  >
                    Demo
                  </button>
                </Row>
                <Row
                  icon='error'
                  label='Error reporting flow'
                  sub='See the full error and support flow'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => ctx.navigate('error')}
                  >
                    Open
                  </button>
                </Row>
                <Row
                  icon='wifi_off'
                  label='Offline state'
                  sub='Demo the disconnected experience'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => ctx.navigate('offline')}
                  >
                    Open
                  </button>
                </Row>
                <Row
                  icon='database'
                  label='Unavailable data state'
                  sub='Demo failed data loading'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => ctx.navigate('unavailable')}
                  >
                    Open
                  </button>
                </Row>
                <Row
                  icon='lock'
                  label='Permission denied state'
                  sub='Demo restricted access'
                >
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => ctx.navigate('permission-denied')}
                  >
                    Open
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
          onClose={() => setShowInvite(false)}
          onSuccess={email => {
            setShowInvite(false)
            ctx.inviteMember(email)
          }}
        />
      )}
      {showEditProfile && (
        <EditProfileModal
          onClose={() => setShowEditProfile(false)}
          onSave={() => ctx.showToast('Profile updated')}
          photoUrl={profilePhoto}
          onPhotoChange={handlePhotoChange}
        />
      )}
    </>
  )
}

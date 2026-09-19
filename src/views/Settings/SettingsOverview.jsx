import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import FigmaIcon from '../../components/FigmaIcon'
import { useLocalization } from '../../contexts/LocalizationContext'
import { useProductTheme } from '../../contexts/ThemeContext'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import {
  hasPermission,
  resolveEffectiveRole,
  SETTINGS_PERMISSIONS,
} from '../../utils/PermissionModel'
import {
  readLocalStorageItem,
  writeLocalStorageItem,
} from '../../utils/storage'
import { STORAGE_KEYS } from '../../utils/storageKeys'
import ErrorReportModal from '../Modals/ErrorReportModal'
import FeedbackModal from '../Modals/FeedbackModal'
import OptionButtonGroup from './OptionButtonGroup'
import ProductThemePicker from './ProductThemePicker'

const Section = ({ children, title }) => (
  <section className='mb-6'>
    <div className='section-label' style={{ padding: '0 0 8px' }}>
      {title}
    </div>
    <div className='card overflow-hidden'>{children}</div>
  </section>
)

const Row = ({ action, icon, label, onClick, sub, toggle }) => (
  <div className='figma-settings-row'>
    {icon && (
      <FigmaIcon
        name={icon}
        size={18}
        style={{ color: 'var(--t-muted)', flexShrink: 0 }}
      />
    )}
    <div className='min-w-0 flex-1'>
      <div className='text-primary font-medium' style={{ fontSize: 14 }}>
        {label}
      </div>
      {sub && (
        <div className='text-muted' style={{ fontSize: 12, marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
    {toggle ||
      (action && (
        <button
          className={
            action.danger
              ? 'btn btn-ghost btn-sm text-sig-over'
              : 'btn btn-ghost btn-sm text-brand'
          }
          onClick={onClick}
          type='button'
        >
          {action.label}
        </button>
      ))}
  </div>
)

const Toggle = ({ checked, label, onChange }) => (
  <button
    aria-label={label}
    aria-pressed={checked}
    className={`figma-settings-toggle ${checked ? 'on' : ''}`}
    onClick={onChange}
    type='button'
  >
    <span />
  </button>
)

const SettingsOverview = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('settings')
  const { language, setLanguage } = useLocalization()
  const { mode, setMode } = useProductTheme()
  const { data: userProfile } = useUserProfile()
  const { data: circleMembersData } = useCircleMembers()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [bugReportOpen, setBugReportOpen] = useState(false)
  const [homeView, setHomeView] = useState(
    () => readLocalStorageItem(STORAGE_KEYS.homeView) || 'focus',
  )
  const members = circleMembersData?.res || []
  const role = resolveEffectiveRole(userProfile, members)
  const can = setting =>
    !SETTINGS_PERMISSIONS[setting] ||
    hasPermission(role, SETTINGS_PERMISSIONS[setting])
  const isSolo = !members.length

  const settingsAction = (setting, label, danger = false) =>
    can(setting) ? { danger, label } : null

  const selectHomeView = view => {
    setHomeView(view)
    writeLocalStorageItem(STORAGE_KEYS.homeView, view)
  }

  return (
    <div className='figma-settings-wrap'>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            {t('overview.title')}
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            {t('figmaOverview.subtitle')}
          </div>
        </div>
      </div>
      <div className='px-4 md:px-7'>
        <Section title={t('figmaOverview.appearance')}>
          <div className='figma-settings-theme-block'>
            <div
              className='text-primary mb-3 font-medium'
              style={{ fontSize: 14 }}
            >
              {t('figmaOverview.productTheme')}
            </div>
            <ProductThemePicker />
          </div>
          <div className='figma-settings-theme-block'>
            <div
              className='text-primary mb-3 font-medium'
              style={{ fontSize: 14 }}
            >
              {t('figmaOverview.themeMode')}
            </div>
            <OptionButtonGroup
              onChange={setMode}
              options={[
                { label: t('theme.light'), value: 'light' },
                { label: t('theme.dark'), value: 'dark' },
                { label: t('theme.automatic'), value: 'system' },
              ]}
              value={mode}
            />
          </div>
          <div className='figma-settings-theme-block'>
            <div
              className='text-primary mb-3 font-medium'
              style={{ fontSize: 14 }}
            >
              {t('figmaOverview.defaultView')}
            </div>
            <OptionButtonGroup
              onChange={selectHomeView}
              options={[
                { icon: '⚡', label: 'Focus', value: 'focus' },
                { icon: '✨', label: 'Quest', value: 'quest' },
              ]}
              value={homeView}
            />
          </div>
        </Section>

        <Section title={t('figmaOverview.language')}>
          <div className='figma-settings-theme-block'>
            <OptionButtonGroup
              onChange={setLanguage}
              options={[
                { label: 'English', value: 'en' },
                { label: 'العربية', value: 'ar-SA' },
              ]}
              value={language}
            />
          </div>
        </Section>

        {can('circle') &&
          (isSolo ? (
            <Section title={t('figmaOverview.circle')}>
              <div className='figma-settings-solo'>
                <div className='mb-4 flex items-center gap-4'>
                  <div style={{ fontSize: 40 }}>🏠</div>
                  <div>
                    <div
                      className='text-primary font-bold'
                      style={{ fontSize: 15 }}
                    >
                      {t('figmaOverview.currentlySolo')}
                    </div>
                    <div
                      className='text-muted'
                      style={{ fontSize: 13, marginTop: 2 }}
                    >
                      {t('figmaOverview.soloHelp')}
                    </div>
                  </div>
                </div>
                <button
                  className='btn btn-primary btn-sm'
                  onClick={() => navigate('/settings/circle')}
                  type='button'
                >
                  {t('figmaOverview.inviteSomeone')}
                </button>
              </div>
            </Section>
          ) : (
            <Section title={t('figmaOverview.household')}>
              <Row
                action={settingsAction('circle', t('figmaOverview.manage'))}
                icon='users'
                label={t('figmaOverview.members')}
                onClick={() => navigate('/settings/circle')}
                sub={t('figmaOverview.activeMembers', {
                  count: members.length,
                })}
              />
              <div className='figma-settings-members'>
                {members.map(member => (
                  <div
                    className='flex items-center gap-3'
                    key={member.id || member.userId}
                  >
                    <div className='avatar figma-settings-member-avatar'>
                      {(member.displayName || member.username || '?')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className='flex-1'>
                      <div
                        className='text-primary font-medium'
                        style={{ fontSize: 13 }}
                      >
                        {member.displayName || member.username}
                      </div>
                      <div className='text-faint' style={{ fontSize: 11 }}>
                        {member.role} · {member.email || member.username}
                      </div>
                    </div>
                    {String(member.userId) === String(userProfile?.id) ? (
                      <span
                        className='badge bg-brand-faint text-brand'
                        style={{ fontSize: 10 }}
                      >
                        {t('circleSettings.you')}
                      </span>
                    ) : (
                      <button
                        className='btn btn-ghost btn-sm text-sig-over'
                        onClick={() => navigate('/settings/circle')}
                        type='button'
                      >
                        {t('figmaOverview.manage')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <Row
                action={{ label: t('figmaOverview.invite') }}
                icon='plus'
                label={t('figmaOverview.inviteMember')}
                onClick={() => navigate('/settings/circle')}
                sub={t('figmaOverview.inviteHelp')}
              />
            </Section>
          ))}

        <Section title={t('overview.sections.notifications.title')}>
          {[
            [
              'taskReminders',
              t('figmaOverview.taskReminders'),
              t('figmaOverview.taskRemindersHelp'),
            ],
            [
              'routineNudges',
              t('figmaOverview.routineNudges'),
              t('figmaOverview.routineNudgesHelp'),
            ],
            [
              'familyActivity',
              t('figmaOverview.familyActivity'),
              t('figmaOverview.familyActivityHelp'),
            ],
            [
              'rewards',
              t('figmaOverview.rewardsAvailable'),
              t('figmaOverview.rewardsAvailableHelp'),
            ],
            [
              'weeklySummary',
              t('figmaOverview.weeklySummary'),
              t('figmaOverview.weeklySummaryHelp'),
            ],
          ].map(([key, label, sub]) => (
            <Row
              key={key}
              label={label}
              sub={sub}
              toggle={
                <Toggle
                  checked={key === 'taskReminders'}
                  label={label}
                  onChange={() => navigate('/settings/notifications')}
                />
              }
            />
          ))}
          <Row
            action={{ label: t('figmaOverview.details') }}
            icon='settings'
            label={t('figmaOverview.devicePush')}
            onClick={() => navigate('/settings/notifications')}
            sub={t('figmaOverview.devicePushHelp')}
          />
        </Section>

        <Section title={t('figmaOverview.privacy')}>
          <Row
            action={settingsAction('circle', t('figmaOverview.manage'))}
            icon='eye'
            label={t('figmaOverview.activityVisible')}
            onClick={() => navigate('/settings/circle')}
            sub={t('figmaOverview.activityVisibleHelp')}
          />
          <Row
            action={{ label: t('figmaOverview.export') }}
            icon='download'
            label={t('figmaOverview.exportData')}
            onClick={() => navigate('/settings/storage')}
            sub={t('figmaOverview.exportHelp')}
          />
        </Section>

        <Section title={t('figmaOverview.support')}>
          <Row
            action={{ label: t('figmaOverview.open') }}
            icon='help'
            label={t('figmaOverview.help')}
            onClick={() =>
              window.open(
                'https://github.com/dydan/dydan',
                '_blank',
                'noopener,noreferrer',
              )
            }
          />
          <Row
            action={{ label: t('figmaOverview.open') }}
            icon='error'
            label={t('figmaOverview.report')}
            onClick={() => setBugReportOpen(true)}
            sub={t('figmaOverview.reportHelp')}
          />
          <Row
            action={{ label: t('figmaOverview.feedback') }}
            icon='info'
            label={t('figmaOverview.about')}
            onClick={() => setFeedbackOpen(true)}
            sub={`Version ${import.meta.env.VITE_APP_VERSION || 'dev'}`}
          />
        </Section>
      </div>
      <FeedbackModal
        onClose={() => setFeedbackOpen(false)}
        open={feedbackOpen}
      />
      <ErrorReportModal
        onClose={() => setBugReportOpen(false)}
        open={bugReportOpen}
      />
    </div>
  )
}

export default SettingsOverview

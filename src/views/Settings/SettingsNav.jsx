import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import FigmaIcon from '../../components/FigmaIcon'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import {
  hasPermission,
  PERMISSIONS,
  resolveEffectiveRole,
} from '../../utils/PermissionModel'

/**
 * Categorized settings navigation rendered around every /settings/* route.
 *
 * Categories follow the product model: Profile (identity & presentation),
 * Account & security, Preferences, Notifications, Privacy, Billing & plan,
 * Integrations & data, Circle & family, and Advanced. Items that require
 * account management permissions are hidden for roles that cannot use them.
 */

const NavItem = ({ icon, label, to }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `figma-settings-nav-item${isActive ? ' active' : ''}`
    }
  >
    <FigmaIcon
      name={icon}
      size={16}
      style={{ color: 'var(--t-muted)', flexShrink: 0 }}
    />
    <span className='figma-settings-nav-item-label'>{label}</span>
  </NavLink>
)

const NavSection = ({ children, label }) =>
  children ? (
    <div className='figma-settings-nav-section'>
      <div className='figma-settings-nav-label'>{label}</div>
      {children}
    </div>
  ) : null

const SettingsNav = () => {
  const { t } = useTranslation('settings')
  const { data: profile, isLoading: profileLoading } = useUserProfile()
  const { data: membersData, isLoading: membersLoading } = useCircleMembers()

  if (profileLoading || membersLoading) return null

  const role = resolveEffectiveRole(profile, membersData?.res || [])
  const canManageAccount = hasPermission(role, PERMISSIONS.MANAGE_ACCOUNT)
  const canManageSubaccounts = hasPermission(
    role,
    PERMISSIONS.MANAGE_SUBACCOUNTS,
  )

  return (
    <nav className='figma-settings-nav' aria-label={t('settingsNav.title')}>
      <NavItem
        to='/settings'
        icon='settings'
        label={t('settingsNav.overview')}
      />
      <NavItem to='/profile' icon='user' label={t('settingsNav.profile')} />

      <NavSection label={t('settingsNav.accountSecurity')}>
        {canManageAccount && (
          <>
            <NavItem
              to='/settings/security'
              icon='lock'
              label={t('settingsNav.security')}
            />
            <NavItem
              to='/settings/mfa'
              icon='check'
              label={t('settingsNav.twoFactor')}
            />
          </>
        )}
        {canManageSubaccounts && (
          <NavItem
            to='/settings/subaccounts'
            icon='users'
            label={t('settingsNav.householdAccounts')}
          />
        )}
      </NavSection>

      <NavSection label={t('settingsNav.preferences')}>
        <NavItem
          to='/settings/theme'
          icon='star'
          label={t('settingsNav.theme')}
        />
        <NavItem
          to='/settings/localization'
          icon='flag'
          label={t('settingsNav.languageRegion')}
        />
        <NavItem
          to='/settings/sidepanel'
          icon='bars'
          label={t('settingsNav.sidepanel')}
        />
      </NavSection>

      <NavSection label={t('settingsNav.notificationsGroup')}>
        <NavItem
          to='/settings/notifications'
          icon='bell'
          label={t('settingsNav.notifications')}
        />
      </NavSection>

      <NavSection label={t('settingsNav.privacyGroup')}>
        <NavItem
          to='/settings/privacy'
          icon='eye'
          label={t('settingsNav.privacy')}
        />
      </NavSection>

      <NavSection label={t('settingsNav.billingGroup')}>
        {canManageAccount && (
          <NavItem
            to='/settings/account'
            icon='gift'
            label={t('settingsNav.billing')}
          />
        )}
      </NavSection>

      <NavSection label={t('settingsNav.integrationsGroup')}>
        <NavItem
          to='/settings/integrations'
          icon='repeat'
          label={t('settingsNav.integrations')}
        />
        <NavItem
          to='/settings/storage'
          icon='download'
          label={t('settingsNav.storage')}
        />
      </NavSection>

      <NavSection label={t('settingsNav.circleGroup')}>
        {canManageAccount && (
          <NavItem
            to='/settings/circle'
            icon='activity'
            label={t('settingsNav.circle')}
          />
        )}
      </NavSection>

      <NavSection label={t('settingsNav.advancedGroup')}>
        <NavItem
          to='/settings/advanced'
          icon='settings'
          label={t('settingsNav.advanced')}
        />
        <NavItem
          to='/settings/developer'
          icon='edit'
          label={t('settingsNav.developer')}
        />
      </NavSection>
    </nav>
  )
}

export default SettingsNav

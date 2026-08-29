import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import FigmaIcon, { LogoMark } from '../../components/FigmaIcon'
import UserProfileAvatar from '../../components/UserProfileAvatar'
import { APP_DISPLAY_NAME } from '../../config/AppBranding'
import { useLocalization } from '../../contexts/LocalizationContext'
import { resolveAppShellMode } from '../../navigation/appShellModel'
import { createNavLinkRegistry } from '../../navigation/navLinkRegistry'
import {
  buildNavSectionPlan,
  hasActiveFamilyCircle,
} from '../../navigation/navModel'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { useGlobalSearch } from '../../search/GlobalSearchContext'
import { apiClient } from '../../utils/ApiClient'
import ErrorReportModal from '../Modals/ErrorReportModal'
import FeedbackModal from '../Modals/FeedbackModal'
import SyncStatusIndicator from './SyncStatusIndicator'

const iconByLink = {
  home: 'home',
  allTasks: 'tasks',
  calendar: 'calendar',
  archived: 'tasks',
  maintenance: 'maintenance',
  routines: 'routines',
  categories: 'tag',
  projects: 'projects',
  shoppingLists: 'shopping',
  filters: 'tasks',
  familyProgress: 'users',
  points: 'gift',
  rewards: 'gift',
  activities: 'activity',
  profile: 'users',
  settings: 'settings',
  search: 'search',
  feedback: 'activity',
  bugReport: 'activity',
}

const NavBar = () => {
  const { t } = useTranslation('common')
  const { isRTL } = useLocalization()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: userProfile } = useUserProfile()
  const { data: circleMembersData } = useCircleMembers()
  const { openSearch } = useGlobalSearch()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [bugReportOpen, setBugReportOpen] = useState(false)
  const shellMode = resolveAppShellMode(location.pathname)

  useEffect(() => {
    if (!drawerOpen) return undefined
    const closeOnEscape = event => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [drawerOpen])
  const sections = useMemo(() => {
    const registry = createNavLinkRegistry({
      t,
      openSearch,
      openFeedback: () => setFeedbackOpen(true),
      openBugReport: () => setBugReportOpen(true),
    })
    return buildNavSectionPlan(
      hasActiveFamilyCircle(userProfile, circleMembersData?.res),
    ).map(section => ({
      ...section,
      links: section.linkIds
        .map(id => ({ ...registry[id], id }))
        .filter(link => link.label),
    }))
  }, [circleMembersData, openSearch, t, userProfile])
  if (shellMode === 'spacer')
    return <div style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }} />
  if (
    shellMode === 'none' ||
    ['www.donetick.com', 'donetick.com'].includes(window.location.hostname)
  )
    return null
  const activate = link => {
    if (link.onClick) link.onClick()
    else navigate(link.to)
    setDrawerOpen(false)
  }
  const navigation = mobile => (
    <nav
      className={
        mobile
          ? `figma-mobile-drawer${isRTL ? ' figma-mobile-drawer--rtl' : ''}`
          : `sidebar${isRTL ? ' sidebar--rtl' : ''}`
      }
      aria-label={t('navigation.mainNavigation')}
    >
      <div className='figma-brand'>
        <LogoMark size={28} />
        <div>
          <strong>{APP_DISPLAY_NAME}</strong>
          <small>FOCUS MODE</small>
        </div>
        <button
          className='btn btn-ghost btn-icon'
          onClick={() => navigate('/chores/create')}
          aria-label={t('addTask')}
        >
          <FigmaIcon name='plus' size={16} />
        </button>
      </div>
      <div className='figma-nav-scroll'>
        {sections.map(section => (
          <div key={section.id}>
            <div className='section-label'>
              {t(`navigation.sections.${section.id}`)}
            </div>
            {section.links.map(link => (
              <button
                key={link.id}
                className={`nav-item ${location.pathname === link.to ? 'active' : ''}`}
                onClick={() => activate(link)}
              >
                <FigmaIcon name={iconByLink[link.id]} size={15} />
                <span>{link.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className='figma-nav-footer'>
        <button className='nav-item' onClick={() => apiClient.handleLogout()}>
          <FigmaIcon name='x' size={15} />
          <span>{t('logout')}</span>
        </button>
        <div
          className='figma-profile'
          onClick={() => navigate('/settings/profile')}
        >
          <UserProfileAvatar />
          <span>
            {userProfile?.displayName || userProfile?.name || t('profile')}
          </span>
        </div>
      </div>
    </nav>
  )
  return (
    <>
      {navigation(false)}
      <header className='figma-topbar'>
        <button
          className='figma-menu-button'
          onClick={() => setDrawerOpen(true)}
          aria-label={t('navigation.openMenu')}
        >
          <LogoMark size={22} />
          <span>{APP_DISPLAY_NAME}</span>
        </button>
        <button className='figma-search-button' onClick={openSearch}>
          <FigmaIcon name='search' size={14} />
          <span>{t('navigation.search')}</span>
          <kbd>Ctrl K</kbd>
        </button>
        <div className='figma-top-actions'>
          <div className='figma-sync-status'>
            <SyncStatusIndicator />
          </div>
          <button
            className='btn btn-ghost btn-icon'
            onClick={() => navigate('/notifications')}
            aria-label={t('navigation.notifications')}
          >
            <FigmaIcon name='bell' />
          </button>
          <button
            className='btn btn-primary btn-icon'
            onClick={() => navigate('/chores/create')}
            aria-label={t('addTask')}
          >
            <FigmaIcon name='plus' />
          </button>
          <div className='figma-top-avatar'>
            <UserProfileAvatar />
          </div>
        </div>
      </header>
      {drawerOpen && (
        <div
          className='figma-drawer-backdrop'
          onClick={() => setDrawerOpen(false)}
        >
          <div
            dir={isRTL ? 'rtl' : undefined}
            onClick={event => event.stopPropagation()}
          >
            {navigation(true)}
          </div>
        </div>
      )}
      <nav className='mobile-nav' aria-label={t('navigation.mainNavigation')}>
        {['home', 'allTasks', 'calendar', 'shoppingLists', 'settings'].map(
          id => {
            const link = sections
              .flatMap(section => section.links)
              .find(item => item.id === id)
            return (
              link && (
                <button
                  key={id}
                  className={location.pathname === link.to ? 'active' : ''}
                  onClick={() => activate(link)}
                >
                  <FigmaIcon name={iconByLink[id]} size={20} />
                  <span>{link.label}</span>
                </button>
              )
            )
          },
        )}
      </nav>
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
      <ErrorReportModal
        open={bugReportOpen}
        onClose={() => setBugReportOpen(false)}
      />
    </>
  )
}

export default NavBar

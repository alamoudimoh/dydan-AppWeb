import { Capacitor } from '@capacitor/core'
import {
  ArrowBack,
  Logout,
  MenuRounded,
  Notifications,
} from '@mui/icons-material'
import {
  Badge,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Typography,
} from '@mui/joy'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { version } from '../../../package.json'
import UserProfileAvatar from '../../components/UserProfileAvatar'
import Z_INDEX from '../../constants/zIndex'
import { useLocalization } from '../../contexts/LocalizationContext'
import NavBarSections from '../../navigation/NavBarSections'
import { createNavLinkRegistry } from '../../navigation/navLinkRegistry'
import { APP_DISPLAY_NAME } from '../../config/AppBranding'
import {
  navBrandSx,
  navDrawerContentSx,
  navDrawerFooterSx,
  navDrawerScrollSx,
  navItemButtonSx,
} from '../../navigation/navStyles'
import {
  buildNavSectionPlan,
  hasActiveFamilyCircle,
} from '../../navigation/navModel'
import { useNotificationCount } from '../../queries/NotificationQueries'
import { useResource } from '../../queries/ResourceQueries'
import { useUserProfile } from '../../queries/UserQueries'
import { useGlobalSearch } from '../../search/GlobalSearchContext'
import { apiClient } from '../../utils/ApiClient'
import ErrorReportModal from '../Modals/ErrorReportModal'
import FeedbackModal from '../Modals/FeedbackModal'
import SyncStatusIndicator from './SyncStatusIndicator'

const publicPages = ['/landing', '/privacy', '/terms']

const NavBar = () => {
  const { t } = useTranslation('common')
  const { isRTL } = useLocalization()
  const { data: resource } = useResource()
  const { data: userProfile } = useUserProfile()
  const { openSearch } = useGlobalSearch()

  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [bugReportOpen, setBugReportOpen] = useState(false)
  const { data: notificationCount } = useNotificationCount()

  const navSections = useMemo(() => {
    const registry = createNavLinkRegistry({
      t,
      openSearch,
      openFeedback: () => setFeedbackOpen(true),
      openBugReport: () => setBugReportOpen(true),
    })
    const plan = buildNavSectionPlan(hasActiveFamilyCircle(userProfile))
    return plan.map(section => ({
      id: section.id,
      links: section.linkIds
        .map(linkId => {
          const link = registry[linkId]
          if (!link) return null
          return { ...link, id: linkId }
        })
        .filter(Boolean),
    }))
  }, [t, openSearch, userProfile])

  const closeDrawer = () => setDrawerOpen(false)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const getMenuIcon = () => {
    const menuRounded = (
      <IconButton
        size='md'
        variant='plain'
        onClick={() => setDrawerOpen(true)}
        aria-label={t('navigation.openMenu')}
        title={t('navigation.openMenu')}
      >
        <MenuRounded />
      </IconButton>
    )
    if (location.pathname === '/search') {
      return (
        <IconButton
          size='md'
          variant='plain'
          onClick={() => {
            if (window.history.state?.idx > 0) navigate(-1)
            else navigate('/chores', { replace: true })
          }}
          aria-label='Back from search'
          title={t('back')}
        >
          <ArrowBack />
        </IconButton>
      )
    }
    if (!Capacitor.isNativePlatform()) {
      return menuRounded
    }
    if (
      ['/chores', '/'].includes(location.pathname) &&
      !searchParams.get('filterId')
    ) {
      return menuRounded
    }
    return (
      <IconButton
        size='md'
        variant='plain'
        onClick={() => {
          if (location.pathname === '/chores') {
            navigate('/')
          } else {
            navigate(-1)
          }
        }}
        title={
          searchParams.get('from') === 'calendar'
            ? t('backToCalendar')
            : t('back')
        }
      >
        <ArrowBack />
      </IconButton>
    )
  }

  if (
    [
      '/signup',
      '/login',
      '/auth/oauth2',
      '/forgot-password',
      '/password/update',
      '/login/settings',
      '/welcome',
      '/onboarding',
      '/get-started',
      '/ready',
      '/circle/join',
    ].includes(location.pathname)
  ) {
    return (
      <div
        style={{
          paddingTop: `calc(var(--safe-area-inset-top, 0px))`,
          top: 0,
        }}
      />
    )
  }
  if (publicPages.includes(location.pathname)) {
    return null
  }
  if (
    window.location.hostname === 'www.donetick.com' ||
    window.location.hostname === 'donetick.com'
  ) {
    return null
  }

  return (
    <nav
      className='flex gap-2'
      style={{
        padding: '12px 16px',
        paddingTop:
          Capacitor.getPlatform() === 'android'
            ? `calc(12px + var(--safe-area-inset-top, 0px))`
            : '12px',
        position: 'sticky',
        zIndex: Z_INDEX.NAVBAR,
        top: 0,
        minHeight: '35px',
        backgroundColor: 'var(--joy-palette-background-body)',
        borderBottom: '1px solid var(--taskier-boundary)',
      }}
    >
      {getMenuIcon()}
      <Box className='flex-1' />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SyncStatusIndicator />
        <IconButton
          aria-label={t('navigation.notifications')}
          title={t('navigation.notifications')}
          variant='plain'
          onClick={() => navigate('/notifications')}
        >
          <Badge
            badgeContent={notificationCount?.unreadCount || 0}
            color='danger'
            invisible={!notificationCount?.unreadCount}
            size='sm'
          >
            <Notifications />
          </Badge>
        </IconButton>
        <UserProfileAvatar />
      </Box>
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        anchor={isRTL ? 'right' : 'left'}
        slotProps={{
          content: {
            className: 'safe-area-x',
            sx: {
              ...navDrawerContentSx,
              position: 'fixed',
              ...(isRTL ? { right: 0 } : { left: 0 }),
              zIndex: Z_INDEX.DRAWER,
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={navDrawerScrollSx}>
          <Typography component='p' sx={navBrandSx}>
            {APP_DISPLAY_NAME}
          </Typography>
          <NavBarSections
            sections={navSections}
            onItemActivate={closeDrawer}
          />
        </Box>
        <Box sx={navDrawerFooterSx}>
          <List size='md' sx={{ p: 0, gap: 0 }}>
            <ListItemButton
              onClick={() => apiClient.handleLogout()}
              variant='plain'
              color='neutral'
              sx={navItemButtonSx(false)}
            >
              <ListItemDecorator>
                <Logout />
              </ListItemDecorator>
              <ListItemContent sx={{ fontSize: 'sm' }}>
                {t('logout')}
              </ListItemContent>
            </ListItemButton>
          </List>
          <Typography
            onClick={() => window.location.reload(true)}
            level='body-xs'
            sx={{
              py: 0.75,
              color: 'text.tertiary',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            V{version} (API: {resource?.api_version || 'unavailable'})
          </Typography>
        </Box>
      </Drawer>
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
      <ErrorReportModal
        open={bugReportOpen}
        onClose={() => setBugReportOpen(false)}
      />
    </nav>
  )
}

export default NavBar

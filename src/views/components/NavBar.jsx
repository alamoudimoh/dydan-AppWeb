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
import { APP_DISPLAY_NAME } from '../../config/AppBranding'
import Z_INDEX from '../../constants/zIndex'
import { useLocalization } from '../../contexts/LocalizationContext'
import { resolveAppShellMode } from '../../navigation/appShellModel'
import NavBarSections from '../../navigation/NavBarSections'
import { createNavLinkRegistry } from '../../navigation/navLinkRegistry'
import {
  buildNavSectionPlan,
  hasActiveFamilyCircle,
} from '../../navigation/navModel'
import {
  navBrandSx,
  navDrawerContentSx,
  navDrawerFooterSx,
  navDrawerScrollSx,
  navHeaderSx,
  navItemButtonSx,
  navSidebarSx,
} from '../../navigation/navStyles'
import { useNotificationCount } from '../../queries/NotificationQueries'
import { useResource } from '../../queries/ResourceQueries'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { useGlobalSearch } from '../../search/GlobalSearchContext'
import { apiClient } from '../../utils/ApiClient'
import ErrorReportModal from '../Modals/ErrorReportModal'
import FeedbackModal from '../Modals/FeedbackModal'
import SyncStatusIndicator from './SyncStatusIndicator'

const NavBar = () => {
  const { t } = useTranslation('common')
  const { isRTL } = useLocalization()
  const { data: resource } = useResource()
  const { data: userProfile } = useUserProfile()
  const { data: circleMembersData } = useCircleMembers()
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
    const plan = buildNavSectionPlan(
      hasActiveFamilyCircle(userProfile, circleMembersData),
    )
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
  }, [t, openSearch, userProfile, circleMembersData])

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
          <ArrowBack className='rtl-flip' />
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
        <ArrowBack className='rtl-flip' />
      </IconButton>
    )
  }

  const shellMode = resolveAppShellMode(location.pathname)
  if (shellMode === 'spacer') {
    return (
      <div
        style={{
          paddingTop: `calc(var(--safe-area-inset-top, 0px))`,
          top: 0,
        }}
      />
    )
  }
  if (shellMode === 'none') {
    return null
  }
  if (
    window.location.hostname === 'www.donetick.com' ||
    window.location.hostname === 'donetick.com'
  ) {
    return null
  }

  const renderNavigationContent = onActivate => (
    <>
      <Box sx={navDrawerScrollSx}>
        <Typography component='p' sx={navBrandSx}>
          {APP_DISPLAY_NAME}
        </Typography>
        <NavBarSections sections={navSections} onItemActivate={onActivate} />
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
    </>
  )

  return (
    <>
      <Box component='aside' sx={navSidebarSx}>
        {renderNavigationContent(undefined)}
      </Box>
      <Box component='header' sx={{ ...navHeaderSx, zIndex: Z_INDEX.NAVBAR }}>
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>{getMenuIcon()}</Box>
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
        {renderNavigationContent(closeDrawer)}
      </Drawer>
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

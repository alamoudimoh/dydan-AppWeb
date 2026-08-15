import {
  Archive,
  BugReport,
  Build,
  CalendarMonthRounded,
  CardGiftcard,
  Feedback,
  FilterAlt,
  FolderOpen,
  Groups,
  History,
  HomeRounded,
  Inbox,
  ListAlt,
  Person,
  PlaylistAddCheck,
  SearchRounded,
  SettingsOutlined,
  Toll,
} from '@mui/icons-material'

import { NAV_LINK_IDS } from '../navigation/navModel'

/**
 * Maps nav link ids to routes, labels, icons, and optional actions.
 * Labels are i18n keys under the `common` namespace unless `label` is set.
 */
export const createNavLinkRegistry = ({
  openBugReport,
  openFeedback,
  openSearch,
  t,
}) => ({
  [NAV_LINK_IDS.HOME]: {
    to: '/',
    label: t('navigation.home'),
    icon: <HomeRounded />,
  },
  [NAV_LINK_IDS.SEARCH]: {
    label: t('navigation.search'),
    icon: <SearchRounded />,
    onClick: () => openSearch(),
  },
  [NAV_LINK_IDS.ALL_TASKS]: {
    to: '/chores',
    label: t('navigation.allTasks'),
    icon: <Inbox />,
  },
  [NAV_LINK_IDS.CALENDAR]: {
    to: '/calendar',
    label: t('navigation.calendar'),
    icon: <CalendarMonthRounded />,
  },
  [NAV_LINK_IDS.FAMILY_PROGRESS]: {
    to: '/family',
    label: t('navigation.familyProgress', {
      defaultValue: 'Family Progress',
    }),
    icon: <Groups />,
  },
  [NAV_LINK_IDS.ARCHIVED]: {
    to: '/archived',
    label: t('navigation.archived'),
    icon: <Archive />,
  },
  [NAV_LINK_IDS.MAINTENANCE]: {
    to: '/maintenance',
    label: t('navigation.maintenance'),
    icon: <Build />,
  },
  [NAV_LINK_IDS.ROUTINES]: {
    to: '/routines',
    label: t('navigation.routines'),
    icon: <PlaylistAddCheck />,
  },
  [NAV_LINK_IDS.CATEGORIES]: {
    to: 'labels',
    label: t('navigation.categories'),
    icon: <ListAlt />,
  },
  [NAV_LINK_IDS.PROJECTS]: {
    to: 'projects',
    label: t('navigation.projects'),
    icon: <FolderOpen />,
  },
  [NAV_LINK_IDS.FILTERS]: {
    to: 'filters',
    label: t('navigation.filters'),
    icon: <FilterAlt />,
  },
  [NAV_LINK_IDS.ACTIVITIES]: {
    to: 'activities',
    label: t('navigation.activities'),
    icon: <History />,
  },
  [NAV_LINK_IDS.POINTS]: {
    to: 'points',
    label: t('navigation.points'),
    icon: <Toll />,
  },
  [NAV_LINK_IDS.REWARDS]: {
    to: 'rewards',
    label: t('navigation.rewards'),
    icon: <CardGiftcard />,
  },
  [NAV_LINK_IDS.PROFILE]: {
    to: '/settings/profile',
    label: t('navigation.profile'),
    icon: <Person />,
  },
  [NAV_LINK_IDS.SETTINGS]: {
    to: '/settings',
    label: t('navigation.settings'),
    icon: <SettingsOutlined />,
  },
  [NAV_LINK_IDS.FEEDBACK]: {
    label: t('navigation.sendFeedback'),
    icon: <Feedback />,
    onClick: () => openFeedback(),
  },
  [NAV_LINK_IDS.BUG_REPORT]: {
    label: t('navigation.reportBug'),
    icon: <BugReport />,
    onClick: () => openBugReport(),
  },
})

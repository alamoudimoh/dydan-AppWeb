import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import App from '@/App'
import ChoreEdit from '@/views/ChoreEdit/ChoreEdit'
import Error from '@/views/Error'
import AccountSettings from '@/views/Settings/AccountSettings'
import AdvancedSettings from '@/views/Settings/AdvancedSettings'
import ChildUserSettings from '@/views/Settings/ChildUserSettings'
import CircleSettings from '@/views/Settings/CircleSettings'
import DeveloperSettings from '@/views/Settings/DeveloperSettings'
import Settings from '@/views/Settings/Settings'
import SettingsOverview from '@/views/Settings/SettingsOverview'
import SettingsPermissionGuard from '@/views/Settings/SettingsPermissionGuard'
import SettingsRoutes from '@/views/Settings/SettingsRoutes'
import ThemeSettings from '@/views/Settings/ThemeSettings'

import GlobalSearchPage from '../search/GlobalSearchPage'
import { PERMISSIONS } from '../utils/PermissionModel'
import AuthenticationLoading from '../views/Authorization/Authenticating'
import ForgotPasswordView from '../views/Authorization/ForgotPasswordView'
import LoginSettings from '../views/Authorization/LoginSettings'
import LoginView from '../views/Authorization/LoginView'
import SignupView from '../views/Authorization/Signup'
import UpdatePasswordView from '../views/Authorization/UpdatePasswordView'
import CalendarView from '../views/Calendar/CalendarView'
import CategoryView from '../views/Categories/CategoryView'
import ChoreView from '../views/ChoreEdit/ChoreView'
import ArchivedTasks from '../views/Chores/ArchivedTasks'
import MyChores from '../views/Chores/MyChores'
import JoinCircleView from '../views/Circles/JoinCircle'
import NotFound from '../views/components/NotFound'
import Dashboard from '../views/Dashboard/Dashboard'
import FamilyProgress from '../views/FamilyProgress/FamilyProgress'
import FilterView from '../views/Filters/FilterView'
import ChoreHistory from '../views/History/ChoreHistory'
import Landing from '../views/Landing/Landing'
import MaintenanceView, {
  AssetDetail,
} from '../views/Maintenance/MaintenanceView'
import MetersView from '../views/Meters/MetersView'
import NotificationsView from '../views/Notifications/NotificationsView'
import CircleSetupView from '../views/Onboarding/CircleSetupView'
import GetStartedView from '../views/Onboarding/GetStartedView'
import HeardAboutView from '../views/Onboarding/HeardAboutView'
import OnboardingView from '../views/Onboarding/OnboardingView'
import WorkspaceReadyView from '../views/Onboarding/WorkspaceReadyView'
import PaymentCancelledView from '../views/Payments/PaymentFailView'
import PaymentSuccessView from '../views/Payments/PaymentSuccessView'
import PrivacyPolicyView from '../views/PrivacyPolicy/PrivacyPolicyView'
import ProjectView from '../views/Projects/ProjectView'
import RewardsView from '../views/Rewards/RewardsView'
import RoutinesView from '../views/Routines/RoutinesView'
import APITokenSettings from '../views/Settings/APITokenSettings'
import LocalizationSettings from '../views/Settings/LocalizationSettings'
import MFASettings from '../views/Settings/MFASettings'
import NotificationSetting from '../views/Settings/NotificationSetting'
import ProfileSettings from '../views/Settings/ProfileSettings'
import SidepanelSettings from '../views/Settings/SidepanelSettings'
import StorageSettings from '../views/Settings/StorageSettings'
import TermsView from '../views/Terms/TermsView'
import TestView from '../views/TestView/Test'
import ThingsHistory from '../views/Things/ThingsHistory'
import ThingsView from '../views/Things/ThingsView'
import TimerDetails from '../views/Timer/TimerDetails'
import UserActivities from '../views/User/UserActivities'
import UserPoints from '../views/User/UserPoints'

const restrictedSetting = (permission, element) => (
  <SettingsPermissionGuard permission={permission}>
    {element}
  </SettingsPermissionGuard>
)

const Router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <Error />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/settings',
        element: <SettingsRoutes />,
        children: [
          {
            index: true,
            element: <SettingsOverview />,
          },
          {
            path: 'detailed',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <Settings />,
            ),
          },
          {
            path: 'profile',
            element: <ProfileSettings />,
          },
          {
            path: 'circle',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <CircleSettings />,
            ),
          },
          {
            path: 'account',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <AccountSettings />,
            ),
          },
          {
            path: 'subaccounts',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_SUBACCOUNTS,
              <ChildUserSettings />,
            ),
          },
          {
            path: 'notifications',
            element: <NotificationSetting />,
          },
          {
            path: 'mfa',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <MFASettings />,
            ),
          },
          {
            path: 'apitokens',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <APITokenSettings />,
            ),
          },
          {
            path: 'storage',
            element: <StorageSettings />,
          },
          {
            path: 'sidepanel',
            element: <SidepanelSettings />,
          },
          {
            path: 'theme',
            element: <ThemeSettings />,
          },
          {
            path: 'localization',
            element: <LocalizationSettings />,
          },
          {
            path: 'advanced',
            element: <AdvancedSettings />,
          },
          {
            path: 'developer',
            element: <DeveloperSettings />,
          },
        ],
      },
      {
        path: '/chores',
        element: <MyChores />,
      },
      {
        path: '/calendar',
        element: <CalendarView />,
      },
      {
        path: '/family',
        element: <FamilyProgress />,
      },
      {
        path: '/search',
        element: <GlobalSearchPage />,
      },
      {
        path: '/archived',
        element: <ArchivedTasks />,
      },
      {
        path: '/chores/:choreId/edit',
        element: <ChoreEdit />,
      },
      {
        path: '/chores/:choreId',
        element: <ChoreView />,
      },
      {
        path: '/chores/create',
        element: <ChoreEdit />,
      },
      {
        path: '/chores/:choreId/history',
        element: <ChoreHistory />,
      },
      {
        path: '/chores/:choreId/timer',
        element: <TimerDetails />,
      },
      {
        path: '/my/chores',
        element: <MyChores />,
      },
      {
        path: '/activities',
        element: <UserActivities />,
      },
      {
        path: '/points',
        element: <UserPoints />,
      },
      {
        path: '/rewards',
        element: <RewardsView />,
      },
      {
        path: '/notifications',
        element: <NotificationsView />,
      },
      {
        path: '/login',
        element: <LoginView />,
      },
      {
        path: '/login/settings',
        element: <LoginSettings />,
      },
      {
        path: '/signup',
        element: <SignupView />,
      },
      {
        path: '/onboarding',
        element: <OnboardingView />,
      },
      {
        path: '/get-started',
        element: <GetStartedView />,
      },
      {
        path: '/ready',
        element: <WorkspaceReadyView />,
      },
      {
        path: '/circle-setup',
        element: <CircleSetupView />,
      },
      {
        path: '/heard-about',
        element: <HeardAboutView />,
      },

      {
        path: '/auth/:provider',
        element: <AuthenticationLoading />,
      },
      {
        path: '/welcome',
        element: <Landing />,
      },
      {
        path: '/test',
        element: <TestView />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordView />,
      },
      {
        path: '/password/update',
        element: <UpdatePasswordView />,
      },
      {
        path: '/privacy',
        element: <PrivacyPolicyView />,
      },
      {
        path: '/terms',
        element: <TermsView />,
      },
      {
        path: 'circle/join',
        element: <JoinCircleView />,
      },
      {
        path: 'payments/success',
        element: <PaymentSuccessView />,
      },
      {
        path: 'payments/cancel',
        element: <PaymentCancelledView />,
      },
      {
        path: 'things',
        element: <ThingsView />,
      },
      {
        path: 'meters',
        element: <MetersView />,
      },
      {
        path: 'maintenance',
        element: <MaintenanceView />,
      },
      {
        path: 'routines',
        element: <RoutinesView />,
      },
      {
        path: 'maintenance/assets/:id',
        element: <AssetDetail />,
      },
      {
        path: 'things/:id',
        element: <ThingsHistory />,
      },
      {
        path: 'labels/',
        element: <CategoryView />,
      },
      {
        path: 'projects/',
        element: <ProjectView />,
      },
      {
        path: 'filters/',
        element: <FilterView />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])

const RouterContext = ({ children }) => {
  return <RouterProvider router={Router} />
}

export default RouterContext
